
const BASE_URL = "https://api.quackr.io";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuackrDuration =
  | "halfDay"
  | "oneDay"
  | "oneWeek"
  | "oneMonth"
  | "sixMonths"
  | "twelveMonths";

export type QuackrLocale =
  | "US" | "UK" | "NL" | "HK" | "AU" | "CA"
  | "FI" | "DE" | "ES" | "LT" | "MX" | "IL" | "PL";

export interface QuackrPurchasedNumber {
  id: number;
  number: string;
}

export interface QuackrPurchaseResult {
  success: boolean;
  phoneNumbers: QuackrPurchasedNumber[];
  duration: string;
  price: string;
  locale: string;
}

export interface QuackrActiveNumber {
  locale: string;
  nickname: string | null;
  number: string;
  rentalStartDate: number; // ms timestamp
  rentalEndDate: number;   // ms timestamp
}

export interface QuackrMessage {
  sender: string;
  received: number; // ms timestamp
  message: string;
}

export interface QuackrPricing {
  halfDay: string;
  oneDay: string;
  oneWeek: string;
  oneMonth: string;
  sixMonths: string;
  twelveMonths: string;
}

export interface QuackrBalance {
  success: boolean;
  balance: number;
  currency: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

class QuackrClient {
  private get apiKey() {
    return process.env.QUACKR_API_KEY ?? "";
  }

  private async req<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error("QUACKR_API_KEY env var is required");
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        ...(init.headers as Record<string, string> | undefined),
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let errMsg = text;
      try { errMsg = JSON.parse(text).error ?? text; } catch {}
      throw new Error(`Quackr ${init.method ?? "GET"} ${path} (${res.status}): ${errMsg}`);
    }

    return JSON.parse(text) as T;
  }

  // ── Account ─────────────────────────────────────────────────────────────────

  getBalance(): Promise<QuackrBalance> {
    return this.req<QuackrBalance>("/balance");
  }

  getPricing(locale: string, carrier?: string): Promise<{
    success: boolean;
    locale: string;
    currency: string;
    pricing: QuackrPricing;
  }> {
    const params = new URLSearchParams({ locale });
    if (carrier) params.set("carrier", carrier);
    return this.req(`/pricing?${params}`);
  }

  // ── Numbers ──────────────────────────────────────────────────────────────────

  purchaseNumber(
    locale: QuackrLocale | string,
    duration: QuackrDuration,
    options?: { quantity?: number; carrier?: string; receiveCalls?: boolean; autoRenew?: boolean }
  ): Promise<QuackrPurchaseResult> {
    return this.req<QuackrPurchaseResult>("/purchase", {
      method: "POST",
      body: JSON.stringify({ locale, duration, ...options }),
    });
  }

  getActiveNumbers(limit?: number): Promise<{ success: boolean; activeNumbers: QuackrActiveNumber[] }> {
    const params = limit ? `?limit=${limit}` : "";
    return this.req(`/active-numbers${params}`);
  }

  getNumberDetails(phoneNumber: string): Promise<{ success: boolean; number: QuackrActiveNumber }> {
    return this.req(`/number?phoneNumber=${encodeURIComponent(phoneNumber)}`);
  }

  cancelNumber(phoneNumber: string): Promise<{ success: boolean }> {
    return this.req("/cancel", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
  }

  renewNumber(
    phoneNumber: string,
    duration: QuackrDuration,
    autoRenew?: boolean
  ): Promise<{ success: boolean; rentalEndDate: number; price: string }> {
    return this.req("/renew", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, duration, autoRenew }),
    });
  }

  // ── SMS ──────────────────────────────────────────────────────────────────────

  getMessages(phoneNumber: string): Promise<{ success: boolean; data: { messages: QuackrMessage[] } }> {
    return this.req("/receive-sms", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
  }

  // ── Inventory ─────────────────────────────────────────────────────────────────

  getInventory(locale: string, duration: QuackrDuration): Promise<{
    success: boolean;
    inventory: number;
    locale: string;
    duration: string;
  }> {
    return this.req(`/inventory?locale=${locale}&duration=${duration}`);
  }

  // ── Webhook ──────────────────────────────────────────────────────────────────

  getWebhook(): Promise<{ success: boolean; webhookUrl: string }> {
    return this.req("/webhook");
  }

  setWebhook(webhookUrl: string): Promise<{ success: boolean }> {
    return this.req("/webhook", {
      method: "POST",
      body: JSON.stringify({ webhookUrl }),
    });
  }
}

export const quackrClient = new QuackrClient();
