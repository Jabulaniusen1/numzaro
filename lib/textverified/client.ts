const DEFAULT_BASE_URL = "https://www.textverified.com";

type TokenCache = {
  token: string;
  expiresAt: number;
};

export interface TextVerifiedService {
  serviceName: string;
}

export interface TextVerifiedAreaCode {
  areaCode: string;
  state: string;
}

export interface TextVerifiedVerification {
  id: string;
  number: string;
  createdAt: string;
  endsAt?: string | null;
  serviceName: string;
  state: string;
  totalCost?: number | null;
  cancel?: {
    canCancel?: boolean;
    link?: { href?: string | null; method?: string | null };
  };
}

export interface TextVerifiedSms {
  id: string;
  from: string | null;
  to: string;
  createdAt: string;
  smsContent: string | null;
  parsedCode: string | null;
  encrypted: boolean;
}

export interface TextVerifiedLink {
  href?: string | null;
  method?: string | null;
}

export interface TextVerifiedReservation {
  id: string;
  link: TextVerifiedLink;
  reservationType: "verification" | "renewable" | "nonrenewable";
  serviceName: string;
}

export interface TextVerifiedSale {
  id: string;
  state: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  reservations: TextVerifiedReservation[];
  backOrderReservations: Array<{ id: string; status: string }>;
}

export interface TextVerifiedRenewableRental {
  id: string;
  number: string;
  endsAt?: string | null;
  serviceName: string;
  state: string;
  billingCycleId: string;
}

export interface TextVerifiedNonrenewableRental {
  id: string;
  number: string;
  endsAt: string;
  serviceName: string;
  state: string;
}

class TextVerifiedClient {
  private tokenCache: TokenCache | null = null;

  private get apiKey() {
    return process.env.TEXTVERIFIED_API_KEY ?? "";
  }

  private get username() {
    return (
      process.env.TEXTVERIFIED_API_USERNAME ??
      process.env.TEXTVERIFIED_API_EMAIL ??
      ""
    );
  }

  private get baseUrl() {
    return process.env.TEXTVERIFIED_API_URL ?? DEFAULT_BASE_URL;
  }

