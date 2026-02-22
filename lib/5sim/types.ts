// 5sim.net API Types

export interface FiveSimProfile {
  id: number;
  email: string;
  vendor: string;
  default_forwarding_number: string;
  balance: number;
  rating: number;
  default_country: {
    name: string;
    iso: string;
    prefix: string;
  };
  default_operator: {
    name: string;
  };
  frozen_balance: number;
}

export interface FiveSimOrder {
  id: string;
  phone: string;
  operator: string;
  product: string;
  price: number;
  status: string;
  expires: string;
  sms: FiveSimMessage[];
  created_at: string;
  country: string;
  forwarding_number: string;
}

export interface FiveSimMessage {
  sender: string;
  text: string;
  code: string;
  created_at: string;
}

export interface FiveSimProduct {
  [key: string]: {
    Category: string;
    Qty: number;
    Price: number;
  };
}

export interface FiveSimPrice {
  country: string;
  product: string;
  price: number;
  operator: string;
  count: number;
}

export interface FiveSimCountry {
  iso: string;
  text_en: string;
  operators: string[];
}

export interface FiveSimVendor {
  id: number;
  email: string;
  vendor: string;
  balance: number;
  rating: number;
  frozen_balance: number;
}

export interface FiveSimVendorPrice {
  ID: number;
  ProductName: string;
  CountryName: string;
  OperatorName: string;
  Price: number;
  Count: number;
  Enabled: boolean;
  AutoDisabled: boolean;
  CreatedAt: string;
}

export interface FiveSimPayment {
  id: number;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

export interface FiveSimWithdrawRequest {
  receiver: string;
  method: string;
  amount: string;
  fee: string;
}

// Order Status Constants
export enum FiveSimOrderStatus {
  PENDING = "PENDING",
  RECEIVED = "RECEIVED", 
  FINISHED = "FINISHED",
  CANCELED = "CANCELED",
  BANNED = "BANNED",
  TIMEOUT = "TIMEOUT"
}

// Product Categories
export enum FiveSimProductCategory {
  ACTIVATION = "activation",
  HOSTING = "hosting", 
  RENTAL = "rental"
}

// Common Operators
export const FIVESIM_OPERATORS = {
  ANY: "any",
  VIRTUAL: "virtual",
  CLARO: "claro",
  GLOBE: "globe",
  VODAFONE: "vodafone",
  ORANGE: "orange",
  TMOBILE: "tmobile",
  ATT: "att",
  VERIZON: "verizon"
} as const;

// Error Types
export interface FiveSimError {
  error: string;
  message?: string;
  status?: number;
}

// API Response Wrapper
export interface FiveSimApiResponse<T> {
  data?: T;
  error?: string;
  status?: string;
}

// Pagination
export interface FiveSimPagination {
  page: number;
  perPage: number;
  total: number;
}

// Order List Response
export interface FiveSimOrdersResponse {
  Data: FiveSimOrder[];
  ProductNames: string[];
  Statuses: string[];
  Total: number;
}

// Vendor Orders Response
export interface FiveSimVendorOrdersResponse extends FiveSimOrdersResponse {
  // Additional vendor-specific fields if needed
}

// Country mapping for 5sim.net
export const FIVESIM_COUNTRY_MAPPING: Record<string, string> = {
  // ISO to 5sim.net country name
  "US": "usa",
  "GB": "england", 
  "RU": "russia",
  "CN": "china",
  "IN": "india",
  "BR": "brazil",
  "DE": "germany",
  "FR": "france",
  "IT": "italy",
  "ES": "spain",
  "CA": "canada",
  "AU": "australia",
  "JP": "japan",
  "KR": "korea",
  "MX": "mexico",
  "ID": "indonesia",
  "PH": "philippines",
  "TH": "thailand",
  "VN": "vietnam",
  "MY": "malaysia",
  "SG": "singapore",
  "NL": "netherlands",
  "BE": "belgium",
  "CH": "switzerland",
  "AT": "austria",
  "SE": "sweden",
  "NO": "norway",
  "DK": "denmark",
  "FI": "finland",
  "PL": "poland",
  "CZ": "czech",
  "HU": "hungary",
  "RO": "romania",
  "GR": "greece",
  "PT": "portugal",
  "IE": "ireland",
  "TR": "turkey",
  "IL": "israel",
  "AE": "uae",
  "SA": "saudi",
  "EG": "egypt",
  "ZA": "southafrica",
  "NG": "nigeria",
  "KE": "kenya",
  "AR": "argentina",
  "CL": "chile",
  "CO": "colombia",
  "PE": "peru",
  "VE": "venezuela",
  "UA": "ukraine",
  "KZ": "kazakhstan",
  "UZ": "uzbekistan",
  "AF": "afghanistan",
  "PK": "pakistan",
  "BD": "bangladesh",
  "LK": "srilanka",
  "NP": "nepal",
  "MM": "myanmar",
  "LA": "laos",
  "KH": "cambodia",
  "MN": "mongolia",
  "GE": "georgia",
  "AM": "armenia",
  "AZ": "azerbaijan",
  "TJ": "tajikistan",
  "TM": "turkmenistan",
  "KG": "kyrgyzstan"
};

// Reverse mapping: 5sim.net country name to ISO
export const FIVESIM_REVERSE_COUNTRY_MAPPING: Record<string, string> = {};
Object.entries(FIVESIM_COUNTRY_MAPPING).forEach(([iso, fiveSimName]) => {
  FIVESIM_REVERSE_COUNTRY_MAPPING[fiveSimName] = iso;
});