const API_BASE_URL = "https://reallysimplesocial.com/api/v2";

interface Service {
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
  order?: number;
  error?: string;
  [key: string]: any; // Allow other fields for debugging
}

interface OrderStatus {
  charge?: string;
  start_count?: string;
  status?: string;
  remains?: string;
  currency?: string;
  error?: string;
}

interface MultipleOrderStatus {
  [key: string]: OrderStatus;
}

interface RefillResponse {
  refill: string | number | { error: string }; // API returns string for single refill, number for multiple
}

interface MultipleRefillResponse {
  order: number;
  refill: number | { error: string };
}

interface RefillStatusResponse {
  status: string | { error: string };
}

interface MultipleRefillStatusResponse {
  refill: number;
  status: string | { error: string };
}

interface CancelResponse {
  order: number;
  cancel: number | { error: string };
}

interface BalanceResponse {
  balance: string;
  currency?: string;
}

class SocialBoostAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "SocialBoostAPIError";
  }
}

async function makeRequest(
  params: Record<string, string | number>
): Promise<any> {
  const apiKey = process.env.SHOPRIME_API_KEY;

  if (!apiKey) {
    console.error("SHOPRIME_API_KEY is missing from environment variables");
    console.error("Available env vars with 'API' or 'KEY':", Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')).join(', '));
    throw new SocialBoostAPIError("SHOPRIME_API_KEY is not configured. Please ensure it's set in .env.local and restart the Next.js server.");
  }

  // Log key info (without exposing full key for security)
  console.log("API Key check:", {
    keyExists: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 8) || "N/A",
    action: params.action,
    keyHasSpaces: apiKey.includes(' '),
    keyHasNewlines: apiKey.includes('\n')
  });

  const formData = new URLSearchParams();
  formData.append("key", apiKey);
  
  Object.entries(params).forEach(([key, value]) => {
    // For quantity, ensure it's sent as a proper number string (no decimals if it's an integer)
    if (key === "quantity" && typeof value === "number") {
      formData.append(key, Math.floor(value).toString());
    } else {
      formData.append(key, String(value));
    }
  });

  const requestBody = formData.toString();
  console.log("API Request Details:", {
    url: API_BASE_URL,
    action: params.action,
    params: Object.fromEntries(formData.entries()),
    body: requestBody,
    quantity_value: params.quantity,
    quantity_type: typeof params.quantity,
    quantity_in_formdata: formData.get("quantity"),
    all_keys: Array.from(formData.keys())
  });

  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
    });

    const responseText = await response.text();
    console.log("API Raw Response:", {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
      ok: response.ok
    });

    if (!response.ok) {
      // Try to parse error response as JSON
      let errorMessage = response.statusText;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } catch (e) {
        // If not JSON, use the text
        errorMessage = responseText || response.statusText;
      }
      
      console.error("API Error:", {
        status: response.status,
        errorMessage: errorMessage,
        rawResponse: responseText,
        action: params.action,
        keyUsed: apiKey ? `${apiKey.substring(0, 8)}...` : "N/A"
      });
      
      // Check if it's an "Invalid key" error and provide helpful message
      if (errorMessage.toLowerCase().includes("invalid key") || (errorMessage.toLowerCase().includes("invalid") && errorMessage.toLowerCase().includes("key"))) {
        console.error("API Key Validation Failed:", {
          message: "The API rejected the provided key",
          suggestion: "Please verify SHOPRIME_API_KEY in your .env.local file is correct and matches your API provider account",
          keyPrefix: apiKey?.substring(0, 8) || "N/A"
        });
      }
      
      throw new SocialBoostAPIError(
        errorMessage,
        response.status
      );
    }

    // Parse successful response
    let data: any;
    try {
      data = JSON.parse(responseText);
      console.log("API Success Response (Parsed):", JSON.stringify(data, null, 2));
      
      // Check if the response contains an error even though status is OK
      // Some APIs return 200 OK with error in the JSON body
      if (data.error) {
        console.error("API returned error in successful response:", {
          error: data.error,
          fullResponse: JSON.stringify(data, null, 2),
          status: response.status,
          requestParams: params
        });
        throw new SocialBoostAPIError(
          data.error || "API returned an error"
        );
      }
      
      // Check for error in any field (some APIs put errors in different fields)
      const errorFields = Object.keys(data).filter(key => 
        key.toLowerCase().includes('error') || 
        key.toLowerCase().includes('message') ||
        (typeof data[key] === 'object' && data[key]?.error)
      );
      if (errorFields.length > 0) {
        console.warn("Potential error fields found in response:", errorFields);
        for (const field of errorFields) {
          if (data[field] && typeof data[field] === 'string' && data[field].toLowerCase().includes('error')) {
            console.error("Error found in field:", field, data[field]);
            throw new SocialBoostAPIError(
              data[field] || "API returned an error"
            );
          }
        }
      }
    } catch (e) {
      if (e instanceof SocialBoostAPIError) {
        throw e;
      }
      console.error("Failed to parse API response as JSON:", responseText);
      throw new SocialBoostAPIError(
        `Invalid JSON response from API: ${responseText}`
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Fetch all available services
 */
export async function getServices(): Promise<Service[]> {
  try {
    const data = await makeRequest({ action: "services" });
    
    if (!Array.isArray(data)) {
      throw new SocialBoostAPIError("Invalid response format for services");
    }
    
    return data;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to fetch services: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Create a new order
 */
export async function createOrder(
  serviceId: number,
  link: string,
  quantity: number,
  runs?: number,
  interval?: number,
  comments?: string
): Promise<number> {
  try {
    // Ensure quantity is a number (not string)
    const quantityNum = typeof quantity === "string" ? parseInt(quantity, 10) : Math.floor(Number(quantity));
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      throw new SocialBoostAPIError(`Invalid quantity: ${quantity}. Must be a positive number.`);
    }
    
    const params: Record<string, string | number> = {
      action: "add",
      service: serviceId,
      link,
      quantity: quantityNum, // Ensure it's a number, not string
    };
    
    // Add comments if provided (for custom comments services)
    // Comments should be separated by newlines
    if (comments && comments.trim() !== "") {
      params.comments = comments.trim();
    }
    
    console.log("API createOrder params:", params);

    if (runs !== undefined) {
      params.runs = runs;
    }
    if (interval !== undefined) {
      params.interval = interval;
    }

    const data = await makeRequest(params) as CreateOrderResponse;
    
    // Log the full response for debugging
    console.log("createOrder - Full API Response:", JSON.stringify(data, null, 2));
    console.log("createOrder - Response keys:", Object.keys(data));
    
    // Check if API returned an error (could be in various formats)
    if (data.error) {
      console.error("API returned error in response:", {
        error: data.error,
        fullResponse: JSON.stringify(data, null, 2),
        params: params,
        quantitySent: quantityNum,
        quantityType: typeof quantityNum,
        serviceId: serviceId
      });
      throw new SocialBoostAPIError(
        data.error || "Order creation failed"
      );
    }
    
    // Check for error in any string field that might contain an error message
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && (
        value.toLowerCase().includes('error') ||
        value.toLowerCase().includes('invalid') ||
        value.toLowerCase().includes('less than minimal') ||
        value.toLowerCase().includes('quantity')
      )) {
        console.error(`Potential error message found in field '${key}':`, value);
        // Don't throw immediately, but log it
      }
    }
    
    if (!data.order || typeof data.order !== "number") {
      // Log the actual response for debugging
      console.error("Invalid order creation response:", JSON.stringify(data, null, 2));
      console.error("Expected 'order' field with number, got:", {
        hasOrder: 'order' in data,
        orderValue: data.order,
        orderType: typeof data.order,
        allFields: Object.keys(data)
      });
      throw new SocialBoostAPIError(
        `Invalid response format for order creation. API returned: ${JSON.stringify(data)}`
      );
    }
    
    return data.order;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to create order: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get status of a single order
 */
export async function getOrderStatus(orderId: number): Promise<OrderStatus> {
  try {
    const data = await makeRequest({
      action: "status",
      order: orderId,
    }) as OrderStatus;
    
    return data;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to get order status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get status of multiple orders (up to 100)
 */
export async function getMultipleOrderStatus(
  orderIds: number[]
): Promise<MultipleOrderStatus> {
  if (orderIds.length === 0) {
    return {};
  }

  if (orderIds.length > 100) {
    throw new SocialBoostAPIError("Maximum 100 orders can be queried at once");
  }

  try {
    const data = await makeRequest({
      action: "status",
      orders: orderIds.join(","),
    }) as MultipleOrderStatus;
    
    return data;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to get multiple order status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Request a refill for an order
 */
export async function requestRefill(orderId: number): Promise<number> {
  try {
    const data = await makeRequest({
      action: "refill",
      order: orderId,
    }) as RefillResponse;
    
    if (typeof data.refill === "object" && "error" in data.refill) {
      throw new SocialBoostAPIError(
        `Refill request failed: ${data.refill.error}`
      );
    }
    
    // API returns refill as string for single refill, convert to number
    if (typeof data.refill === "string") {
      const refillId = parseInt(data.refill, 10);
      if (isNaN(refillId)) {
        throw new SocialBoostAPIError("Invalid refill ID format");
      }
      return refillId;
    }
    
    if (typeof data.refill !== "number") {
      throw new SocialBoostAPIError("Invalid response format for refill");
    }
    
    return data.refill;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to request refill: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Request refills for multiple orders (up to 100)
 */
export async function requestMultipleRefills(
  orderIds: number[]
): Promise<MultipleRefillResponse[]> {
  if (orderIds.length === 0) {
    return [];
  }

  if (orderIds.length > 100) {
    throw new SocialBoostAPIError("Maximum 100 orders can be refilled at once");
  }

  try {
    const data = await makeRequest({
      action: "refill",
      orders: orderIds.join(","),
    }) as MultipleRefillResponse[];
    
    if (!Array.isArray(data)) {
      throw new SocialBoostAPIError("Invalid response format for multiple refills");
    }
    
    return data;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to request multiple refills: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get status of a refill
 */
export async function getRefillStatus(refillId: number): Promise<string> {
  try {
    const data = await makeRequest({
      action: "refill_status",
      refill: refillId,
    }) as RefillStatusResponse;
    
    if (typeof data.status === "object" && "error" in data.status) {
      throw new SocialBoostAPIError(
        `Refill status check failed: ${data.status.error}`
      );
    }
    
    if (typeof data.status !== "string") {
      throw new SocialBoostAPIError("Invalid response format for refill status");
    }
    
    return data.status;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to get refill status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get status of multiple refills (up to 100)
 */
export async function getMultipleRefillStatus(
  refillIds: number[]
): Promise<MultipleRefillStatusResponse[]> {
  if (refillIds.length === 0) {
    return [];
  }

  if (refillIds.length > 100) {
    throw new SocialBoostAPIError("Maximum 100 refills can be queried at once");
  }

  try {
    const data = await makeRequest({
      action: "refill_status",
      refills: refillIds.join(","),
    }) as MultipleRefillStatusResponse[];
    
    if (!Array.isArray(data)) {
      throw new SocialBoostAPIError("Invalid response format for multiple refill status");
    }
    
    return data;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to get multiple refill status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Cancel one or more orders (up to 100)
 */
export async function cancelOrder(orderIds: number[]): Promise<CancelResponse[]> {
  if (orderIds.length === 0) {
    return [];
  }

  if (orderIds.length > 100) {
    throw new SocialBoostAPIError("Maximum 100 orders can be cancelled at once");
  }

  try {
    const data = await makeRequest({
      action: "cancel",
      orders: orderIds.join(","),
    }) as CancelResponse[];
    
    if (!Array.isArray(data)) {
      throw new SocialBoostAPIError("Invalid response format for cancel");
    }
    
    return data;
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to cancel order: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get user balance
 */
export async function getBalance(): Promise<{ balance: string; currency?: string }> {
  try {
    const data = await makeRequest({
      action: "balance",
    }) as BalanceResponse;
    
    if (!data.balance || typeof data.balance !== "string") {
      throw new SocialBoostAPIError("Invalid response format for balance");
    }
    
    return {
      balance: data.balance,
      currency: data.currency,
    };
  } catch (error) {
    if (error instanceof SocialBoostAPIError) {
      throw error;
    }
    throw new SocialBoostAPIError(
      `Failed to get balance: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export { SocialBoostAPIError };

