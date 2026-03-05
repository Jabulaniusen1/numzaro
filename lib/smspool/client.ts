
const BASE_URL = "https://api.smspool.net";
const BASE_URL_ALT = "https://smspool.net/api"; // some endpoints use this

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SMSPoolCountry {
  ID: string;
  name: string;
  short_name: string; // 2-letter code e.g. "US"
  cc: string;         // dial code e.g. "1"
  region: string;
}

export interface SMSPoolService {
  ID: string;
  name: string;
}

export interface SMSPoolPriceResponse {
  price: string;
  high_price: string;
  success_rate: number;
}

export interface SMSPoolPurchaseSMSResponse {
  success: number;
  number: string;      // phone number
  order_id: string;
  expiration: number;  // unix timestamp
  message?: string;    // error message if success=0
}

export interface SMSPoolCheckSMSResponse {
  success: number;
  sms: string;
  full_sms: string;
  status: number; // 1=waiting, 2=received, 3=cancelled
}

export interface SMSPoolRental {
  ID: number;
  name: string;
  tag: string;
  region: string;
  pricing: Record<string, number>; // keys=days, values=total price e.g. {"1":6,"7":12,"28":18}
  pool: number;
}

export interface SMSPoolPurchaseRentalResponse {
  success: number;
  phonenumber: string;
  rental_code: string;
  expiry: number;      // unix timestamp
  message?: string;
}

export interface SMSPoolRentalMessage {
  message: string;
  sender: string;
  date: string;
}

export interface SMSPoolRentalStatus {
  active: number;
  expiry: number;       // unix timestamp
  phonenumber: string;
}

// ─── Client ─────────────────────────────────────────────────────────────────

class SMSPoolClient {
  private get apiKey() {
    return process.env.SMSPOOL_API_KEY ?? "";
  }

  private async get<T>(baseUrl: string, path: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.apiKey) throw new Error("SMSPOOL_API_KEY env var is required");
    const p = new URLSearchParams({ key: this.apiKey, ...params });
    const res = await fetch(`${baseUrl}${path}?${p}`, { cache: "no-store" });
    const text = await res.text();
    if (!res.ok) throw new Error(`SMSPool request failed (${res.status}): ${text}`);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`SMSPool returned non-JSON: ${text}`);
    }
  }

  private req<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    return this.get<T>(BASE_URL, path, params);
  }

  // ── Account ──────────────────────────────────────────────────────────────

  getBalance(): Promise<{ balance: string }> {
    return this.req("/request/balance");
  }

  getCountries(): Promise<SMSPoolCountry[]> {
    return this.req("/country/retrieve_all");
  }

  getServices(country?: string): Promise<SMSPoolService[]> {
    return this.req("/service/retrieve_all", country ? { country } : {});
  }

  // ── One-time SMS ─────────────────────────────────────────────────────────

  getSMSServicePrice(country: string, service: string): Promise<SMSPoolPriceResponse> {
    return this.req("/request/price", { country, service });
  }

  purchaseSMS(country: string, service: string, pool?: string): Promise<SMSPoolPurchaseSMSResponse> {
    const params: Record<string, string> = { country, service };
    if (pool) params.pool = pool;
    return this.req("/purchase/sms", params);
  }

  checkSMS(orderID: string): Promise<SMSPoolCheckSMSResponse> {
    return this.req("/sms/check", { orderid: orderID });
  }

  resendSMS(orderID: string): Promise<{ success: number; message: string; resend: number }> {
    return this.req("/sms/resend", { orderid: orderID });
  }

  cancelSMS(orderID: string): Promise<{ success: number }> {
    return this.req("/sms/cancel", { orderid: orderID });
  }

  // ── Rentals ──────────────────────────────────────────────────────────────

  getRentals(extendable: boolean): Promise<{ success: number; data: SMSPoolRental[] }> {
    return this.req("/rental/retrieve_all", { type: extendable ? "1" : "0" });
  }

  purchaseRental(
    rentalID: string,
    days: number,
    service_id?: string
  ): Promise<SMSPoolPurchaseRentalResponse> {
    const params: Record<string, string> = { id: rentalID, days: String(days) };
    if (service_id) params.service_id = service_id;
    return this.req("/purchase/rental", params);
  }

  getRentalMessages(rental_code: string): Promise<{ success: number; messages: SMSPoolRentalMessage[]; source: string }> {
    return this.req("/rental/retrieve_messages", { rental_code });
  }

  getRentalStatus(rental_code: string): Promise<{ success: number; status: SMSPoolRentalStatus }> {
    return this.get(BASE_URL_ALT, "/rental/retrieve_status.php", { rental_code });
  }

  extendRental(rental_code: string, days: number): Promise<{ success: number; message: string }> {
    return this.req("/rental/extend.php", { rental_code, days: String(days) });
  }

  refundRental(rental_code: string): Promise<{ success: number; message: string }> {
    return this.req("/rental/refund.php", { rental_code });
  }
}

export const smsPoolClient = new SMSPoolClient();
