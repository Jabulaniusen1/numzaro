
import { quackrClient } from "@/lib/quackr/client";

export interface TelecomProvider {
  releaseNumber(numberId: string): Promise<void>;
  checkStatus?(numberId: string): Promise<{ status: string; sms?: string; code?: string }>;
}

/** Extract OTP/code from an SMS message string */
function extractCode(message: string): string | null {
  const match = message.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

class QuackrProvider implements TelecomProvider {
  async releaseNumber(numberId: string): Promise<void> {
    await quackrClient.cancelNumber(numberId);
  }

  async checkStatus(numberId: string): Promise<{ status: string; sms?: string; code?: string }> {
    const result = await quackrClient.getMessages(numberId);
    const messages = result?.data?.messages ?? [];
    const latest = messages[0];
    const code = latest ? extractCode(latest.message) : null;
    return {
      status: latest ? "received" : "pending",
      sms: latest?.message ?? undefined,
      code: code ?? undefined,
    };
  }
}

export function getTelecomProvider(_provider: string = "quackr"): TelecomProvider {
  return new QuackrProvider();
}

export function getProviderForNumber(_numberRecord: any): TelecomProvider {
  return new QuackrProvider();
}
