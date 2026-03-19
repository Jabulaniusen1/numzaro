const DEFAULT_BASE_URL = "https://api.grizzlysms.com/stubs/handler_api.php";

const ERROR_CODES = new Set([
  "BAD_KEY",
  "NO_NUMBERS",
  "ERROR_SQL",
  "NO_ACTIVATION",
  "BAD_SERVICE",
  "BAD_STATUS",
  "BAD_ACTION",
  "SERVICE_UNAVAILABLE_REGION",
]);

function isErrorResponse(text: string) {
  const upper = text.trim().toUpperCase();
  if (ERROR_CODES.has(upper)) return true;
  if (upper.startsWith("BAD_")) return true;
  if (upper.startsWith("ERROR_")) return true;
  return false;
}

function parseAccessNumber(text: string) {
  // ACCESS_NUMBER:38496653:66846426435
  const parts = text.trim().split(":");
  if (parts.length >= 3 && parts[0] === "ACCESS_NUMBER") {
    return { activationId: parts[1], phoneNumber: parts.slice(2).join(":") };
  }
  return null;
}

export interface GrizzlyService {
  code: string;
  name: string;
}

export interface GrizzlyCountry {
  id: number;
  rus?: string;
  eng?: string;
  chn?: string;
}

export interface GrizzlyActivation {
  activationId: string;
  phoneNumber: string;
  activationCost: number;
  currency: number;
  countryCode: string;
  canGetAnotherSms: boolean;
  activationTime: string;
}

class GrizzlySMSClient {
  private get apiKey() {
    return process.env.GRIZZLY_SMS_API_KEY ?? "";
  }

  private get baseUrl() {
    return process.env.GRIZZLY_SMS_API_URL ?? DEFAULT_BASE_URL;
  }

  private async request(params: Record<string, string | number | undefined>) {
    if (!this.apiKey) throw new Error("GRIZZLY_SMS_API_KEY env var is required");
    const p = new URLSearchParams({ api_key: this.apiKey });
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      p.set(k, String(v));
    }
    const res = await fetch(`${this.baseUrl}?${p.toString()}`, {
      cache: "no-store",
      headers: { "User-Agent": "Numzaro/1.0" },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`GrizzlySMS request failed (${res.status}): ${text}`);
    if (isErrorResponse(text)) throw new Error(text.trim());
    return text;
  }

  private parseJson<T>(text: string): T {
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`GrizzlySMS returned non-JSON: ${text}`);
    }
  }

  async getBalance(): Promise<number> {
    const text = await this.request({ action: "getBalance" });
    // ACCESS_BALANCE:12.34
    const parts = text.trim().split(":");
    if (parts[0] !== "ACCESS_BALANCE" || parts.length < 2) {
      throw new Error(`Unexpected balance response: ${text}`);
    }
    return parseFloat(parts[1]);
  }

  async getServicesList(): Promise<GrizzlyService[]> {
    const text = await this.request({ action: "getServicesList" });
    const json = this.parseJson<any>(text);
    if (Array.isArray(json)) {
      return json.map((s: any) => ({ code: s.code, name: s.name }));
    }
    if (!Array.isArray(json.services)) return [];
    return json.services.map((s: any) => ({ code: s.code, name: s.name }));
  }

  async getCountries(): Promise<GrizzlyCountry[]> {
    const text = await this.request({ action: "getCountries" });
    const json = this.parseJson<any>(text);
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.countries)) return json.countries;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.result)) return json.result;
    if (json && typeof json === "object") {
      const values = Object.values(json).filter((v) => v && typeof v === "object");
      const withId = values.filter((v: any) => typeof v.id !== "undefined");
      if (withId.length) return withId as GrizzlyCountry[];
    }
    return [];
  }

  async getPrices(service?: string, country?: string) {
    const text = await this.request({ action: "getPrices", service, country });
    return this.parseJson<Record<string, any>>(text);
  }

  async getNumberV2(params: {
    service: string;
    country?: string;
    maxPrice?: number;
    providerIds?: string;
    exceptProviderIds?: string;
  }): Promise<GrizzlyActivation> {
    const text = await this.request({
      action: "getNumberV2",
      service: params.service,
      country: params.country,
      maxPrice: params.maxPrice,
      providerIds: params.providerIds,
      exceptProviderIds: params.exceptProviderIds,
    });

    const access = parseAccessNumber(text);
    if (access) {
      return {
        activationId: access.activationId,
        phoneNumber: access.phoneNumber,
        activationCost: 0,
        currency: 840,
        countryCode: params.country || "",
        canGetAnotherSms: false,
        activationTime: new Date().toISOString(),
      };
    }

    const json = this.parseJson<any>(text);
    if (!json || !json.activationId || !json.phoneNumber) {
      throw new Error(`Unexpected getNumberV2 response: ${text}`);
    }
    return {
      activationId: String(json.activationId),
      phoneNumber: String(json.phoneNumber),
      activationCost: parseFloat(json.activationCost ?? "0"),
      currency: Number(json.currency ?? 840),
      countryCode: String(json.countryCode ?? params.country ?? ""),
      canGetAnotherSms: String(json.canGetAnotherSms ?? "0") === "1",
      activationTime: String(json.activationTime ?? new Date().toISOString()),
    };
  }

  async getStatus(id: string) {
    const text = await this.request({ action: "getStatus", id });
    return text.trim();
  }

  async setStatus(id: string, status: number) {
    const text = await this.request({ action: "setStatus", id, status });
    return text.trim();
  }
}

export const grizzlyClient = new GrizzlySMSClient();
