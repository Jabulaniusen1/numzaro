import { twilioClient, TwilioError } from "./client";

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

/**
 * Search for available phone numbers in Twilio inventory
 */
export async function searchAvailableNumbers(
  countryCode: string,
  capabilities: string[] = ["SMS"],
  page: number = 1,
  pageSize: number = 50
): Promise<{ numbers: AvailableNumber[]; hasMore: boolean; totalPages: number }> {
  try {
    console.log(`[Twilio] Searching for numbers in country: ${countryCode}, capabilities:`, capabilities, `page: ${page}, pageSize: ${pageSize}`);
    
    const searchParams: any = {
      pageSize: pageSize,
      page: page,
    };
    
    if (capabilities.includes("SMS")) {
      searchParams.smsEnabled = true;
    }
    if (capabilities.includes("voice")) {
      searchParams.voiceEnabled = true;
    }
    
    console.log(`[Twilio] Search parameters:`, searchParams);
    
    const results = await twilioClient.availablePhoneNumbers(countryCode).local.list(searchParams);
    
    console.log(`[Twilio] Found ${results.length} numbers`);

    if (results.length === 0) {
      console.warn(`[Twilio] No numbers found for country ${countryCode}. This might be normal if Twilio has no inventory for this country.`);
    }

    // Check if there are more pages
    // Twilio returns a nextPageUri if there are more results
    const hasMore = results.length === pageSize;

    const numbers = results.map((number) => ({
      friendlyName: number.friendlyName || number.phoneNumber,
      phoneNumber: number.phoneNumber || "",
      region: number.region || "",
      countryCode: number.phoneNumber?.substring(0, 2) || countryCode,
      capabilities: {
        voice: number.capabilities?.voice || false,
        SMS: number.capabilities?.sms || false,
        MMS: number.capabilities?.mms || false,
      },
      monthlyRate: number.capabilities?.sms ? "1.00" : "1.00", // Default rate
    }));

    return {
      numbers,
      hasMore,
      totalPages: hasMore ? page + 1 : page, // Estimate - we don't know exact total
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








