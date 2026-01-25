import { twilioClient, TwilioError } from "./client";
import { getTwilioMonthlyCost } from "./costs";

export interface AvailableNumber {
  friendlyName: string;
  phoneNumber: string;
  region: string;
  countryCode: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
  monthlyRate: string;
  basePrice?: number; // Actual Twilio base price in USD
  currentPrice?: number; // Current price (may differ from basePrice)
}

export interface PurchasedNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  countryCode: string;
  region: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
}

export type NumberType = "local" | "mobile" | "tollFree";

/**
 * Search for available phone numbers in Twilio inventory
 */
export async function searchAvailableNumbers(
  countryCode: string,
  capabilities: string[] = ["SMS"],
  page: number = 1,
  pageSize: number = 50,
  numberType: NumberType = "local"
): Promise<{ numbers: AvailableNumber[]; hasMore: boolean; totalPages: number; numberType: NumberType }> {
  try {
    console.log(`[Twilio] Searching for ${numberType} numbers in country: ${countryCode}, capabilities:`, capabilities, `page: ${page}, pageSize: ${pageSize}`);
    
    const searchParams: any = {
      pageSize: pageSize,
      page: page,
    };
    
    // Only add capability filters if explicitly requested
    // Some numbers may not have all capabilities but are still available
    if (capabilities.includes("SMS")) {
      searchParams.smsEnabled = true;
    }
    if (capabilities.includes("voice")) {
      searchParams.voiceEnabled = true;
    }
    
    console.log(`[Twilio] Search parameters:`, searchParams);
    
    // Search based on number type
    let results;
    try {
      switch (numberType) {
        case "mobile":
          results = await twilioClient.availablePhoneNumbers(countryCode).mobile.list(searchParams);
          break;
        case "tollFree":
          results = await twilioClient.availablePhoneNumbers(countryCode).tollFree.list(searchParams);
          break;
        case "local":
        default:
          results = await twilioClient.availablePhoneNumbers(countryCode).local.list(searchParams);
          break;
      }
    } catch (typeError: any) {
      // Log detailed error info
      console.warn(`[Twilio] Error searching for ${numberType} numbers in country ${countryCode}:`, {
        message: typeError.message,
        code: typeError.code,
        status: typeError.status,
        moreInfo: typeError.moreInfo,
      });
      
      // Handle authentication errors separately (401 or code 20003 with 401 status)
      if (typeError.status === 401 || (typeError.code === 20003 && typeError.status === 401)) {
        console.error("[Twilio] Authentication failed. Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.");
        throw new TwilioError(
          "Twilio authentication failed. Please verify your Twilio credentials (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN) are correct and set in your environment variables.",
          typeError.status,
          typeError.code
        );
      }
      
      // Handle invalid country code or number type not supported (400, 404)
      if (typeError.status === 400 || typeError.status === 404) {
        // Invalid country code or number type not supported
        // This is expected for some country/type combinations
        return {
          numbers: [],
          hasMore: false,
          totalPages: 0,
          numberType,
        };
      }
      
      // For other errors, re-throw them
      throw typeError;
    }
    
    console.log(`[Twilio] Found ${results.length} ${numberType} numbers`);

    if (results.length === 0) {
      console.warn(`[Twilio] No ${numberType} numbers found for country ${countryCode}.`, {
        possibleReasons: [
          "No inventory available for this number type in this country",
          "Search filters may be too restrictive (try removing capability filters)",
          "Regulatory requirements may need to be met",
          "Account may need address verification for this country",
        ],
        suggestions: [
          "Try searching for 'mobile' or 'tollFree' number types",
          "Try removing SMS/voice capability filters",
          "Check if your Twilio account has address verification for this country",
        ],
      });
    }

    // Check if there are more pages
    // Twilio returns a nextPageUri if there are more results
    const hasMore = results.length === pageSize;

    const numbers = results.map((number: any) => {
      // Extract actual price from Twilio response
      // Twilio API returns pricing in different formats depending on the endpoint
      // Check for common price properties
      let basePrice: number | null = null;
      
      // Try to extract price from various possible properties
      if (number.basePrice !== undefined && number.basePrice !== null) {
        basePrice = typeof number.basePrice === 'string' 
          ? parseFloat(number.basePrice) 
          : typeof number.basePrice === 'number' 
          ? number.basePrice 
          : null;
      } else if (number.price !== undefined && number.price !== null) {
        basePrice = typeof number.price === 'string' 
          ? parseFloat(number.price) 
          : typeof number.price === 'number' 
          ? number.price 
          : null;
      } else if (number.monthlyPrice !== undefined && number.monthlyPrice !== null) {
        basePrice = typeof number.monthlyPrice === 'string' 
          ? parseFloat(number.monthlyPrice) 
          : typeof number.monthlyPrice === 'number' 
          ? number.monthlyPrice 
          : null;
      }
      
      // Log first number to debug pricing structure (only once)
      if (results.indexOf(number) === 0) {
        console.log(`[Twilio] Sample number pricing data:`, {
          phoneNumber: number.phoneNumber,
          basePrice: number.basePrice,
          price: number.price,
          monthlyPrice: number.monthlyPrice,
          allKeys: Object.keys(number).filter(k => k.toLowerCase().includes('price') || k.toLowerCase().includes('cost')),
          extractedBasePrice: basePrice,
        });
      }

      const currentPrice = number.currentPrice 
        ? (typeof number.currentPrice === 'string' ? parseFloat(number.currentPrice) : number.currentPrice)
        : basePrice;

      // Fallback to our lookup if Twilio doesn't provide price
      const twilioCost = basePrice || getTwilioMonthlyCost(countryCode, numberType);
      
      return {
        friendlyName: number.friendlyName || number.phoneNumber,
        phoneNumber: number.phoneNumber || "",
        region: number.region || "",
        countryCode: number.phoneNumber?.substring(0, 2) || countryCode,
        capabilities: {
          voice: number.capabilities?.voice || false,
          SMS: number.capabilities?.sms || false,
          MMS: number.capabilities?.mms || false,
        },
        monthlyRate: twilioCost.toFixed(2),
        basePrice: basePrice || twilioCost,
        currentPrice: currentPrice || twilioCost,
        numberType, // Include number type in response
      };
    });

    return {
      numbers,
      hasMore,
      totalPages: hasMore ? page + 1 : page, // Estimate - we don't know exact total
      numberType,
    };
  } catch (error: any) {
    console.error("[Twilio] Error searching available numbers:", error);
    console.error("[Twilio] Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      moreInfo: error.moreInfo,
    });
    throw new TwilioError(
      error.message || "Failed to search available numbers",
      error.status,
      error.code
    );
  }
}

