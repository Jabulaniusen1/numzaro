import { fiveSimClient, FiveSimOrder, FiveSimPrice, FiveSimProduct, FiveSimCountry } from './client';
import { isoToFiveSimCountry, fiveSimCountryToIso } from './countries';
import { getServiceProduct, getProductService } from './products';
import { FiveSimOrderStatus, FiveSimProductCategory } from './types';
import { AvailableNumber, NumberType, PurchasedNumber } from '@/lib/twilio/numbers';

// Map 5sim.net order status to our internal status
function mapOrderStatus(status: string): string {
  switch (status.toUpperCase()) {
    case FiveSimOrderStatus.PENDING:
    case FiveSimOrderStatus.RECEIVED:
      return 'pending';
    case FiveSimOrderStatus.FINISHED:
      return 'active';
    case FiveSimOrderStatus.CANCELED:
    case FiveSimOrderStatus.BANNED:
    case FiveSimOrderStatus.TIMEOUT:
      return 'cancelled';
    default:
      return 'unknown';
  }
}

// Map 5sim.net order to our PurchasedNumber interface
function mapOrderToPurchasedNumber(order: FiveSimOrder): PurchasedNumber {
  const isoCountry = fiveSimCountryToIso(order.country) || order.country;
  
  return {
    sid: order.id.toString(),
    phoneNumber: order.phone,
    friendlyName: order.phone,
    countryCode: isoCountry,
    region: order.country,
    capabilities: {
      voice: false,
      SMS: true,
      MMS: false
    }
  };
}

/**
 * Search for available numbers using 5sim.net API
 */
export async function searchAvailableNumbers(
  countryCode: string,
  capabilities: string[] = ["SMS"],
  page: number = 1,
  pageSize: number = 20,
  numberType: NumberType = "mobile"
): Promise<{ numbers: AvailableNumber[]; hasMore: boolean; totalPages: number; numberType: NumberType }> {

  // 5sim.net primarily supports mobile numbers for SMS receiving
  if (numberType !== "mobile") {
    return {
      numbers: [],
      hasMore: false,
      totalPages: 0,
      numberType,
    };
  }

  try {
    // Convert ISO country code to 5sim.net country name
    const fiveSimCountry = isoToFiveSimCountry(countryCode);
    if (!fiveSimCountry) {
      throw new Error(`Country ${countryCode} not supported by 5sim.net`);
    }

    // Get available products and prices
    const products = await fiveSimClient.getProducts(fiveSimCountry, "any");
    const prices = await fiveSimClient.getPrices({ country: fiveSimCountry });

    const numbers: AvailableNumber[] = [];
    let totalCount = 0;

    // Process available products
    Object.entries(products).forEach(([product, info]) => {
      if (info.Qty > 0) {
        totalCount += info.Qty;
        
        // Only add numbers for current page
        if (numbers.length < pageSize) {
          const serviceCode = getProductService(product);
          const price = prices[fiveSimCountry]?.[product]?.price || info.Price;
          
          numbers.push({
            friendlyName: `Available ${countryCode} Mobile`,
            phoneNumber: `+${countryCode}XXXXXXX${String(numbers.length).padStart(4, '0')}`, // Placeholder
            region: countryCode,
            countryCode: countryCode,
            capabilities: {
              voice: false,
              SMS: true,
              MMS: false,
            },
            monthlyRate: price.toFixed(2),
            basePrice: price,
            currentPrice: price,
            numberType: "mobile",
            isVoIP: false,
          });
        }
      }
    });

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = page < totalPages;

    return {
      numbers,
      hasMore,
      totalPages,
      numberType,
    };

  } catch (error) {
    console.error("5sim.net Search Error:", error);
    return {
      numbers: [],
      hasMore: false,
      totalPages: 0,
      numberType,
    };
  }
}

/**
 * Purchase a phone number from 5sim.net
 */
