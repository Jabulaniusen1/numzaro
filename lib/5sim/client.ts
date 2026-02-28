export type { FiveSimProfile, FiveSimOrder, FiveSimProduct, FiveSimPrice, FiveSimCountry, FiveSimMessage, FiveSimVendor, FiveSimVendorPrice, FiveSimPayment, FiveSimWithdrawRequest, FiveSimOrdersResponse, FiveSimVendorOrdersResponse, FiveSimError, FiveSimPagination } from './types';
export { FIVESIM_OPERATORS } from './types';

import {
  FiveSimProfile,
  FiveSimOrder,
  FiveSimProduct,
  FiveSimPrice,
  FiveSimCountry,
  FiveSimMessage,
  FiveSimVendor,
  FiveSimVendorPrice,
  FiveSimPayment,
  FiveSimWithdrawRequest,
  FiveSimOrdersResponse,
  FiveSimVendorOrdersResponse,
  FiveSimError,
  FiveSimPagination,
  FIVESIM_OPERATORS
} from './types';

const FIVESIM_API_URL = "https://5sim.net/v1";
const FIVESIM_API_KEY = process.env.FIVESIM_API_KEY;

export class FiveSimClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!FIVESIM_API_KEY) {
      console.warn("FIVESIM_API_KEY is not set in environment variables");
    }
    this.apiKey = FIVESIM_API_KEY || "";
    this.baseUrl = FIVESIM_API_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("5sim.net API Key is missing");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`5sim.net API Error: ${response.status} ${text}`);
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        // Handle known error strings that might be returned with 200 OK or non-JSON headers
        const errorMap: Record<string, string> = {
          "no free phones": "No free phones available for this service/country at the moment.",
          "not enough user balance": "Insufficient balance in your 5Sim account. Please top up your 5Sim balance.",
          "order not found": "The order was not found or has already expired.",
          "bad operator": "The selected operator is not supported or not available.",
          "bad product": "The selected service/product is not supported.",
          "bad country": "The selected country is not supported.",
          "no reverse": "This number does not support re-use or reverse.",
        };

        if (errorMap[text]) {
          throw new Error(errorMap[text]);
        }

        // If it's a small string that's not JSON, it's likely an error message
        if (text.length < 100 && !text.includes('{') && !text.includes('[')) {
          throw new Error(`5Sim Error: ${text}`);
        }

        // If it's just a string and we can't parse it as JSON, return it as any if possible
        return text as any;
      }
    } catch (error) {
      console.error("5sim.net Request Error:", error);
      throw error;
    }
  }

  // User Management
  async getProfile(): Promise<FiveSimProfile> {
    return this.request<FiveSimProfile>('/user/profile');
  }

  async getBalance(): Promise<number> {
    const profile = await this.getProfile();
    return profile.balance;
  }

  async getOrders(params?: {
    category?: string;
    limit?: number;
    offset?: number;
    order?: string;
    reverse?: boolean;
  }): Promise<FiveSimOrdersResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<FiveSimOrdersResponse>(`/user/orders${query ? `?${query}` : ''}`);
  }

  async getPayments(params?: {
    limit?: number;
    offset?: number;
    order?: string;
    reverse?: boolean;
  }): Promise<{ Data: FiveSimPayment[]; Total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/user/payments${query ? `?${query}` : ''}`);
  }

  // Products and Pricing
  async getProducts(country: string, operator: string): Promise<FiveSimProduct> {
    return this.request<FiveSimProduct>(`/guest/products/${country}/${operator}`);
  }

  async getPrices(params?: {
    country?: string;
    product?: string;
  }): Promise<Record<string, Record<string, FiveSimPrice>>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/guest/prices${query ? `?${query}` : ''}`);
  }

  async getCountries(): Promise<FiveSimCountry[]> {
    return this.request<FiveSimCountry[]>('/guest/countries');
  }

  // Order Management
  async buyActivation(
    country: string,
    operator: string,
    product: string,
    options?: {
      forwarding?: string;
      number?: string;
      reuse?: number;
      voice?: number;
      ref?: string;
    }
  ): Promise<FiveSimOrder> {
    const searchParams = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<FiveSimOrder>(`/user/buy/activation/${country}/${operator}/${product}${query ? `?${query}` : ''}`);
  }

  async buyHosting(
    country: string,
    operator: string,
    product: string,
    options?: {
      forwarding?: string;
      number?: string;
      reuse?: number;
      voice?: number;
      ref?: string;
    }
  ): Promise<FiveSimOrder> {
    const searchParams = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<FiveSimOrder>(`/user/buy/hosting/${country}/${operator}/${product}${query ? `?${query}` : ''}`);
  }

  async checkOrder(orderId: string): Promise<FiveSimOrder> {
    return this.request<FiveSimOrder>(`/user/check/${orderId}`);
  }

  async finishOrder(orderId: string): Promise<FiveSimOrder> {
    return this.request<FiveSimOrder>(`/user/finish/${orderId}`);
  }

  async cancelOrder(orderId: string): Promise<FiveSimOrder> {
    return this.request<FiveSimOrder>(`/user/cancel/${orderId}`);
  }

  async banOrder(orderId: string): Promise<FiveSimOrder> {
    return this.request<FiveSimOrder>(`/user/ban/${orderId}`);
  }

  async reuseNumber(product: string, number: string): Promise<FiveSimOrder> {
    return this.request<FiveSimOrder>(`/user/reuse/${product}/${number}`);
  }

  async getSmsInbox(orderId: string): Promise<{ Data: FiveSimMessage[]; Total: number }> {
    return this.request(`/user/sms/inbox/${orderId}`);
  }

  // Vendor Management (Reseller Features)
  async getVendorProfile(): Promise<FiveSimVendor> {
    return this.request<FiveSimVendor>('/user/vendor');
  }

  async getVendorOrders(params?: {
    category?: string;
    limit?: number;
    offset?: number;
    order?: string;
    reverse?: boolean;
  }): Promise<FiveSimVendorOrdersResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<FiveSimVendorOrdersResponse>(`/vendor/orders${query ? `?${query}` : ''}`);
  }

  async getVendorPayments(params?: {
    limit?: number;
    offset?: number;
    order?: string;
    reverse?: boolean;
  }): Promise<{ Data: FiveSimPayment[]; PaymentTypes: string[]; Total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/vendor/payments${query ? `?${query}` : ''}`);
  }

  async getVendorWallets(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/vendor/wallets');
  }

  async getVendorPrices(params?: {
    _filters?: string;
    _sortDir?: string;
    _sortField?: string;
    _page?: number;
    _perPage?: number;
  }): Promise<{ Data: FiveSimVendorPrice[]; Total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/vendor/prices${query ? `?${query}` : ''}`);
  }

  async createVendorPrice(price: {
    Price: number;
    ProductName: string;
    CountryName: string;
    OperatorName: string;
  }): Promise<FiveSimVendorPrice> {
    return this.request<FiveSimVendorPrice>('/vendor/prices', {
      method: 'PUT',
      body: JSON.stringify(price),
    });
  }

  async updateVendorPrice(price: {
    Price: number;
    Product: string;
    Country: string;
    Operator: string;
  }): Promise<FiveSimVendorPrice> {
    return this.request<FiveSimVendorPrice>('/vendor/prices', {
      method: 'POST',
      body: JSON.stringify(price),
    });
  }

  async toggleVendorPrices(disable: boolean, priceIds: number[]): Promise<void> {
    return this.request('/vendor/prices/disable', {
      method: 'POST',
      body: JSON.stringify({
        Disable: disable,
        List: priceIds
      }),
    });
  }

  async withdraw(request: FiveSimWithdrawRequest): Promise<void> {
    return this.request('/vendor/withdraw', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Notifications
  async getNotifications(lang: string = 'en'): Promise<{ text: string }> {
    return this.request(`/guest/flash/${lang}`);
  }

  // Utility Methods
  async getMaxPrices(): Promise<Array<{
    id: number;
    product_name: string;
    price: number;
    CreatedAt: string;
  }>> {
    return this.request('/user/max-prices');
  }

  async createMaxPrice(productName: string, price: number): Promise<void> {
    return this.request('/user/max-prices', {
      method: 'POST',
      body: JSON.stringify({
        product_name: productName,
        price: price,
      }),
    });
  }

  async deleteMaxPrice(productName: string): Promise<void> {
    return this.request('/user/max-prices', {
      method: 'DELETE',
      body: JSON.stringify({
        product_name: productName,
      }),
    });
  }
}

export const fiveSimClient = new FiveSimClient();
