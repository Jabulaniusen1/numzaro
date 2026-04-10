// Base URL is api/v1 — paths include /retail/... or /activation/... as needed
const BASE_URL = (
  process.env.PLATFONE_API_URL ?? "https://temp-number-api.com/api/v1"
).replace(/\/retail\/?$/, "").replace(/\/$/, "");

function apiKey(): string {
  const key = process.env.PLATFONE_API_KEY;
  if (!key) throw new Error("PLATFONE_API_KEY is not set");
  return key;
}

async function platfoneFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  if (process.env.NODE_ENV === "development") {
    console.log(`[platfone] ${options.method ?? "GET"} ${url}`);
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      "X-Api-Key": apiKey(),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Platfone: non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const errorMsg = json?.message ?? json?.error?.message ?? json?.error ?? `HTTP ${res.status}`;

    if (res.status === 402) {
      throw Object.assign(
        new Error("PLATFONE_BALANCE: Platfone customer has insufficient balance."),
        { platfoneCode: "insufficient_balance", status: 402 }
      );
    }
    if (res.status === 409 && json?.suggestedPrice) {
      throw Object.assign(
        new Error(`MaxPriceExceeded: suggested price is ${json.suggestedPrice} cents`),
        { platfoneCode: "max_price_exceeded", suggestedPrice: json.suggestedPrice, orderId: json.order_id, status: 409 }
      );
    }
    if (res.status === 429) {
      throw Object.assign(
        new Error(typeof errorMsg === "string" ? errorMsg : "Rate limited or max activations reached"),
        { platfoneCode: "rate_limited", status: 429 }
      );
    }
    throw Object.assign(
      new Error(`Platfone error: ${typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)}`),
      { status: res.status }
    );
  }

  return json as T;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface PlatfoneCountry {
  country_id: string;
  name: string;
  alt_name?: string;
  codes?: string[];
}

export interface PlatfoneService {
  service_id: string;
  name: string;
  alt_name?: string;
  has_description?: boolean;
  has_warning?: boolean;
  prohibited?: boolean;
}

export interface PlatfonePriceEntry {
  price: { min: number; max: number; suggested: number };
  quality?: { avg: number };
  count: number;
}

export interface PlatfonePricesByServiceEntry {
  service_id: string;
  countries: Array<{
    country_id: string;
    price: { min: number; max: number; suggested: number };
    count: number;
  }>;
}

export interface PlatfonePricingQuery {
  service?: string;
  country?: string | number;
}

export type SmsStatus = "smsRequested" | "smsReceived" | "retryRequested" | "retryReceived";
export type ActivationStatus = "active" | "finalized" | "expired" | "canceled";
export type BillingStatus = "reserved" | "released" | "billed" | "refunded";

export interface PlatfoneActivation {
  activation_id: string;
  customer_id: string;
  customer_price?: number;
  price: number;
  phone: string;
  formatted?: string;
  country_id: string;
  service_id: string;
  sms_status: SmsStatus;
  activation_status: ActivationStatus;
  billing_status: BillingStatus;
  report_status?: string | null;
  sms_code?: string | null;
  sms_text?: string | null;
  expire_at?: number;
  updated_at?: number;
  created_at?: number;
  is_retriable?: boolean;
  cancelable_after?: number | null;
}

