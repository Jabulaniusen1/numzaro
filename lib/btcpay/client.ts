const BTCPAY_SERVER_URL = (process.env.BTCPAY_SERVER_URL || "").replace(/\/+$/, "");
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY || "";
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID || "";

export class BTCPayError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "BTCPayError";
  }
}

export interface CreateBTCPayInvoiceParams {
  amount: number;
  currency: string;
  orderId: string;
  userId: string;
  redirectUrl?: string;
}

export interface BTCPayInvoice {
  id: string;
  checkoutLink?: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: {
    orderId?: string;
    userId?: string;
    [key: string]: unknown;
  };
}

function validateConfig() {
  if (!BTCPAY_SERVER_URL) {
    throw new BTCPayError("BTCPAY_SERVER_URL is not configured.");
  }
  if (!BTCPAY_API_KEY) {
    throw new BTCPayError("BTCPAY_API_KEY is not configured.");
  }
  if (!BTCPAY_STORE_ID) {
    throw new BTCPayError("BTCPAY_STORE_ID is not configured.");
  }
}

async function btcpayRequest<T>(method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<T> {
  validateConfig();

  const response = await fetch(`${BTCPAY_SERVER_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${BTCPAY_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const raw = await response.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new BTCPayError(`BTCPay returned invalid JSON (${response.status})`, response.status);
  }

  if (!response.ok) {
    throw new BTCPayError(data?.message || `BTCPay API error (${response.status})`, response.status);
  }

  return data as T;
}

export async function createBTCPayInvoice(params: CreateBTCPayInvoiceParams): Promise<BTCPayInvoice> {
  return btcpayRequest<BTCPayInvoice>("POST", `/api/v1/stores/${BTCPAY_STORE_ID}/invoices`, {
    amount: params.amount,
    currency: params.currency,
    metadata: {
      orderId: params.orderId,
      userId: params.userId,
    },
    checkout: {
      redirectURL: params.redirectUrl,
      redirectAutomatically: true,
    },
  });
}

export async function getBTCPayInvoice(invoiceId: string): Promise<BTCPayInvoice> {
  return btcpayRequest<BTCPayInvoice>("GET", `/api/v1/stores/${BTCPAY_STORE_ID}/invoices/${encodeURIComponent(invoiceId)}`);
}
