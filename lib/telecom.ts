export interface TelecomProvider {
  releaseNumber(numberId: string): Promise<void>;
  checkStatus?(numberId: string): Promise<{ status: string; sms?: string; code?: string }>;
}

class NoOpProvider implements TelecomProvider {
  async releaseNumber(_numberId: string): Promise<void> {}
}

export function getTelecomProvider(_provider?: string): TelecomProvider {
  return new NoOpProvider();
}

export function getProviderForNumber(_numberRecord: any): TelecomProvider {
  return new NoOpProvider();
}
