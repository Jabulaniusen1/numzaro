
import { quackrClient } from "@/lib/quackr/client";

export interface TelecomProvider {
  releaseNumber(numberId: string): Promise<void>;
  checkStatus?(numberId: string): Promise<{ status: string; sms?: string; code?: string }>;
}

class QuackrProvider implements TelecomProvider {
  async releaseNumber(numberId: string): Promise<void> {
    await quackrClient.cancelNumber(numberId);
  }

  async checkStatus(numberId: string): Promise<{ status: string; sms?: string; code?: string }> {
    const messages = await quackrClient.getMessages(numberId);
    const latest = messages[0];
    return {
      status: latest ? "received" : "pending",
      sms: latest?.content ?? undefined,
      code: latest?.code ?? undefined,
    };
  }
}

export function getTelecomProvider(_provider: string = "quackr"): TelecomProvider {
  return new QuackrProvider();
}

export function getProviderForNumber(_numberRecord: any): TelecomProvider {
  return new QuackrProvider();
}
