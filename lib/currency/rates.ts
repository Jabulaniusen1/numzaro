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

function getKoraBaseUrl() {
  return (process.env.KORAPAY_BASE_URL || "https://api.korapay.com").replace(/\/+$/, "");
}

async function getKorapayRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
  const apiKey = process.env.KORAPAY_API_KEY;
  if (!apiKey) return null;

  const body = {
    amount: 1,
    from_currency: fromCurrency,
    to_currency: toCurrency,
    reference: `fx_${fromCurrency}_${toCurrency}_${Date.now()}`,
  };

  try {
    const response = await fetch(`${getKoraBaseUrl()}/merchant/api/v1/conversions/rates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    const data = payload?.data ?? {};

    const directRate =
      toNumber(data.exchange_rate) ??
      toNumber(data.rate) ??
      toNumber(data.conversion_rate);

    if (directRate && directRate > 0) {
      return directRate;
    }

    const fromAmount = toNumber(data.from_amount) ?? toNumber(data.amount);
    const toAmount = toNumber(data.to_amount) ?? toNumber(data.converted_amount);

    if (fromAmount && fromAmount > 0 && toAmount && toAmount > 0) {
      return toAmount / fromAmount;
    }
  } catch {
    // Fall through to other providers
  }

  return null;
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

  const korapayRate = await getKorapayRate(fromCurrency, toCurrency);
  if (korapayRate && korapayRate > 0) return korapayRate;

  const exchangeRateApiRate = await getExchangeRateApiRate(fromCurrency, toCurrency);
  if (exchangeRateApiRate && exchangeRateApiRate > 0) return exchangeRateApiRate;

  return getFallbackRate(fromCurrency, toCurrency);
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const rate = await getLiveFxRate(from, to);
  return amount * rate;
}
