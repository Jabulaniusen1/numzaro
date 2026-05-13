const DEFAULT_USD_NGN_RATE = 1500;

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeCurrency(currency: string): string {
  return currency.trim().toUpperCase();
}

function getFallbackRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return 1;
  if (fromCurrency === "USD" && toCurrency === "NGN") return DEFAULT_USD_NGN_RATE;
  if (fromCurrency === "NGN" && toCurrency === "USD") return 1 / DEFAULT_USD_NGN_RATE;
  return 1;
}

async function getExchangeRateApiRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const payload = await response.json().catch(() => null);
    if (payload?.result === "success") {
      const rate = toNumber(payload.conversion_rate);
      if (rate && rate > 0) return rate;
    }
  } catch {
    // Fall back to static rates below
  }

  return null;
}

export async function getLiveFxRate(from: string, to: string): Promise<number> {
  const fromCurrency = normalizeCurrency(from);
  const toCurrency = normalizeCurrency(to);

  if (fromCurrency === toCurrency) return 1;

  const exchangeRateApiRate = await getExchangeRateApiRate(fromCurrency, toCurrency);
  if (exchangeRateApiRate && exchangeRateApiRate > 0) return exchangeRateApiRate;

  return getFallbackRate(fromCurrency, toCurrency);
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const rate = await getLiveFxRate(from, to);
  return amount * rate;
}
