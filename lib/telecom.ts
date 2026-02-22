import { releaseNumber as fiveSimReleaseNumber } from "@/lib/5sim/adapter";

/**
 * Telecom provider interface
 */
export interface TelecomProvider {
  releaseNumber(phoneNumberSid: string): Promise<void>;
  cancelOrder?(phoneNumberSid: string): Promise<void>; // Optional for providers that support cancellation
  checkStatus?(phoneNumberSid: string): Promise<{ status: string; sms?: string }>; // Optional for status checking
}

/**
 * 5sim.net implementation of TelecomProvider
 */
class FiveSimProvider implements TelecomProvider {
  async releaseNumber(phoneNumberSid: string): Promise<void> {
    return fiveSimReleaseNumber(phoneNumberSid);
  }

  async cancelOrder(phoneNumberSid: string): Promise<void> {
    const { cancelOrder } = await import("@/lib/5sim/adapter");
    return cancelOrder(phoneNumberSid);
  }

  async checkStatus(phoneNumberSid: string): Promise<{ status: string; sms?: string }> {
    const { checkOrderStatus } = await import("@/lib/5sim/adapter");
    return checkOrderStatus(phoneNumberSid);
  }
}

/**
 * Get the telecom provider instance based on provider type
 */
export function getTelecomProvider(provider: string = "5sim"): TelecomProvider {
  switch (provider.toLowerCase()) {
    case "5sim":
    case "5sim.net":
      return new FiveSimProvider();
    default:
      return new FiveSimProvider();
  }
}

/**
 * Get provider from database record
 */
export function getProviderForNumber(numberRecord: any): TelecomProvider {
  const provider = numberRecord.provider || "5sim";
  return getTelecomProvider(provider);
}

