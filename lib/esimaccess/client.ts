const BASE_URL = "https://api.esimaccess.com";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ESimPackage {
  packageCode: string;
  slug: string;
  name: string;
  price: number; // value * 10000 (10000 = $1.00)
  currencyCode: string;
  volume: number; // bytes
  unusedValidTime: number;
  duration: number;
  durationUnit: string; // DAY, etc.
  location: string;
  description: string;
  activeType: number;
  retailPrice?: number;
  suitableFor?: string;
}

export interface ESimLocation {
  code: string;
  name: string;
  type: number; // 1 = single-country, 2 = multi-country
  subLocationList: Array<{ code: string; name: string }> | null;
}

export interface ESimOrderItem {
  esimTranNo: string;
  iccid: string;
  ac?: string; // activation code
  smdpAddress?: string;
  qrCodeUrl?: string;
}

export interface ESimOrderResponse {
  orderNo: string;
  esimList: ESimOrderItem[];
}

export interface ESimQueryResult {
  esimTranNo: string;
  orderNo: string;
  iccid: string;
  esimStatus: string; // GOT_RESOURCE, IN_USE, USED_UP, USED_EXPIRED, UNUSED_EXPIRED, CANCEL, REVOKED
  smdpStatus: string;
  qrCodeUrl?: string;
  ac?: string;
  smdpAddress?: string;
  packageCode?: string;
  packageName?: string;
  expiredTime?: string;
  totalVolume?: number;
  orderUsage?: number;
}

export interface ESimUsageResult {
  esimTranNo: string;
  dataUsage: number;  // bytes used
  totalData: number;  // total bytes
  lastUpdateTime: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export class ESimAccessClient {
  private get accessCode() {
    return process.env.ESIMACCESS_ACCESS_CODE ?? "";
  }

  private requireAccessCode() {
    if (!this.accessCode) throw new Error("ESIMACCESS_ACCESS_CODE env var is required");
  }

  private async post<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
    this.requireAccessCode();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "RT-AccessCode": this.accessCode,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`eSIM Access request failed (${res.status}): ${text}`);
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`eSIM Access returned non-JSON: ${text}`);
    }

    if (!data.success) {
      throw new Error(data.errorMessage || data.errorMsg || `eSIM Access error: ${data.errorCode}`);
    }

    return data.obj as T;
  }

  // ── Packages ─────────────────────────────────────────────────────────────

  async listPackages(filters: {
    locationCode?: string;
    type?: "BASE" | "TOPUP";
    packageCode?: string;
    slug?: string;
    iccid?: string;
    dataType?: "1" | "2";
  } = {}): Promise<{ packageList: ESimPackage[] }> {
    const body: Record<string, unknown> = {};
    if (filters.locationCode) body.locationCode = filters.locationCode;
    if (filters.type) body.type = filters.type;
    if (filters.packageCode) body.packageCode = filters.packageCode;
    if (filters.slug) body.slug = filters.slug;
    if (filters.iccid) body.iccid = filters.iccid;
    if (filters.dataType) body.dataType = filters.dataType;
    return this.post<{ packageList: ESimPackage[] }>("/api/v1/open/package/list", body);
  }

  async listLocations(): Promise<{ locationList: ESimLocation[] }> {
    return this.post<{ locationList: ESimLocation[] }>("/api/v1/open/location/list", {});
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  async orderEsim(params: {
    packageCode: string;
    count: number;
    price: number; // in provider units (10000 = $1.00)
    transactionId: string;
  }): Promise<ESimOrderResponse> {
    return this.post<ESimOrderResponse>("/api/v1/open/esim/order", {
      packageInfoList: [
        {
          packageCode: params.packageCode,
          count: params.count,
          price: params.price,
        },
      ],
      transactionId: params.transactionId,
    });
  }

  async queryEsim(params: { esimTranNo?: string; iccid?: string; orderNo?: string }): Promise<{ esimList: ESimQueryResult[] }> {
    const body: Record<string, unknown> = {};
    if (params.esimTranNo) body.esimTranNo = params.esimTranNo;
    if (params.iccid) body.iccid = params.iccid;
    if (params.orderNo) body.orderNo = params.orderNo;
    return this.post<{ esimList: ESimQueryResult[] }>("/api/v1/open/esim/query", body);
  }

  async cancelEsim(params: { esimTranNo?: string; iccid?: string }): Promise<{}> {
    const body: Record<string, unknown> = {};
    if (params.esimTranNo) body.esimTranNo = params.esimTranNo;
    if (params.iccid) body.iccid = params.iccid;
    return this.post<{}>("/api/v1/open/esim/cancel", body);
  }

  async checkUsage(esimTranNoList: string[]): Promise<{ esimUsageList: ESimUsageResult[] }> {
    return this.post<{ esimUsageList: ESimUsageResult[] }>("/api/v1/open/esim/usage/query", {
      esimTranNoList,
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Convert provider price units to USD: 10000 units = $1.00 */
  static priceToUsd(providerPrice: number): number {
    return providerPrice / 10000;
  }

  /** Convert USD to provider price units */
  static usdToProviderPrice(usd: number): number {
    return Math.round(usd * 10000);
  }

  /** Format bytes to human-readable (e.g. "1 GB") */
  static formatBytes(bytes: number): string {
    if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
}

export const esimAccessClient = new ESimAccessClient();
