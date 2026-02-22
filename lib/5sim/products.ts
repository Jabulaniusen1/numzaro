import { FiveSimProductCategory } from './types';

// Service/Product mapping for 5sim.net

/**
 * Map common service names to 5sim.net product names
 */
export const SERVICE_TO_PRODUCT_MAPPING: Record<string, string> = {
  // Social Media
  "tg": "telegram",
  "telegram": "telegram",
  "wa": "whatsapp", 
  "whatsapp": "whatsapp",
  "fb": "facebook",
  "facebook": "facebook",
  "ig": "instagram",
  "instagram": "instagram",
  "tw": "twitter",
  "twitter": "twitter",
  "tiktok": "tiktok",
  "snapchat": "snapchat",
  "linkedin": "linkedin",
  "viber": "viber",
  "signal": "signal",
  "discord": "discord",
  
  // Communication
  "skype": "skype",
  "zoom": "zoom",
  "teams": "teams",
  
  // E-commerce
  "amazon": "amazon",
  "ebay": "ebay",
  "shopify": "shopify",
  
  // Banking & Finance
  "paypal": "paypal",
  "stripe": "stripe",
  "revolut": "revolut",
  
  // Gaming
  "steam": "steam",
  "epic": "epic",
  
  // Other
  "google": "google",
  "apple": "apple",
  "microsoft": "microsoft",
  "yahoo": "yahoo",
  "yandex": "yandex",
  "mail": "mail",
  "protonmail": "protonmail",
  
  // Generic/Other
  "ot": "other",
  "other": "other"
};

/**
 * Map 5sim.net product names back to common service codes
 */
export const PRODUCT_TO_SERVICE_MAPPING: Record<string, string> = {};
Object.entries(SERVICE_TO_PRODUCT_MAPPING).forEach(([service, product]) => {
  PRODUCT_TO_SERVICE_MAPPING[product] = service;
});

/**
 * Get product name for a service
 * @param service Service code (e.g., 'tg', 'wa', 'fb')
 * @returns 5sim.net product name or 'other' if not found
 */
export function getServiceProduct(service: string): string {
  return SERVICE_TO_PRODUCT_MAPPING[service.toLowerCase()] || "other";
}

/**
 * Get service code for a product
 * @param product 5sim.net product name
 * @returns Service code or product name if not found
 */
export function getProductService(product: string): string {
  return PRODUCT_TO_SERVICE_MAPPING[product.toLowerCase()] || product;
}

/**
 * Get product category
 * @param product 5sim.net product name
 * @returns Product category
 */
export function getProductCategory(product: string): FiveSimProductCategory {
  // Most products are activation type by default
  // This could be expanded based on 5sim.net product catalog
  const hostingProducts = ["hosting", "rental"];
  const rentalProducts = ["rental", "longrent"];
  
  if (hostingProducts.includes(product.toLowerCase())) {
    return FiveSimProductCategory.HOSTING;
  }
  
  if (rentalProducts.includes(product.toLowerCase())) {
    return FiveSimProductCategory.RENTAL;
  }
  
  return FiveSimProductCategory.ACTIVATION;
}

/**
 * Get popular services for quick selection
 * @returns Array of popular service codes
 */
export function getPopularServices(): string[] {
  return [
    "telegram",    // Most popular
    "whatsapp",    // Second most popular
    "facebook",
    "instagram", 
    "twitter",
    "google",
    "amazon",
    "apple"
  ];
}

/**
 * Get services by category
 * @returns Object with categories as keys and arrays of service codes as values
 */
export function getServicesByCategory(): Record<string, string[]> {
  return {
    "Social Media": [
      "telegram", "whatsapp", "facebook", "instagram", 
      "twitter", "tiktok", "snapchat", "linkedin", "viber"
    ],
    "Communication": [
      "skype", "zoom", "teams", "discord", "signal"
    ],
    "E-commerce": [
      "amazon", "ebay", "shopify", "paypal"
    ],
    "Banking": [
      "paypal", "stripe", "revolut"
    ],
    "Gaming": [
      "steam", "epic"
    ],
    "Email": [
      "google", "yahoo", "yandex", "mail", "protonmail"
    ],
    "Other": [
      "apple", "microsoft", "other"
    ]
  };
}

/**
 * Get service display names
 * @returns Mapping of service codes to display names
 */
export function getServiceDisplayNames(): Record<string, string> {
  return {
    "telegram": "Telegram",
    "whatsapp": "WhatsApp",
    "facebook": "Facebook", 
    "instagram": "Instagram",
    "twitter": "Twitter",
    "tiktok": "TikTok",
    "snapchat": "Snapchat",
    "linkedin": "LinkedIn",
    "viber": "Viber",
    "signal": "Signal",
    "discord": "Discord",
    "skype": "Skype",
    "zoom": "Zoom",
    "teams": "Microsoft Teams",
    "amazon": "Amazon",
    "ebay": "eBay",
    "shopify": "Shopify",
    "paypal": "PayPal",
    "stripe": "Stripe",
    "revolut": "Revolut",
    "steam": "Steam",
    "epic": "Epic Games",
    "google": "Google",
    "apple": "Apple",
    "microsoft": "Microsoft",
    "yahoo": "Yahoo",
    "yandex": "Yandex",
    "mail": "Mail.ru",
    "protonmail": "ProtonMail",
    "other": "Other"
  };
}

/**
 * Validate if a service is supported
 * @param service Service code
 * @returns true if supported, false otherwise
 */
export function isServiceSupported(service: string): boolean {
  return service.toLowerCase() in SERVICE_TO_PRODUCT_MAPPING;
}

/**
 * Get all supported services
 * @returns Array of supported service codes
 */
export function getSupportedServices(): string[] {
  return Object.keys(SERVICE_TO_PRODUCT_MAPPING);
}
