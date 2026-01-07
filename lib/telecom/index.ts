/**
 * Telecom provider factory
 * Selects and initializes the appropriate telecom provider based on environment configuration
 */

import type { TelecomProvider } from "./provider";
import { TelnyxProvider } from "./telnyx";
import { TwilioProvider } from "./twilio";

let cachedProvider: TelecomProvider | null = null;

/**
 * Get the configured telecom provider instance
 * Uses singleton pattern to cache the provider instance
 */
export function getTelecomProvider(): TelecomProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerName =
    process.env.TELECOM_PROVIDER?.toLowerCase() || "twilio";

  switch (providerName) {
    case "telnyx": {
      const apiKey = process.env.TELNYX_API_KEY;
      if (!apiKey) {
        throw new Error(
          "TELNYX_API_KEY environment variable is not configured"
        );
      }
      cachedProvider = new TelnyxProvider(apiKey);
      break;
    }
    case "twilio": {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken) {
        throw new Error(
          "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required. Please set TELECOM_PROVIDER=twilio and provide your Twilio credentials."
        );
      }
      try {
        cachedProvider = new TwilioProvider(accountSid, authToken);
      } catch (error: any) {
        throw new Error(
          `Failed to initialize Twilio provider: ${error.message || "Unknown error"}`
        );
      }
      break;
    }
    default:
      throw new Error(
        `Unsupported telecom provider: ${providerName}. Supported providers: telnyx, twilio`
      );
  }

  return cachedProvider;
}

/**
 * Reset the cached provider (useful for testing)
 */
export function resetProvider(): void {
  cachedProvider = null;
}

export type { TelecomProvider, AvailableNumber, PurchasedNumber } from "./provider";
export { TelnyxProvider, TelnyxError } from "./telnyx";
export { TwilioProvider, TwilioError } from "./twilio";