export async function purchaseNumber(
  countryCodeOrSid: string,
  webhookUrl?: string,
  addressSid?: string,
  bundleSid?: string,
  service?: string,
  operator: string = "any",
  maxPrice?: number,
  fixedPrice?: number,
  ref?: string
): Promise<PurchasedNumber> {
  try {
    // Convert country code to 5sim.net format
    let isoCountryCode = countryCodeOrSid;
    if (/^\d+$/.test(countryCodeOrSid)) {
      // If numeric code, we need to convert to ISO first
      // This is a simplified mapping - you might need a more comprehensive one
      const countryMap: Record<string, string> = {
        "44": "GB", 
        "49": "DE",
        "33": "FR",
        "39": "IT",
        "34": "ES",
        "31": "NL",
        "41": "CH",
        "43": "AT",
        "46": "SE",
        "47": "NO",
        "45": "DK",
        "358": "FI",
        "48": "PL",
        "420": "CZ",
        "36": "HU",
        "40": "RO",
        "30": "GR",
        "351": "PT",
        "353": "IE",
        "90": "TR",
        "972": "IL",
        "971": "AE",
        "966": "SA",
        "20": "EG",
        "27": "ZA",
        "234": "NG",
        "254": "KE",
        "380": "UA",
        "7": "RU",
        "86": "CN",
        "91": "IN",
        "55": "BR",
        "54": "AR",
        "56": "CL",
        "57": "CO",
        "51": "PE",
        "58": "VE",
        "1": "US", // Keep US as the primary mapping for 1
        "61": "AU",
        "81": "JP",
        "82": "KR",
        "52": "MX",
        "62": "ID",
        "63": "PH",
        "66": "TH",
        "84": "VN",
        "60": "MY",
        "65": "SG"
      };
      isoCountryCode = countryMap[countryCodeOrSid] || countryCodeOrSid;
    }

    const fiveSimCountry = isoToFiveSimCountry(isoCountryCode);
    if (!fiveSimCountry) {
      throw new Error(`Country ${isoCountryCode} not supported by 5sim.net`);
    }

    // Convert service to 5sim.net product
    const selectedService = service || "other";
    const product = getServiceProduct(selectedService);

    // Purchase activation number
    const order = await fiveSimClient.buyActivation(
      fiveSimCountry,
      operator,
      product,
      {
        forwarding: webhookUrl,
        ref: ref
      }
    );

    return mapOrderToPurchasedNumber(order);

  } catch (error) {
    console.error("5sim.net Purchase Error:", error);
    throw error;
  }
}

/**
 * Configure number webhook (5sim.net handles this differently)
 */
export async function configureNumberWebhook(
  phoneNumberSid: string,
  webhookUrl: string
): Promise<void> {
  // 5sim.net doesn't support per-number webhook configuration via API
  // Webhooks are configured globally in the dashboard
  // We could potentially use the forwarding parameter during purchase
  console.log(`[5sim.net] Webhook configuration for ${phoneNumberSid} not supported via API`);
}

/**
 * Release/finish a number
 */
export async function releaseNumber(phoneNumberSid: string): Promise<void> {
  try {
    // In 5sim.net, we finish the order instead of releasing
    await fiveSimClient.finishOrder(phoneNumberSid);
  } catch (error) {
    console.error("5sim.net Release Error:", error);
    throw error;
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(phoneNumberSid: string): Promise<void> {
  try {
    await fiveSimClient.cancelOrder(phoneNumberSid);
  } catch (error) {
    console.error("5sim.net Cancel Error:", error);
    throw error;
  }
}

/**
 * Check order status and get SMS
 */
export async function checkOrderStatus(phoneNumberSid: string): Promise<{
  status: string;
  sms?: string;
  phoneNumber: string;
}> {
  try {
    const order = await fiveSimClient.checkOrder(phoneNumberSid);
    
    let smsText: string | undefined;
    if (order.sms && order.sms.length > 0) {
      smsText = order.sms[0].text;
    }

    return {
      status: mapOrderStatus(order.status),
      sms: smsText,
      phoneNumber: order.phone
    };
  } catch (error) {
    console.error("5sim.net Check Status Error:", error);
    throw error;
  }
}

/**
 * Get pricing information
 */
export async function getPricing(
  countryCode?: string,
  service?: string
): Promise<Record<string, Record<string, FiveSimPrice>>> {
  try {
    const params: any = {};
    if (countryCode) {
      const fiveSimCountry = isoToFiveSimCountry(countryCode);
      if (fiveSimCountry) {
        params.country = fiveSimCountry;
      }
    }
    if (service) {
      params.product = getServiceProduct(service);
    }

    return await fiveSimClient.getPrices(params);
  } catch (error) {
    console.error("5sim.net Pricing Error:", error);
    throw error;
  }
}

/**
 * Get available countries
 */
export async function getAvailableCountries(): Promise<FiveSimCountry[]> {
  try {
    return await fiveSimClient.getCountries();
  } catch (error) {
    console.error("5sim.net Countries Error:", error);
    throw error;
  }
}

/**
 * Get available products for a country
 */
export async function getAvailableProducts(
  countryCode: string,
  operator: string = "any"
): Promise<FiveSimProduct> {
  try {
    const fiveSimCountry = isoToFiveSimCountry(countryCode);
    if (!fiveSimCountry) {
      throw new Error(`Country ${countryCode} not supported by 5sim.net`);
    }

    return await fiveSimClient.getProducts(fiveSimCountry, operator);
  } catch (error) {
    console.error("5sim.net Products Error:", error);
    throw error;
  }
}
