const NOWPAYMENTS_API_BASE = process.env.NOWPAYMENTS_API_BASE || "https://api.nowpayments.io/v1";
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || "";

export class NowPaymentsError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "NowPaymentsError";
  }
}

export interface CreateCryptoPaymentParams {
  amount: number;
  price_currency: string;
  pay_currency: string;
  order_id: string;
  order_description?: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface CreateCryptoInvoiceParams {
  amount: number;
  price_currency: string;
  pay_currency?: string;
  order_id: string;
  order_description?: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface CreateCryptoPaymentResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string | null;
  pay_amount: number | null;
  pay_currency: string;
  order_id: string;
  order_description: string;
  price_amount: number;
  price_currency: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  invoice_url?: string;
  payment_url?: string;
}

export interface GetCryptoPaymentResponse extends CreateCryptoPaymentResponse {}
export interface CreateCryptoInvoiceResponse {
  id: string | number;
  token_id?: string | null;
  order_id?: string;
  order_description?: string;
  price_amount?: number | string;
  price_currency?: string;
  pay_currency?: string;
  invoice_url: string;
  success_url?: string;
  cancel_url?: string;
}
export interface CurrenciesResponse {
  currencies: string[];
}
export interface MerchantCoinsResponse {
  selectedCurrencies?: string[];
  currencies?: string[];
}

export interface MinAmountResponse {
  min_amount: number;
  currency_from: string;
  currency_to: string;
}

async function nowpaymentsRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  if (!NOWPAYMENTS_API_KEY.trim()) {
    throw new NowPaymentsError("NOWPAYMENTS_API_KEY is not configured.");
  }

  const response = await fetch(`${NOWPAYMENTS_API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": NOWPAYMENTS_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const raw = await response.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new NowPaymentsError(`NOWPayments returned invalid JSON (${response.status})`, response.status);
  }

  if (!response.ok) {
    throw new NowPaymentsError(
      data?.message || data?.error || `NOWPayments API error (${response.status})`,
      response.status
    );
  }

  return data as T;
}

export async function createCryptoPayment(
  params: CreateCryptoPaymentParams
): Promise<CreateCryptoPaymentResponse> {
  return nowpaymentsRequest<CreateCryptoPaymentResponse>("POST", "/payment", {
    price_amount: params.amount,
    price_currency: params.price_currency,
    pay_currency: params.pay_currency,
    order_id: params.order_id,
    order_description: params.order_description,
    ipn_callback_url: params.ipn_callback_url,
    success_url: params.success_url,
    cancel_url: params.cancel_url,
  });
}

export async function createCryptoInvoice(
  params: CreateCryptoInvoiceParams
): Promise<CreateCryptoInvoiceResponse> {
  return nowpaymentsRequest<CreateCryptoInvoiceResponse>("POST", "/invoice", {
    price_amount: params.amount,
    price_currency: params.price_currency,
    pay_currency: params.pay_currency,
    order_id: params.order_id,
    order_description: params.order_description,
    ipn_callback_url: params.ipn_callback_url,
    success_url: params.success_url,
    cancel_url: params.cancel_url,
  });
}

export async function getCryptoPayment(paymentId: string | number): Promise<GetCryptoPaymentResponse> {
  return nowpaymentsRequest<GetCryptoPaymentResponse>("GET", `/payment/${encodeURIComponent(String(paymentId))}`);
}

export async function getCryptoCurrencies(): Promise<string[]> {
  try {
    const merchant = await nowpaymentsRequest<MerchantCoinsResponse>("GET", "/merchant/coins");
    const merchantCoins = merchant.selectedCurrencies || merchant.currencies || [];
    if (merchantCoins.length > 0) return merchantCoins;
  } catch {
    // fallback to global list
  }
  const response = await nowpaymentsRequest<CurrenciesResponse>("GET", "/currencies");
  return response.currencies || [];
}

export async function getMinCryptoAmountUSD(payCurrency: string): Promise<number> {
  const response = await nowpaymentsRequest<MinAmountResponse>(
    "GET",
    `/min-amount?currency_from=usd&currency_to=${encodeURIComponent(payCurrency)}`
  );
  return Number(response.min_amount || 0);
}