export interface PlatfoneActivationHistoryResponse {
  activations: PlatfoneActivation[];
  page: number;
  limit: number;
  pages: number;
  total: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export const platfoneClient = {

  // ── Catalog ────────────────────────────────────────────────────────────────

  // Curl: api/v1/countries
  getCountries(): Promise<PlatfoneCountry[]> {
    return platfoneFetch("/countries");
  },

  // Curl: api/v1/retail/services
  getServices(): Promise<PlatfoneService[]> {
    return platfoneFetch("/retail/services");
  },

  // Curl: api/v1/retail/a/activation/services/popular
  getPopularServices(): Promise<PlatfoneService[]> {
    return platfoneFetch("/retail/a/activation/services/popular");
  },

  // ── Prices ─────────────────────────────────────────────────────────────────

  // Curl: api/v1/activation/prices/services  (optional ?service_id=whatsapp)
  getPricesByService(serviceId?: string): Promise<PlatfonePricesByServiceEntry[]> {
    const qs = serviceId ? `?service_id=${encodeURIComponent(serviceId)}` : "";
    return platfoneFetch(`/activation/prices/services${qs}`);
  },

  // Curl: api/v1/activation/prices/services/{service_id}/countries/{country_id}
  getPrice(serviceId: string, countryId: string): Promise<PlatfonePriceEntry> {
    return platfoneFetch(
      `/activation/prices/services/${encodeURIComponent(serviceId)}/countries/${encodeURIComponent(countryId)}`
    );
  },

  // Compatibility helper used by /api/platfone/pricing
  async getPricing(query: PlatfonePricingQuery = {}): Promise<any> {
    const serviceId = query.service;
    const countryId = query.country !== undefined ? String(query.country) : undefined;

    if (serviceId && countryId) {
      return this.getPrice(serviceId, countryId);
    }

    const byService = await this.getPricesByService(serviceId);
    if (!countryId) return byService;

    return byService
      .map((entry) => ({
        ...entry,
        countries: entry.countries.filter((country) => country.country_id === countryId),
      }))
      .filter((entry) => entry.countries.length > 0);
  },

  // ── Customer management (/retail/m/) ──────────────────────────────────────

  // Curl: api/v1/retail/m/customer
  createCustomer(customerId: string): Promise<{ result: string }> {
    return platfoneFetch("/retail/m/customer", {
      method: "POST",
      body: JSON.stringify({ customer_id: customerId }),
    });
  },

  // Curl: api/v1/retail/m/customer/{id}/transaction
  addCustomerBalance(
    customerId: string,
    amountCents: number,
    transactionId: string
  ): Promise<{ result: string }> {
    return platfoneFetch(`/retail/m/customer/${encodeURIComponent(customerId)}/transaction`, {
      method: "POST",
      body: JSON.stringify({ transaction_id: transactionId, amount: amountCents }),
    });
  },

  // ── Activation operations (/retail/a/) ────────────────────────────────────

  // Curl: api/v1/retail/a/customer/{id}/activation
  createActivation(
    customerId: string,
    serviceId: string,
    countryId: string,
    maxPriceCents?: number
  ): Promise<PlatfoneActivation> {
    const body: Record<string, any> = {
      service_id: serviceId,
      country_id: countryId,
      customer_markup: 0,
      quality_factor: 50,
    };
    if (maxPriceCents !== undefined) body.max_price = maxPriceCents;
    return platfoneFetch(`/retail/a/customer/${encodeURIComponent(customerId)}/activation`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // Curl: api/v1/retail/a/customer/{id}/activation/{activationId}
  getActivation(customerId: string, activationId: string): Promise<PlatfoneActivation> {
    return platfoneFetch(
      `/retail/a/customer/${encodeURIComponent(customerId)}/activation/${encodeURIComponent(activationId)}`
    );
  },

  // Curl: api/v1/retail/a/customer/{id}/activation/{activationId}/retry
  retryActivation(customerId: string, activationId: string): Promise<{ result: string }> {
    return platfoneFetch(
      `/retail/a/customer/${encodeURIComponent(customerId)}/activation/${encodeURIComponent(activationId)}/retry`,
      { method: "PUT" }
    );
  },

  // Curl: api/v1/retail/a/customer/{id}/activation/{activationId}/cancel
  cancelActivation(customerId: string, activationId: string): Promise<{ result: string }> {
    return platfoneFetch(
      `/retail/a/customer/${encodeURIComponent(customerId)}/activation/${encodeURIComponent(activationId)}/cancel`,
      { method: "PUT" }
    );
  },

  // Curl: api/v1/retail/a/customer/{id}/activation/{activationId}/finalize
  finalizeActivation(customerId: string, activationId: string): Promise<{ result: string }> {
    return platfoneFetch(
      `/retail/a/customer/${encodeURIComponent(customerId)}/activation/${encodeURIComponent(activationId)}/finalize`,
      { method: "PUT" }
    );
  },

  // Curl: api/v1/retail/a/customer/{id}/activations
  getActiveActivations(customerId: string): Promise<PlatfoneActivation[]> {
    return platfoneFetch(
      `/retail/a/customer/${encodeURIComponent(customerId)}/activations?with_data=true`
    );
  },

  // Curl: api/v1/retail/a/customer/{id}/activation/history?page=1&limit=25
  getActivationHistory(
    customerId: string,
    page = 1,
    limit = 25
  ): Promise<PlatfoneActivationHistoryResponse> {
    const qs = `?page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`;
    return platfoneFetch(
      `/retail/a/customer/${encodeURIComponent(customerId)}/activation/history${qs}`
    );
  },

  // Curl: api/v1/retail/a/customer/{id}/balance
  getCustomerBalance(customerId: string): Promise<{ total: number; reserved: number }> {
    return platfoneFetch(`/retail/a/customer/${encodeURIComponent(customerId)}/balance`);
  },
};
