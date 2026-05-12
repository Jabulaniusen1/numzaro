const KORAPAY_SECRET_KEY =
  process.env.KORAPAY_SECRET_KEY || process.env.KORAPAY_API_KEY || "";
const KORAPAY_BASE_URL =
  process.env.KORAPAY_BASE_URL || "https://api.korapay.com";

export class KorapayError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "KorapayError";
  }
}

export interface InitializeChargeParams {
  amount: number;           // In main currency unit (e.g. 500 for NGN 500 — NOT kobo)
  currency: string;         // e.g. "NGN", "USD"
  email: string;
  reference: string;
  redirect_url?: string;
  notification_url?: string;
  merchant_bears_cost?: boolean;
  metadata?: Record<string, any>;
}

export interface InitializeChargeResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    checkout_url: string;
  };
}

export interface VerifyChargeResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;          // "success" | "failed" | "pending"
    amount: number;          // In main currency unit
    currency: string;
    metadata?: Record<string, any>;
    customer?: { email: string; name?: string };
  };
}

async function makeRequest(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, any>
): Promise<unknown> {
  const key = KORAPAY_SECRET_KEY.trim();
  if (!key) {
    throw new KorapayError(
      "Missing Korapay secret key. Set KORAPAY_SECRET_KEY in your environment variables."
    );
  }

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  };

  if (body) options.body = JSON.stringify(body);

  let response: Response;
  try {
    response = await fetch(`${KORAPAY_BASE_URL}${path}`, options);
  } catch (err) {
    throw new KorapayError(
      `Network error: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw || "{}");
  } catch {
    throw new KorapayError(
      `Korapay returned non-JSON response (${response.status})`,
      response.status
    );
  }

  if (!response.ok) {
    const msg =
      data?.message || data?.error || `Korapay API error (${response.status})`;
    throw new KorapayError(msg, response.status);
  }

  if (data?.status === false) {
    throw new KorapayError(data.message || "Korapay request failed");
  }

  return data;
}

export async function initializeCharge(
  params: InitializeChargeParams
): Promise<InitializeChargeResponse> {
  const data = (await makeRequest("POST", "/merchant/api/v1/charges/initialize", {
    amount: params.amount,
    currency: params.currency,
    reference: params.reference,
    customer: { email: params.email },
    merchant_bears_cost: params.merchant_bears_cost ?? false,
    ...(params.redirect_url && { redirect_url: params.redirect_url }),
    ...(params.notification_url && { notification_url: params.notification_url }),
    ...(params.metadata && { metadata: params.metadata }),
  })) as InitializeChargeResponse;

  return data;
}

export async function verifyCharge(
  reference: string
): Promise<VerifyChargeResponse> {
  const data = (await makeRequest(
    "GET",
    `/merchant/api/v1/charges/${encodeURIComponent(reference)}`
  )) as VerifyChargeResponse;

  return data;
}