/**
 * Purchase a phone number from Twilio
 */
export async function purchaseNumber(
  phoneNumberSid: string,
  webhookUrl?: string
): Promise<PurchasedNumber> {
  try {
    const incomingPhoneNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: phoneNumberSid,
    });

    // Configure webhook if provided
    if (webhookUrl) {
      await configureNumberWebhook(incomingPhoneNumber.sid, webhookUrl);
    }

    return {
      sid: incomingPhoneNumber.sid,
      phoneNumber: incomingPhoneNumber.phoneNumber || "",
      friendlyName: incomingPhoneNumber.friendlyName || incomingPhoneNumber.phoneNumber || "",
      countryCode: incomingPhoneNumber.phoneNumber?.substring(0, 2) || "",
      region: "", // Region not available on IncomingPhoneNumberInstance
      capabilities: {
        voice: incomingPhoneNumber.capabilities?.voice || false,
        SMS: incomingPhoneNumber.capabilities?.sms || false,
        MMS: incomingPhoneNumber.capabilities?.mms || false,
      },
    };
  } catch (error: any) {
    console.error("Error purchasing number:", error);
    throw new TwilioError(
      error.message || "Failed to purchase number",
      error.status,
      error.code
    );
  }
}

/**
 * Configure webhook URL for a phone number
 */
export async function configureNumberWebhook(
  phoneNumberSid: string,
  webhookUrl: string
): Promise<void> {
  try {
    await twilioClient.incomingPhoneNumbers(phoneNumberSid).update({
      smsUrl: webhookUrl,
      smsMethod: "POST",
      statusCallback: webhookUrl,
      statusCallbackMethod: "POST",
    });
  } catch (error: any) {
    console.error("Error configuring webhook:", error);
    throw new TwilioError(
      error.message || "Failed to configure webhook",
      error.status,
      error.code
    );
  }
}

/**
 * Release/cancel a phone number
 */
export async function releaseNumber(phoneNumberSid: string): Promise<void> {
  try {
    await twilioClient.incomingPhoneNumbers(phoneNumberSid).remove();
  } catch (error: any) {
    console.error("Error releasing number:", error);
    throw new TwilioError(
      error.message || "Failed to release number",
      error.status,
      error.code
    );
  }
}

/**
 * Get details of a phone number
 */
export async function getNumberDetails(phoneNumberSid: string): Promise<PurchasedNumber> {
  try {
    const incomingPhoneNumber = await twilioClient
      .incomingPhoneNumbers(phoneNumberSid)
      .fetch();

    return {
      sid: incomingPhoneNumber.sid,
      phoneNumber: incomingPhoneNumber.phoneNumber || "",
      friendlyName: incomingPhoneNumber.friendlyName || incomingPhoneNumber.phoneNumber || "",
      countryCode: incomingPhoneNumber.phoneNumber?.substring(0, 2) || "",
      region: "", // Region not available on IncomingPhoneNumberInstance
      capabilities: {
        voice: incomingPhoneNumber.capabilities?.voice || false,
        SMS: incomingPhoneNumber.capabilities?.sms || false,
        MMS: incomingPhoneNumber.capabilities?.mms || false,
      },
    };
  } catch (error: any) {
    console.error("Error fetching number details:", error);
    throw new TwilioError(
      error.message || "Failed to fetch number details",
      error.status,
      error.code
    );
  }
}








