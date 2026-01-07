/**
 * Twilio provider implementation
 * Implements the TelecomProvider interface for Twilio API
 */

import crypto from "crypto";
import type {
  TelecomProvider,
  AvailableNumber,
  PurchasedNumber,
  NumberCapability,
} from "./provider";

// Dynamic import for Twilio to handle missing package gracefully
let twilio: any;
try {
  twilio = require("twilio");
} catch (error) {
  // Twilio SDK not installed
  twilio = null;
}

class TwilioError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "TwilioError";
  }
}

export class TwilioProvider implements TelecomProvider {
  private client: twilio.Twilio;
  private accountSid: string;
  private authToken: string;

  constructor(accountSid: string, authToken: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    
    // Check if twilio module is available
    if (!twilio || typeof twilio !== "function") {
      throw new Error(
        "Twilio SDK is not installed. Please run: npm install twilio"
      );
    }
    
    try {
      this.client = twilio(accountSid, authToken);
    } catch (error: any) {
      throw new Error(
        `Failed to create Twilio client: ${error.message || "Unknown error"}`
      );
    }
  }

  async searchNumbers(
    country: string,
    capabilities: NumberCapability,
    limit: number = 10
  ): Promise<AvailableNumber[]> {
    try {
      // Note: Twilio doesn't use separate types for SMS vs Voice in search
      // All Twilio numbers can typically handle both SMS and Voice
      // We'll search for local numbers which support both

      // Search available numbers
      // Try local numbers first, fallback to mobile if needed
      let availableNumbers: any[] = [];
      try {
        const localNumbers = await this.client.availablePhoneNumbers(
          country
        ).local.list({
          limit: Math.min(limit, 50), // Twilio default max is 50
        });
        availableNumbers = Array.isArray(localNumbers) ? localNumbers : [];
      } catch (error: any) {
        // If local numbers aren't available, try mobile
        if (error.code === 20003 || error.status === 400 || error.message?.includes("not available")) {
          try {
            const mobileNumbers = await this.client.availablePhoneNumbers(
              country
            ).mobile.list({
              limit: Math.min(limit, 50),
            });
            availableNumbers = Array.isArray(mobileNumbers) ? mobileNumbers : [];
          } catch (mobileError: any) {
            // If mobile also fails, return empty array with a helpful message
            console.warn(`No ${country} numbers available:`, mobileError.message);
            return [];
          }
        } else {
          throw error;
        }
      }

      const numbers: AvailableNumber[] = [];

      for (const number of availableNumbers.slice(0, limit)) {
        // Determine capabilities based on number type
        let numberCapabilities: NumberCapability = "sms+voice";
        if (capabilities === "sms") {
          numberCapabilities = "sms";
        } else if (capabilities === "voice") {
          numberCapabilities = "voice";
        }

        // Get pricing information
        let setupCost = 1.0; // Default, will need to fetch actual pricing
        let monthlyCost = 1.0; // Default monthly cost

        try {
          // Fetch pricing for this country
          // Twilio pricing API may vary - using defaults for now
          // In production, you'd fetch actual pricing from Twilio's pricing API
          setupCost = 1.0; // One-time setup fee
          monthlyCost = 1.0; // Monthly recurring cost
        } catch (pricingError) {
          console.warn("Could not fetch pricing, using defaults:", pricingError);
        }

        const phoneNumber = number.phoneNumber || number.friendlyName || "";
        if (!phoneNumber) {
          console.warn("Skipping number with no phoneNumber:", number);
          continue;
        }

        numbers.push({
          phoneNumber,
          regionInformation: {
            regionName: number.locality || number.region || country,
            countryCode: country,
          },
          capabilities: [numberCapabilities],
          cost: {
            setupCost,
            monthlyCost,
          },
          providerId: phoneNumber,
        });
      }

      return numbers;
    } catch (error: any) {
      if (error.code) {
        throw new TwilioError(
          error.message || "Twilio API error",
          error.status,
          error
        );
      }
      throw new TwilioError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async purchaseNumber(phoneNumberId: string): Promise<PurchasedNumber> {
    try {
      // In Twilio, phoneNumberId is the phone number itself
      const incomingPhoneNumber = await this.client.incomingPhoneNumbers.create(
        {
          phoneNumber: phoneNumberId,
        }
      );

      return {
        id: incomingPhoneNumber.sid,
        phoneNumber: incomingPhoneNumber.phoneNumber || phoneNumberId,
        country: incomingPhoneNumber.isoCountry || "",
        capabilities: this.mapTwilioCapabilities(
          incomingPhoneNumber.capabilities || {}
        ),
        providerId: incomingPhoneNumber.sid,
      };
    } catch (error: any) {
      if (error.code) {
        throw new TwilioError(
          error.message || "Failed to purchase number",
          error.status,
          error
        );
      }
      throw new TwilioError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async releaseNumber(phoneNumberId: string): Promise<void> {
    try {
      // phoneNumberId is the SID for Twilio
      await this.client.incomingPhoneNumbers(phoneNumberId).remove();
    } catch (error: any) {
      if (error.code) {
        throw new TwilioError(
          error.message || "Failed to release number",
          error.status,
          error
        );
      }
      throw new TwilioError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async configureSMSWebhook(
    phoneNumberId: string,
    webhookUrl: string
  ): Promise<void> {
    try {
      await this.client.incomingPhoneNumbers(phoneNumberId).update({
        smsUrl: webhookUrl,
        smsMethod: "POST",
      });
    } catch (error: any) {
      if (error.code) {
        throw new TwilioError(
          error.message || "Failed to configure SMS webhook",
          error.status,
          error
        );
      }
      throw new TwilioError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async configureCallWebhook(
    phoneNumberId: string,
    webhookUrl: string
  ): Promise<void> {
    try {
      await this.client.incomingPhoneNumbers(phoneNumberId).update({
        voiceUrl: webhookUrl,
        voiceMethod: "POST",
        statusCallback: webhookUrl,
        statusCallbackMethod: "POST",
      });
    } catch (error: any) {
      if (error.code) {
        throw new TwilioError(
          error.message || "Failed to configure call webhook",
          error.status,
          error
        );
      }
      throw new TwilioError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async sendSMS(
    phoneNumberId: string,
    to: string,
    message: string
  ): Promise<string> {
    try {
      const smsMessage = await this.client.messages.create({
        from: phoneNumberId, // From phone number
        to: to,
        body: message,
      });

      return smsMessage.sid;
    } catch (error: any) {
      if (error.code) {
        throw new TwilioError(
          error.message || "Failed to send SMS",
          error.status,
          error
        );
      }
      throw new TwilioError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async configureCallForwarding(
    phoneNumberId: string,
    forwardingNumber: string
  ): Promise<void> {
    try {
      // Twilio call forwarding is configured via TwiML
      // We'll create a TwiML that forwards calls to the specified number
      const twimlUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/forward-twiml?to=${encodeURIComponent(forwardingNumber)}`;
      
      await this.client.incomingPhoneNumbers(phoneNumberId).update({
        voiceUrl: twimlUrl,
        voiceMethod: "GET",
      });
    } catch (error: any) {
      if (error.code) {
        throw new TwilioError(
          error.message || "Failed to configure call forwarding",
          error.status,
          error
        );
      }
      throw new TwilioError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // Twilio uses HMAC-SHA1 for webhook signatures
      const hmac = crypto.createHmac("sha1", secret);
      
      // For GET requests, use the full URL
      // For POST requests, use the URL + sorted POST parameters
      // This is a simplified version - in production, use the full URL
      hmac.update(payload);
      
      const calculatedSignature = hmac.digest("base64");
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  parseSMSWebhook(payload: any): {
    from: string;
    to: string;
    message: string;
    messageId: string;
    timestamp: Date;
  } {
    // Twilio webhooks come as form data
    return {
      from: payload.From || payload.from || "",
      to: payload.To || payload.to || "",
      message: payload.Body || payload.Body || payload.message || "",
      messageId: payload.MessageSid || payload.SmsSid || payload.messageId || "",
      timestamp: payload.dateCreated
        ? new Date(payload.dateCreated)
        : new Date(payload.timestamp || Date.now()),
    };
  }

  parseCallWebhook(payload: any): {
    callId: string;
    direction: "inbound" | "outbound";
    from?: string;
    to?: string;
    status: string;
    duration?: number;
    recordingUrl?: string;
    timestamp: Date;
  } {
    // Twilio call webhooks come as form data
    const direction =
      payload.Direction?.toLowerCase() === "inbound" ||
      payload.CallStatus?.toLowerCase() === "ringing"
        ? "inbound"
        : "outbound";

    return {
      callId: payload.CallSid || payload.callId || "",
      direction,
      from: payload.From || payload.from,
      to: payload.To || payload.to,
      status: payload.CallStatus || payload.status || "unknown",
      duration: payload.Duration ? parseInt(payload.Duration) : undefined,
      recordingUrl: payload.RecordingUrl || payload.recordingUrl,
      timestamp: payload.Timestamp
        ? new Date(payload.Timestamp)
        : new Date(payload.timestamp || Date.now()),
    };
  }

  private mapTwilioCapabilities(capabilities: {
    voice?: boolean;
    SMS?: boolean;
    MMS?: boolean;
  }): NumberCapability {
    const hasVoice = capabilities.voice || false;
    const hasSMS = capabilities.SMS || capabilities.MMS || false;

    if (hasSMS && hasVoice) return "sms+voice";
    if (hasSMS) return "sms";
    if (hasVoice) return "voice";
    return "sms+voice"; // Default
  }
}

export { TwilioError };

