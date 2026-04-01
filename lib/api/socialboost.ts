const API_BASE_URL =
  process.env.SMMFOLLOWS_API_URL || "https://smmfollows.com/api/v2";

export interface Service {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill: boolean;
  cancel: boolean;
}

interface CreateOrderResponse {
  order?: number | string;
  error?: string;
}

export interface OrderStatus {
  charge?: string;
  start_count?: string;
  status?: string;
  remains?: string;
  currency?: string;
  error?: string;
}

export interface MultipleOrderStatus {
  [key: string]: OrderStatus;
}

interface RefillResponse {
  refill?: string | number | { error: string };
  error?: string;
}

export interface MultipleRefillResponse {
  order: number;
  refill: number | { error: string };
}

interface RefillStatusResponse {
  status?: string | { error: string };
  error?: string;
}

export interface MultipleRefillStatusResponse {
  refill: number;
  status: string | { error: string };
}

export interface CancelResponse {
  order: number;
  cancel: number | { error: string };
}

interface BalanceResponse {
  balance?: string;
  currency?: string;
  error?: string;
}

class SocialBoostAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "SocialBoostAPIError";
  }
}

function getApiKey() {
  return process.env.SMMFOLLOWS_API_KEY || process.env.SHOPRIME_API_KEY || "";
}

function parseId(value: number | string | undefined, field: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  throw new SocialBoostAPIError(`Invalid ${field} in provider response`);
}

function throwIfApiError(data: unknown) {
  if (!data || typeof data !== "object") return;
  const err = (data as Record<string, unknown>).error;
  if (typeof err === "string" && err.trim()) {
    throw new SocialBoostAPIError(err.trim());
  }
}

async function makeRequest(params: Record<string, string | number>): Promise<unknown> {
  const apiKey = getApiKey().trim();
  if (!apiKey) {
    throw new SocialBoostAPIError(
      "Missing SMMFOLLOWS API key. Set SMMFOLLOWS_API_KEY (or SHOPRIME_API_KEY for backward compatibility)."
    );
  }

  const formData = new URLSearchParams();
  formData.set("key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    formData.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
      cache: "no-store",
    });
  } catch (error) {
    throw new SocialBoostAPIError(
      `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  const raw = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(raw || "{}");
  } catch {
    throw new SocialBoostAPIError(
      `Provider returned non-JSON response (${response.status})`,
      response.status
    );
  }

  if (!response.ok) {
    throwIfApiError(data);
    throw new SocialBoostAPIError(
      `Provider request failed (${response.status})`,
      response.status
    );
  }

  throwIfApiError(data);
  return data;
}

export async function getServices(): Promise<Service[]> {
  const data = await makeRequest({ action: "services" });
  if (!Array.isArray(data)) {
    throw new SocialBoostAPIError("Invalid response format for services");
  }
  return data as Service[];
}

export async function createOrder(
  serviceId: number,
  link: string,
  quantity: number,
  runs?: number,
  interval?: number,
  comments?: string
): Promise<number> {
  const quantityNum = Math.floor(Number(quantity));
  if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
    throw new SocialBoostAPIError("Quantity must be a positive number");
  }

  const params: Record<string, string | number> = {
    action: "add",
    service: serviceId,
    link: link.trim(),
    quantity: quantityNum,
  };

  if (typeof runs === "number") params.runs = runs;
  if (typeof interval === "number") params.interval = interval;
  if (comments?.trim()) params.comments = comments.trim();

  const data = (await makeRequest(params)) as CreateOrderResponse;
  return parseId(data.order, "order");
}

export async function getOrderStatus(orderId: number): Promise<OrderStatus> {
  const data = await makeRequest({
    action: "status",
    order: orderId,
  });
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new SocialBoostAPIError("Invalid response format for order status");
  }
  return data as OrderStatus;
}

export async function getMultipleOrderStatus(
  orderIds: number[]
): Promise<MultipleOrderStatus> {
  if (orderIds.length === 0) return {};
  if (orderIds.length > 100) {
    throw new SocialBoostAPIError("Maximum 100 orders can be queried at once");
  }

  const data = await makeRequest({
    action: "status",
    orders: orderIds.join(","),
  });
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new SocialBoostAPIError("Invalid response format for multiple order status");
  }
  return data as MultipleOrderStatus;
}

export async function requestRefill(orderId: number): Promise<number> {
  const data = (await makeRequest({
    action: "refill",
    order: orderId,
  })) as RefillResponse;

  if (typeof data.refill === "object" && data.refill && "error" in data.refill) {
    throw new SocialBoostAPIError(String(data.refill.error));
  }

  return parseId(data.refill, "refill");
}

export async function requestMultipleRefills(
  orderIds: number[]
): Promise<MultipleRefillResponse[]> {
  if (orderIds.length === 0) return [];
  if (orderIds.length > 100) {
    throw new SocialBoostAPIError("Maximum 100 orders can be refilled at once");
  }

  const data = await makeRequest({
    action: "refill",
    orders: orderIds.join(","),
  });
  if (!Array.isArray(data)) {
    throw new SocialBoostAPIError("Invalid response format for multiple refills");
  }
  return data as MultipleRefillResponse[];
}

export async function getRefillStatus(refillId: number): Promise<string> {
  const data = (await makeRequest({
    action: "refill_status",
    refill: refillId,
  })) as RefillStatusResponse;

  if (typeof data.status === "object" && data.status && "error" in data.status) {
    throw new SocialBoostAPIError(String(data.status.error));
  }
  if (typeof data.status !== "string") {
    throw new SocialBoostAPIError("Invalid response format for refill status");
  }
  return data.status;
}

export async function getMultipleRefillStatus(
  refillIds: number[]
): Promise<MultipleRefillStatusResponse[]> {
  if (refillIds.length === 0) return [];
  if (refillIds.length > 100) {
    throw new SocialBoostAPIError("Maximum 100 refills can be queried at once");
  }

  const data = await makeRequest({
    action: "refill_status",
    refills: refillIds.join(","),
  });
  if (!Array.isArray(data)) {
    throw new SocialBoostAPIError("Invalid response format for multiple refill status");
  }
  return data as MultipleRefillStatusResponse[];
}

export async function cancelOrder(orderIds: number[]): Promise<CancelResponse[]> {
  if (orderIds.length === 0) return [];
  if (orderIds.length > 100) {
    throw new SocialBoostAPIError("Maximum 100 orders can be cancelled at once");
  }

  const data = await makeRequest({
    action: "cancel",
    orders: orderIds.join(","),
  });
  if (!Array.isArray(data)) {
    throw new SocialBoostAPIError("Invalid response format for cancel");
  }
  return data as CancelResponse[];
}

export async function getBalance(): Promise<{ balance: string; currency?: string }> {
  const data = (await makeRequest({
    action: "balance",
  })) as BalanceResponse;

  if (typeof data.balance !== "string") {
    throw new SocialBoostAPIError("Invalid response format for balance");
  }
  return {
    balance: data.balance,
    currency: data.currency,
  };
}

export { SocialBoostAPIError };
