const PVADEALS_BASE_URL = "https://prod-v3.pvadeals.com";

export interface PVADealsService {
  _id: string;
  name: string;
  picture: string;
  country: string;
  STRprice: number;
  LTR3price: number;
  LTR7price: number;
  LTR14price: number;
  LTR30price: number;
}

export interface PVADealsRequest {
  _id: string;
  serviceName: string;
  serviceId: string;
  number: string;
  status: "RESERVED" | "COMPLETED" | "FLAGGED" | "TIMEOUT";
  country: string;
  amount: number;
  numberType: "STR" | "LTR";
  allowFlag: boolean;
  allowReuse: boolean;
  reuseCounter: number;
  endTime: string;
  createdAt: string;
}

class PVADealsClient {
  private get baseUrl() {
    return process.env.PVADEALS_API_URL ?? PVADEALS_BASE_URL;
  }

  private get apiKey() {
    return process.env.PVADEALS_API_KEY ?? "";
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.apiKey) throw new Error("PVADEALS_API_KEY env var is required");

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`PVADeals ${method} ${path} failed (${res.status}): ${text}`);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`PVADeals returned non-JSON for ${path}: ${text}`);
    }
  }

  async getBalance(): Promise<{ credits: number }> {
    const res = await this.request<{ success: boolean; data: { credits: number } }>(
      "GET",
      "/v3/api/balance"
    );
    return { credits: res.data.credits };
  }

  async getServices(): Promise<PVADealsService[]> {
    const res = await this.request<{ success: boolean; data: { services: PVADealsService[] } }>(
      "GET",
      "/v3/api/services/all"
    );
    return res.data.services;
  }

  async getWhatsAppService(): Promise<PVADealsService | null> {
    const services = await this.getServices();
    return (
      services.find(
        (s) => s.name.toLowerCase() === "whatsapp" && s.country === "USA"
      ) ?? null
    );
  }

  async purchaseNumber(serviceId: string, areaCode?: string): Promise<PVADealsRequest> {
    const serviceEntry: Record<string, string> = { serviceId };
    if (areaCode) serviceEntry.areaCode = areaCode;

    const res = await this.request<{
      success: boolean;
      data: { requests: PVADealsRequest[] };
      message: string;
    }>("POST", "/v3/api/purchase", { services: [serviceEntry] });

    const purchased = res.data.requests?.[0];
    if (!purchased) throw new Error("PVADeals purchase returned no request");
    return purchased;
  }

  async flagNumber(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean; data: boolean }>(
      "POST",
      `/v3/api/flag/${id}`
    );
    return res.data;
  }

  async reuseNumber(id: string): Promise<PVADealsRequest> {
    const res = await this.request<{ success: boolean; data: PVADealsRequest }>(
      "POST",
      `/v3/api/reuse/${id}`
    );
    return res.data;
  }

  async getRequest(id: string): Promise<PVADealsRequest> {
    const res = await this.request<{ success: boolean; data: PVADealsRequest }>(
      "GET",
      `/v3/api/request/${id}`
    );
    return res.data;
  }
}

export const pvadealsClient = new PVADealsClient();
