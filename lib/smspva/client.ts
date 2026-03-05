
const BASE_URL = "https://smspva.com";
export const SMSPVA_IMG_BASE = "https://smspva.com/templates/New_theme/";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SmspvaNumberResponse {
  response: string; // "1" = success
  number: string;
  id: string;
}

export interface SmspvaSmsResponse {
  response: string; // "1" = got SMS, "2" = waiting
  number: string;
  sms: string | null;
}

export interface SmspvaBalanceResponse {
  response: string;
  balance: string;
}

export interface SmspvaCountResponse {
  service: string;
  online: number;
  total: number;
}

export interface SmspvaPriceResponse {
  response: string;
  country: string;
  service: string;
  price: string;
}

export interface SmspvaDenialResponse {
  response: string;
  number: string;
  id: string;
}

export interface SmspvaRentService {
  name: string;
  service: string;     // e.g. "opt1"
  price_day: number;   // price per day
  count: number;       // available count
  img: string;         // relative path e.g. "images/ico/gmail.png"
}

export interface SmspvaRentOrder {
  id: number;
  pnumber: string;        // phone number without country code
  ccode: string;          // country dial code e.g. "+1"
  service: string;
  dtype: string;
  dcount: number;
  rentalEndDate: number;  // unix timestamp ms
  services?: string[];
}

export type SmspvaRentDtype = "week" | "month";

// ─── Error map ──────────────────────────────────────────────────────────────

const RESPONSE_ERRORS: Record<string, string> = {
  "0": "No numbers available",
  "3": "Waiting for SMS",
  "4": "Bad service code",
  "5": "Too many requests",
  "6": "Service error",
  "7": "Cancel not available",
  "8": "SMS already received",
};

// ─── Client ─────────────────────────────────────────────────────────────────

class SmspvaClient {
  private get apiKey() {
    return process.env.SMSPVA_API_KEY ?? "";
  }

  private async req<T>(path: string): Promise<T> {
    if (!this.apiKey) throw new Error("SMSPVA_API_KEY env var is required");
    const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
    const text = await res.text();
    if (!res.ok) throw new Error(`SMSPVA request failed (${res.status}): ${text}`);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`SMSPVA returned non-JSON: ${text}`);
    }
  }

  private act(method: string, extra: Record<string, string> = {}): string {
    const p = new URLSearchParams({ apikey: this.apiKey, metod: method, ...extra });
    return `/priemnik.php?method=${method}&${p}`;
  }

  private rent(method: string, extra: Record<string, string> = {}): string {
    const p = new URLSearchParams({ apikey: this.apiKey, method, ...extra });
    return `/api/rent.php?${p}`;
  }

  // ── Balance ──────────────────────────────────────────────────────────────

  getBalance(): Promise<SmspvaBalanceResponse> {
    const p = new URLSearchParams({ apikey: this.apiKey });
    return this.req<SmspvaBalanceResponse>(`/priemnik.php?method=get_balance&${p}`);
  }

  // ── Activation (one-time) ────────────────────────────────────────────────

  getNumber(service: string, country: string): Promise<SmspvaNumberResponse> {
    return this.req<SmspvaNumberResponse>(this.act("get_number", { service, country }));
  }

  getSms(service: string, country: string, id: string): Promise<SmspvaSmsResponse> {
    return this.req<SmspvaSmsResponse>(this.act("get_sms", { service, country, id }));
  }

  cancel(id: string, service?: string, country?: string): Promise<SmspvaDenialResponse> {
    const extra: Record<string, string> = { id };
    if (service) extra.service = service;
    if (country) extra.country = country;
    return this.req<SmspvaDenialResponse>(this.act("denial", extra));
  }

  getCount(service: string, country: string): Promise<SmspvaCountResponse> {
    const p = new URLSearchParams({ apikey: this.apiKey, service, country });
    return this.req<SmspvaCountResponse>(`/priemnik.php?method=get_count_new&${p}`);
  }

  getServicePrice(service: string, country: string): Promise<SmspvaPriceResponse> {
    return this.req<SmspvaPriceResponse>(this.act("get_service_price", { service, country }));
  }

  // ── Rental ───────────────────────────────────────────────────────────────

  getRentServices(country: string, dtype: SmspvaRentDtype = "week", dcount = 1): Promise<{
    status: number;
    data: { services: SmspvaRentService[]; totalAmount: number };
  }> {
    return this.req(this.rent("getdata", { country, dtype, dcount: String(dcount) }));
  }

  createRental(
    service: string,
    country: string,
    dtype: SmspvaRentDtype,
    dcount: number
  ): Promise<{ status: number; data: SmspvaRentOrder[] }> {
    return this.req(this.rent("create", {
      service, country, dtype, dcount: String(dcount),
    }));
  }

  getRentSms(id: string): Promise<{
    status: number;
    data: Array<{ id: number; text: string; service: string; fromNumber: string; date: number }>;
  }> {
    return this.req(this.rent("getsms", { id }));
  }

  cancelRental(id: string): Promise<{ status: number }> {
    return this.req(this.rent("delete", { id }));
  }
}

export const smspvaClient = new SmspvaClient();

export function isSmspvaError(response: string): boolean {
  return response !== "1";
}

export function smspvaErrorMessage(response: string): string {
  return RESPONSE_ERRORS[response] ?? `Unknown error (code ${response})`;
}
