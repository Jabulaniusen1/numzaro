const BASE_URL = "https://api.smspool.net";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SMSPoolCountry {
  ID: string;
  name: string;
  short_name: string; // 2-letter code e.g. "US"
  cc?: string; // dial code e.g. "1"
  region: string;
}

export interface SMSPoolService {
  ID: string;
  name: string;
}

export interface SMSPoolPool {
  ID: number;
  name: string;
}

export interface SMSPoolPriceResponse {
  pool?: number;
  price: string;
  high_price?: string;
  success_rate: number | string;
}

export interface SMSPoolPurchaseSMSResponse {
  success: number;
  number?: string | number;
  cc?: string | number;
  phonenumber?: string | number;
  order_id?: string;
  expiration?: number;
  expires_in?: number;
  cost?: string;
  cost_in_cents?: number;
  message?: string;
  type?: string;
  errors?: Array<{ message: string }>;
}

export interface SMSPoolCheckSMSResponse {
  status: number; // waiting/received/refunded etc.
  resend?: number;
  expiration?: number;
  time_left?: number;
  sms?: string;
  full_sms?: string;
  message?: string;
}

export interface SMSPoolRental {
  ID: number;
  name: string;
  tag: string;
  region: string;
  pricing: Record<string, number>;
  pool: number;
}

export interface SMSPoolPurchaseRentalResponse {
  success: number;
  phonenumber: string;
  rental_code: string;
  expiry: number;
  message?: string;
}

export interface SMSPoolRentalMessage {
  message: string;
  sender: string;
  date?: string;
  timestamp?: string;
}

export interface SMSPoolRentalStatus {
  available?: number;
  active?: number;
  expiry: number;
  phonenumber: string;
}

export interface SMSPoolPurchaseSMSOptions {
  pool?: string;
  maxPrice?: number;
  pricingOption?: 0 | 1;
  quantity?: number;
  areaCodeJson?: string;
  excludeAreaCodes?: boolean;
  createToken?: boolean;
  activationType?: "SMS" | "VOICE" | "FLASH";
  carrier?: string;
  phoneNumber?: string;
}

export interface SMSPoolEsimPlan {
  ID: number;
  extendable?: number;
  dataInGb?: number;
  network?: string;
  duration?: number;
  price: string;
  speed?: string;
  ip?: string;
  countryCode?: string;
  name?: string;
}

export interface SMSPoolEsimPricingResponse {
  data: SMSPoolEsimPlan[];
  rows: number;
}

export interface SMSPoolEsimPurchaseResponse {
  success: number;
  message?: string;
  transactionId?: string;
}

export interface SMSPoolEsimProfileResponse {
  success?: number;
  transactionId?: string;
  countryCode?: string;
  ac?: string;
  smdp?: string;
  activationCode?: string;
  remainingData?: string;
  totalData?: string;
  activated?: number;
  plan?: number;
  label?: string | null;
  message?: string;
}

export interface SMSPoolEsimHistoryEntry {
  transactionId: string;
  countryCode?: string;
  cost?: string;
  plan?: number;
  name?: string;
  timestamp?: string;
  expiration?: string;
  dataInGb?: number;
  status?: number;
  label?: string;
}

export interface SMSPoolEsimHistoryResponse {
  data: SMSPoolEsimHistoryEntry[];
  rows: number;
  page?: number;
  limit?: number;
}

// ─── Client ─────────────────────────────────────────────────────────────────

class SMSPoolClient {
  private get apiKey() {
    return process.env.SMSPOOL_API_KEY ?? "";
  }

  private requireApiKey() {
    if (!this.apiKey) throw new Error("SMSPOOL_API_KEY env var is required");
  }

