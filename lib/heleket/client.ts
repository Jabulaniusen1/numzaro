import crypto from "crypto";

const HELEKET_API_BASE = (process.env.HELEKET_API_BASE || "https://api.heleket.com").replace(/\/+$/, "");
const HELEKET_MERCHANT_ID = process.env.HELEKET_MERCHANT_ID || "";
const HELEKET_PAYMENT_API_KEY = process.env.HELEKET_PAYMENT_API_KEY || "";

export class HeleketError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "HeleketError";
  }
}

export interface HeleketCreateInvoiceParams {
  amount: number;
  currency: string;
  orderId: string;
  urlCallback?: string;
  urlSuccess?: string;
}

export interface HeleketInvoice {
  uuid: string;
  order_id?: string;
  status?: string;
  payment_status?: string;
  is_final?: boolean;
  amount?: string;
  payment_amount?: string;
  payment_amount_usd?: string;
  currency?: string;
  payer_currency?: string;
  network?: string;
  url?: string;
}

function validateConfig() {
  if (!HELEKET_MERCHANT_ID) throw new HeleketError("HELEKET_MERCHANT_ID is not configured.");
  if (!HELEKET_PAYMENT_API_KEY) throw new HeleketError("HELEKET_PAYMENT_API_KEY is not configured.");
}

function stringifyForSign(body: Record<string, unknown>) {
  // Heleket signs JSON with escaped slashes (PHP-style json_encode behavior)
  return JSON.stringify(body).replace(/\//g, "\\/");
}

function createSignFromBody(body: Record<string, unknown>, apiKey: string) {
  const serialized = stringifyForSign(body);
  return crypto.createHash("md5").update(Buffer.from(serialized).toString("base64") + apiKey).digest("hex");
}

async function heleketRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  validateConfig();
  const serializedBody = stringifyForSign(body);

  const response = await fetch(`${HELEKET_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      merchant: HELEKET_MERCHANT_ID,
      sign: crypto
        .createHash("md5")
        .update(Buffer.from(serializedBody).toString("base64") + HELEKET_PAYMENT_API_KEY)
        .digest("hex"),
    },
    // Heleket validates signature against the exact request body string.
    body: serializedBody,
    cache: "no-store",
  });

  const raw = await response.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new HeleketError(`Heleket returned invalid JSON (${response.status})`, response.status);
  }

  if (!response.ok || Number(data?.state) !== 0) {
    throw new HeleketError(data?.message || data?.error || `Heleket API error (${response.status})`, response.status);
  }

  return data as T;
}

export async function createHeleketInvoice(params: HeleketCreateInvoiceParams): Promise<HeleketInvoice> {
  const payload: Record<string, unknown> = {
    amount: String(params.amount),
    currency: params.currency,
    order_id: params.orderId,
  };

  if (params.urlCallback) payload.url_callback = params.urlCallback;
  if (params.urlSuccess) payload.url_success = params.urlSuccess;

  const res = await heleketRequest<{ result: HeleketInvoice }>("/v1/payment", payload);
  return res.result;
}

export async function getHeleketPaymentInfo(input: { uuid?: string; orderId?: string }): Promise<HeleketInvoice> {
  const payload: Record<string, unknown> = {};
  if (input.uuid) payload.uuid = input.uuid;
  if (input.orderId) payload.order_id = input.orderId;

  const res = await heleketRequest<{ result: HeleketInvoice }>("/v1/payment/info", payload);
  return res.result;
}

export async function getHeleketPaymentServices() {
  const res = await heleketRequest<{ result: Array<Record<string, any>> }>("/v1/payment/services", {});
  return res.result || [];
}

export function verifyHeleketWebhookSignature(payload: Record<string, unknown>, receivedSign: string): boolean {
  if (!receivedSign || !HELEKET_PAYMENT_API_KEY) return false;
  const payloadWithoutSign = { ...payload };
  delete (payloadWithoutSign as Record<string, unknown>).sign;
  const localSign = createSignFromBody(payloadWithoutSign, HELEKET_PAYMENT_API_KEY);
  return localSign === receivedSign;
}
