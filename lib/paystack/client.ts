import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

export interface InitializeTransactionParams {
  email: string;
  amount: number; // in kobo (smallest currency unit) or smallest unit of the currency
  currency?: string; // Currency code (e.g., 'NGN', 'USD', 'GHS'). Defaults to 'NGN' for Nigerian accounts
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    log: any;
    fees: number;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: Record<string, any>;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

class PaystackError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "PaystackError";
  }
}

export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<InitializeTransactionResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new PaystackError("PAYSTACK_SECRET_KEY is not configured");
  }

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: params.email,
        amount: params.amount,
        currency: params.currency || "NGN", // Default to NGN if not specified
        reference: params.reference,
        callback_url: params.callback_url,
        metadata: params.metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new PaystackError(
        error.response.data?.message || "Paystack API error",
        error.response.status
      );
    }
    throw new PaystackError(
      `Network error: ${error.message || "Unknown error"}`
    );
  }
}

export async function verifyTransaction(
  reference: string
): Promise<VerifyTransactionResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new PaystackError("PAYSTACK_SECRET_KEY is not configured");
  }

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new PaystackError(
        error.response.data?.message || "Paystack API error",
        error.response.status
      );
    }
    throw new PaystackError(
      `Network error: ${error.message || "Unknown error"}`
    );
  }
}

export { PaystackError };

