import { NextRequest, NextResponse } from "next/server";
import { getLiveFxRate } from "@/lib/currency/rates";

// Cache exchange rates in memory for a short period to keep UI responsive.
interface RateCache {
  [key: string]: {
    rate: number;
    timestamp: number;
  };
}

const rateCache: RateCache = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fromCurrency = searchParams.get("from")?.toUpperCase() || "USD";
  const toCurrency = searchParams.get("to")?.toUpperCase() || "USD";

  try {
    if (fromCurrency === toCurrency) {
      return NextResponse.json({
        from: fromCurrency,
        to: toCurrency,
        rate: 1,
      });
    }

    const cacheKey = `${fromCurrency}:${toCurrency}`;
    const cached = rateCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        from: fromCurrency,
        to: toCurrency,
        rate: cached.rate,
      });
    }

    const rate = await getLiveFxRate(fromCurrency, toCurrency);

    rateCache[cacheKey] = {
      rate,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      from: fromCurrency,
      to: toCurrency,
      rate,
    });
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    const fallbackRate =
      fromCurrency === toCurrency ? 1 : fromCurrency === "USD" && toCurrency === "NGN" ? 1500 : 1;
    return NextResponse.json({
      from: fromCurrency,
      to: toCurrency,
      rate: fallbackRate,
    });
  }
}