  private async getToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt - 30_000) {
      return this.tokenCache.token;
    }

    if (!this.apiKey || !this.username) {
      throw new Error(
        "TEXTVERIFIED_API_KEY and TEXTVERIFIED_API_USERNAME env vars are required"
      );
    }

    const res = await fetch(`${this.baseUrl}/api/pub/v2/auth`, {
      method: "POST",
      headers: {
        "X-API-KEY": this.apiKey,
        "X-API-USERNAME": this.username,
      },
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Textverified auth failed (${res.status}): ${text}`);
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Textverified auth returned non-JSON: ${text}`);
    }

    const token = String(data?.token || "");
    if (!token) {
      throw new Error("Textverified auth did not return a token");
    }

    const expiresAtMs = data?.expiresAt
      ? Date.parse(data.expiresAt)
      : Date.now() + Number(data?.expiresIn || 0) * 1000;

    this.tokenCache = {
      token,
      expiresAt: Number.isFinite(expiresAtMs)
        ? expiresAtMs
        : Date.now() + 55 * 60 * 1000,
    };

    return token;
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ) {
    const url = path.startsWith("http") ? new URL(path) : new URL(path, this.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async requestRaw(
    path: string,
    options?: {
      method?: string;
      query?: Record<string, string | number | boolean | undefined>;
      body?: any;
    }
  ) {
    const token = await this.getToken();
    const url = this.buildUrl(path, options?.query);
    const hasBody = typeof options?.body !== "undefined";
    const res = await fetch(url, {
      method: options?.method ?? (hasBody ? "POST" : "GET"),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        "User-Agent": "Numzaro/1.0",
      },
      body: hasBody ? JSON.stringify(options?.body) : undefined,
      cache: "no-store",
    });
    return res;
  }

  private async requestJson<T>(
    path: string,
    options?: {
      method?: string;
      query?: Record<string, string | number | boolean | undefined>;
      body?: any;
    }
  ): Promise<T> {
    const res = await this.requestRaw(path, options);
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Textverified request failed (${res.status}): ${text}`);
    }
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Textverified returned non-JSON: ${text}`);
    }
  }

  async getAccount() {
    return this.requestJson<{ username: string; currentBalance: number }>(
      "/api/pub/v2/account/me"
    );
  }

  async getServicesList(params?: {
    numberType?: "mobile" | "voip" | "landline";
    reservationType?: "verification" | "renewable" | "nonrenewable";
  }): Promise<TextVerifiedService[]> {
    return this.requestJson<TextVerifiedService[]>("/api/pub/v2/services", {
      query: {
        numberType: params?.numberType ?? "mobile",
        reservationType: params?.reservationType ?? "verification",
      },
    });
  }

  async getAreaCodes(): Promise<TextVerifiedAreaCode[]> {
    return this.requestJson<TextVerifiedAreaCode[]>("/api/pub/v2/area-codes");
  }

  async getVerificationPrice(params: {
    serviceName: string;
    areaCode?: boolean;
    carrier?: boolean;
    numberType?: "mobile" | "voip" | "landline";
    capability?: "sms" | "voice" | "smsAndVoiceCombo";
  }) {
    return this.requestJson<{ serviceName: string; price: number }>(
      "/api/pub/v2/pricing/verifications",
      {
        method: "POST",
        body: {
          serviceName: params.serviceName,
          areaCode: params.areaCode ?? false,
          carrier: params.carrier ?? false,
          numberType: params.numberType ?? "mobile",
          capability: params.capability ?? "sms",
        },
      }
    );
  }

  async getRentalPrice(params: {
    serviceName: string;
    areaCode: boolean;
    numberType?: "mobile" | "voip" | "landline";
    capability?: "sms" | "voice" | "smsAndVoiceCombo";
    isRenewable: boolean;
    duration:
      | "oneDay"
      | "threeDay"
      | "sevenDay"
      | "fourteenDay"
      | "thirtyDay"
      | "ninetyDay"
      | "oneYear";
  }) {
    return this.requestJson<{ serviceName: string; price: number }>(
      "/api/pub/v2/pricing/rentals",
      {
        method: "POST",
        body: {
          serviceName: params.serviceName,
          areaCode: params.areaCode,
          numberType: params.numberType ?? "mobile",
          capability: params.capability ?? "sms",
          isRenewable: params.isRenewable,
          duration: params.duration,
        },
      }
    );
  }

  async createVerification(params: {
    serviceName: string;
    capability?: "sms" | "voice" | "smsAndVoiceCombo";
    areaCodeSelectOption?: string[];
    carrierSelectOption?: string[];
    serviceNotListedName?: string | null;
    maxPrice?: number | null;
  }): Promise<TextVerifiedVerification> {
    const res = await this.requestRaw("/api/pub/v2/verifications", {
      method: "POST",
      body: {
        serviceName: params.serviceName,
        capability: params.capability ?? "sms",
        areaCodeSelectOption: params.areaCodeSelectOption,
        carrierSelectOption: params.carrierSelectOption,
        serviceNotListedName: params.serviceNotListedName ?? undefined,
        maxPrice: typeof params.maxPrice === "number" ? params.maxPrice : undefined,
      },
    });

    const text = await res.text();
    if (res.status !== 201) {
      throw new Error(`Textverified create failed (${res.status}): ${text}`);
    }

    const locationHeader = res.headers.get("location") || res.headers.get("Location");
    let href = locationHeader;

    if (!href && text) {
      try {
        const parsed = JSON.parse(text);
        href = parsed?.href || parsed?.link?.href || parsed?.method?.href;
      } catch {
        // ignore non-JSON body
      }
    }

    if (!href) {
      throw new Error("Textverified create did not return a location header");
    }

    return this.requestJson<TextVerifiedVerification>(href);
  }

  async getSale(idOrUrl: string): Promise<TextVerifiedSale> {
    return this.requestJson<TextVerifiedSale>(
      idOrUrl.startsWith("http") ? idOrUrl : `/api/pub/v2/sales/${idOrUrl}`
    );
  }

  async getRenewableRental(id: string): Promise<TextVerifiedRenewableRental> {
    return this.requestJson<TextVerifiedRenewableRental>(
      `/api/pub/v2/reservations/rental/renewable/${id}`
    );
  }

  async getNonrenewableRental(id: string): Promise<TextVerifiedNonrenewableRental> {
    return this.requestJson<TextVerifiedNonrenewableRental>(
      `/api/pub/v2/reservations/rental/nonrenewable/${id}`
    );
  }

  async renewBillingCycle(id: string) {
    return this.requestJson<any>(`/api/pub/v2/billing-cycles/${id}/renew`, {
      method: "POST",
    });
  }

  async renewOverdueRental(id: string) {
    const res = await this.requestRaw(
      `/api/pub/v2/reservations/rental/renewable/${id}/renew`,
      { method: "POST" }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Textverified overdue renew failed (${res.status}): ${text}`);
    }
  }

  async refundRenewableRental(id: string) {
    const res = await this.requestRaw(
      `/api/pub/v2/reservations/rental/renewable/${id}/refund`,
      { method: "POST" }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Textverified refund failed (${res.status}): ${text}`);
    }
  }

  async refundNonrenewableRental(id: string) {
    const res = await this.requestRaw(
      `/api/pub/v2/reservations/rental/nonrenewable/${id}/refund`,
      { method: "POST" }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Textverified refund failed (${res.status}): ${text}`);
    }
  }

  async createRental(params: {
    serviceName: string;
    isRenewable: boolean;
    duration:
      | "oneDay"
      | "threeDay"
      | "sevenDay"
      | "fourteenDay"
      | "thirtyDay"
      | "ninetyDay"
      | "oneYear";
    areaCodeSelectOption?: string[];
    numberType?: "mobile" | "voip" | "landline";
    capability?: "sms" | "voice" | "smsAndVoiceCombo";
    allowBackOrderReservations?: boolean;
  }) {
    const res = await this.requestRaw("/api/pub/v2/reservations/rental", {
      method: "POST",
      body: {
        serviceName: params.serviceName,
        isRenewable: params.isRenewable,
        duration: params.duration,
        numberType: params.numberType ?? "mobile",
        capability: params.capability ?? "sms",
        areaCodeSelectOption: params.areaCodeSelectOption,
        allowBackOrderReservations: params.allowBackOrderReservations ?? false,
      },
    });

    const text = await res.text();
    if (res.status !== 201) {
      throw new Error(`Textverified rental create failed (${res.status}): ${text}`);
    }

    const locationHeader = res.headers.get("location") || res.headers.get("Location");
    let href = locationHeader;
    if (!href && text) {
      try {
        const parsed = JSON.parse(text);
        href = parsed?.href || parsed?.link?.href || parsed?.method?.href;
      } catch {
        // ignore non-JSON body
      }
    }

    if (!href) {
      throw new Error("Textverified rental create did not return a location header");
    }

    const sale = await this.requestJson<TextVerifiedSale>(href);
    const reservation = sale.reservations?.[0];
    if (!reservation?.id || !reservation?.link?.href) {
      throw new Error("Textverified rental is on backorder or missing reservation details");
    }

    const reservationType = reservation.reservationType;
    const details = await this.requestJson<any>(reservation.link.href);

    if (reservationType === "renewable") {
      const rental = details as TextVerifiedRenewableRental;
      return {
        saleId: sale.id,
        reservationId: rental.id,
        reservationType,
        number: rental.number,
        endsAt: rental.endsAt ?? null,
        billingCycleId: rental.billingCycleId,
        state: rental.state,
        totalCost: sale.total,
      };
    }

    const rental = details as TextVerifiedNonrenewableRental;
    return {
      saleId: sale.id,
      reservationId: rental.id,
      reservationType,
      number: rental.number,
      endsAt: rental.endsAt,
      billingCycleId: null,
      state: rental.state,
      totalCost: sale.total,
    };
  }

  async getVerification(id: string): Promise<TextVerifiedVerification> {
    return this.requestJson<TextVerifiedVerification>(`/api/pub/v2/verifications/${id}`);
  }

  async cancelVerification(id: string) {
    const res = await this.requestRaw(`/api/pub/v2/verifications/${id}/cancel`, {
      method: "POST",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Textverified cancel failed (${res.status}): ${text}`);
    }
  }

  async listSms(params: {
    reservationId?: string;
    reservationType?: "verification" | "renewable" | "nonrenewable";
    to?: string;
  }) {
    return this.requestJson<{
      data: TextVerifiedSms[];
      hasNext: boolean;
      hasPrevious: boolean;
      count: number;
    }>("/api/pub/v2/sms", {
      query: {
        reservationId: params.reservationId,
        reservationType: params.reservationType ?? "verification",
        to: params.to,
      },
    });
  }
}

export const textverifiedClient = new TextVerifiedClient();