  private async parseResponse<T>(res: Response): Promise<T> {
    const text = await res.text();
    const trimmed = text.trim();
    if (!res.ok) {
      throw new Error(
        `SMSPool request failed (${res.status}): ${trimmed || "No response body returned by provider"}`
      );
    }
    try {
      return JSON.parse(trimmed || "{}") as T;
    } catch {
      throw new Error(`SMSPool returned non-JSON: ${trimmed || "<empty>"}`);
    }
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    this.requireApiKey();
    const query = new URLSearchParams({ key: this.apiKey, ...params });
    const res = await fetch(`${BASE_URL}${path}?${query.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    return this.parseResponse<T>(res);
  }

  private async post<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    this.requireApiKey();
    const body = new URLSearchParams({ key: this.apiKey, ...params });
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });
    return this.parseResponse<T>(res);
  }

  // ── Account ──────────────────────────────────────────────────────────────

  getBalance(): Promise<{ balance: string }> {
    return this.post("/request/balance");
  }

  getCountries(): Promise<SMSPoolCountry[]> {
    return this.get("/country/retrieve_all");
  }

  getServices(country?: string): Promise<SMSPoolService[]> {
    return this.get("/service/retrieve_all", country ? { country } : {});
  }

  getPools(): Promise<SMSPoolPool[]> {
    return this.post("/pool/retrieve_all");
  }

  // ── One-time SMS ─────────────────────────────────────────────────────────

  getSMSServicePrice(country: string, service: string, pool?: string): Promise<SMSPoolPriceResponse> {
    const params: Record<string, string> = { country, service };
    if (pool) params.pool = pool;
    return this.get("/request/price", params);
  }

  purchaseSMS(
    country: string,
    service: string,
    options: SMSPoolPurchaseSMSOptions = {}
  ): Promise<SMSPoolPurchaseSMSResponse> {
    const params: Record<string, string> = {
      country,
      service,
      pricing_option: String(options.pricingOption ?? 1), // 1 = highest success rate
      quantity: String(options.quantity ?? 1),
      activation_type: options.activationType ?? "SMS",
    };
    if (options.pool) params.pool = options.pool;
    if (typeof options.maxPrice === "number") params.max_price = String(options.maxPrice);
    if (options.areaCodeJson) params.areacode = options.areaCodeJson;
    if (options.excludeAreaCodes) params.exclude = "1";
    if (options.createToken) params.create_token = "1";
    if (options.carrier) params.carrier = options.carrier;
    if (options.phoneNumber) params.phonenumber = options.phoneNumber;
    return this.post("/purchase/sms", params);
  }

  checkSMS(orderID: string): Promise<SMSPoolCheckSMSResponse> {
    return this.post("/sms/check", { orderid: orderID });
  }

  resendSMS(orderID: string): Promise<{ success: number; message: string; resend: number }> {
    return this.post("/sms/resend", { orderid: orderID });
  }

  cancelSMS(orderID: string): Promise<{ success: number; message?: string }> {
    return this.post("/sms/cancel", { orderid: orderID });
  }

  // ── Rentals ──────────────────────────────────────────────────────────────

  getRentals(extendable: boolean): Promise<{ success: number; data: SMSPoolRental[] }> {
    return this.post("/rental/retrieve_all", { type: extendable ? "1" : "0" });
  }

  purchaseRental(
    rentalID: string,
    days: number,
    service_id?: string
  ): Promise<SMSPoolPurchaseRentalResponse> {
    const params: Record<string, string> = { id: rentalID, days: String(days) };
    if (service_id) params.service_id = service_id;
    return this.post("/purchase/rental", params);
  }

  getRentalMessages(
    rental_code: string
  ): Promise<{ success: number; messages: SMSPoolRentalMessage[]; source: string }> {
    return this.post("/rental/retrieve_messages", { rental_code });
  }

  getRentalStatus(rental_code: string): Promise<{ success: number; status: SMSPoolRentalStatus }> {
    return this.post("/rental/retrieve_status", { rental_code });
  }

  extendRental(rental_code: string, days: number): Promise<{ success: number; message: string }> {
    return this.post("/rental/extend", { rental_code, days: String(days) });
  }

  refundRental(rental_code: string): Promise<{ success: number; message: string }> {
    return this.post("/rental/refund", { rental_code });
  }

  // ── Suggestions ───────────────────────────────────────────────────────────

  getSuggestedCountries(
    service: string
  ): Promise<Array<{ pool: number; country_id: number; name: string; short_name: string; price: string }>> {
    return this.post("/request/suggested_countries", { service });
  }

  // ── eSIM ──────────────────────────────────────────────────────────────────

  getEsimCountries(options: {
    start?: number;
    length?: number;
    search?: string;
  } = {}): Promise<SMSPoolEsimPricingResponse> {
    const params: Record<string, string> = {};
    if (typeof options.start === "number") params.start = String(options.start);
    if (typeof options.length === "number") params.length = String(options.length);
    if (options.search) params.Search = options.search;
    return this.post("/esim/pricing", params);
  }

  getEsimPlans(countryCode: string): Promise<SMSPoolEsimPlan[]> {
    return this.post("/esim/plans", { country: countryCode });
  }

  purchaseEsim(plan: number | string): Promise<SMSPoolEsimPurchaseResponse> {
    return this.post("/esim/purchase", { plan: String(plan) });
  }

  getEsimProfile(transactionId: string): Promise<SMSPoolEsimProfileResponse> {
    return this.post("/esim/profile", { transactionId });
  }

  getEsimHistory(options: {
    start?: number;
    length?: number;
    search?: string;
  } = {}): Promise<SMSPoolEsimHistoryResponse> {
    const params: Record<string, string> = {};
    if (typeof options.start === "number") params.start = String(options.start);
    if (typeof options.length === "number") params.length = String(options.length);
    if (options.search) params.search = options.search;
    return this.post("/esim/history", params);
  }

  deleteEsim(transactionId: string): Promise<{ success: number; message?: string }> {
    return this.post("/esim/delete", { transactionId });
  }
}

export const smsPoolClient = new SMSPoolClient();
