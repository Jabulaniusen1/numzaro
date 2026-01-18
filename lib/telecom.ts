import { releaseNumber as twilioReleaseNumber } from "@/lib/twilio/numbers";

/**
 * Telecom provider interface
 */
export interface TelecomProvider {
  releaseNumber(phoneNumberSid: string): Promise<void>;
}

/**
 * Twilio implementation of TelecomProvider
 */
class TwilioProvider implements TelecomProvider {
  async releaseNumber(phoneNumberSid: string): Promise<void> {
    return twilioReleaseNumber(phoneNumberSid);
  }
}

/**
 * Get the telecom provider instance
 * Currently returns Twilio provider, but can be extended to support other providers
 */
export function getTelecomProvider(): TelecomProvider {
  return new TwilioProvider();
}

