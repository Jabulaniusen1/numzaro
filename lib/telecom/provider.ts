/**
 * Provider-agnostic interface for telecom operations
 * All telecom providers (Telnyx, Twilio, etc.) must implement this interface
 */

export type NumberCapability = "sms" | "voice" | "sms+voice";
export type NumberType = "long_term" | "otp" | "business";

export interface AvailableNumber {
  phoneNumber: string;
  regionInformation: {
    regionName: string;
    countryCode: string;
  };
  capabilities: NumberCapability[];
  cost: {
    setupCost: number; // One-time setup/purchase cost
    monthlyCost: number; // Monthly recurring cost (null for OTP numbers)
  };
  providerId: string; // Provider's internal ID for this number
}

export interface PurchasedNumber {
  id: string; // Provider's ID for the purchased number
  phoneNumber: string;
  country: string;
  capabilities: NumberCapability[];
  providerId: string;
}

export interface SMSMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: Date;
}

export interface CallLog {
  id: string;
  direction: "inbound" | "outbound";
  from?: string;
  to?: string;
  duration?: number; // in seconds
  status: string;
  recordingUrl?: string;
  timestamp: Date;
}

export interface TelecomProvider {
  /**
   * Search for available phone numbers
   * @param country - Country code (e.g., "US", "GB")
   * @param capabilities - Required capabilities (sms, voice, or sms+voice)
   * @param limit - Maximum number of results to return
   */
  searchNumbers(
    country: string,
    capabilities: NumberCapability,
    limit?: number
  ): Promise<AvailableNumber[]>;

  /**
   * Purchase a phone number from the provider
   * @param phoneNumberId - Provider's ID for the number to purchase
   * @returns Purchased number details
   */
  purchaseNumber(phoneNumberId: string): Promise<PurchasedNumber>;

  /**
   * Release a phone number back to the provider
   * @param phoneNumberId - Provider's ID for the number to release
   */
  releaseNumber(phoneNumberId: string): Promise<void>;

  /**
   * Configure SMS webhook for a number
   * @param phoneNumberId - Provider's ID for the number
   * @param webhookUrl - URL to receive SMS webhooks
   */
  configureSMSWebhook(
    phoneNumberId: string,
    webhookUrl: string
  ): Promise<void>;

  /**
   * Configure call/webhook for a number
   * @param phoneNumberId - Provider's ID for the number
   * @param webhookUrl - URL to receive call event webhooks
   */
  configureCallWebhook(
    phoneNumberId: string,
    webhookUrl: string
  ): Promise<void>;

  /**
   * Send an SMS message
   * @param phoneNumberId - Provider's ID for the number to send from
   * @param to - Destination phone number
   * @param message - Message text
   */
  sendSMS(
    phoneNumberId: string,
    to: string,
    message: string
  ): Promise<string>; // Returns message ID

  /**
   * Configure call forwarding for a number
   * @param phoneNumberId - Provider's ID for the number
   * @param forwardingNumber - Number to forward calls to
   */
  configureCallForwarding(
    phoneNumberId: string,
    forwardingNumber: string
  ): Promise<void>;

  /**
   * Verify webhook signature (provider-specific)
   * @param payload - Raw webhook payload
   * @param signature - Signature header value
   * @param secret - Webhook secret
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean;

  /**
   * Parse SMS webhook payload
   * @param payload - Raw webhook payload
   * @returns Parsed SMS message data
   */
  parseSMSWebhook(payload: any): {
    from: string;
    to: string;
    message: string;
    messageId: string;
    timestamp: Date;
  };

  /**
   * Parse call webhook payload
   * @param payload - Raw webhook payload
   * @returns Parsed call event data
   */
  parseCallWebhook(payload: any): {
    callId: string;
    direction: "inbound" | "outbound";
    from?: string;
    to?: string;
    status: string;
    duration?: number;
    recordingUrl?: string;
    timestamp: Date;
  };
}

