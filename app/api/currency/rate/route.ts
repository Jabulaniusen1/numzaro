import { NextRequest, NextResponse } from "next/server";

// Cache exchange rates in memory (update every hour)
interface RateCache {
  [key: string]: {
    rate: number;
    timestamp: number;
  };
}

const rateCache: RateCache = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const toCurrency = searchParams.get("to")?.toUpperCase() || "USD";

    // If requesting USD, return 1:1
    if (toCurrency === "USD") {
      return NextResponse.json({
        from: "USD",
        to: "USD",
        rate: 1,
      });
    }

    // Check cache
    const cached = rateCache[toCurrency];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        from: "USD",
        to: toCurrency,
        rate: cached.rate,
      });
    }

    // Use exchangerate-api.com with API key for better reliability
    // API key should be set in .env.local as EXCHANGE_RATE_API_KEY
    const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
    
    if (!API_KEY) {
      console.error("EXCHANGE_RATE_API_KEY not set in environment variables");
      throw new Error("Exchange rate API key not configured");
    }
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = await response.json();

    if (data.result === "success" && data.conversion_rates && data.conversion_rates[toCurrency]) {
      const rate = data.conversion_rates[toCurrency];

      // Cache the rate
      rateCache[toCurrency] = {
        rate,
        timestamp: Date.now(),
      };

      return NextResponse.json({
        from: "USD",
        to: toCurrency,
        rate: rate,
      });
    }

    // Fallback to 1:1 if currency not found
    console.warn(`Currency ${toCurrency} not found, using 1:1 rate`);
    rateCache[toCurrency] = {
      rate: 1,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      from: "USD",
      to: toCurrency,
      rate: 1,
    });
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Fallback to 1:1
    return NextResponse.json({
      from: "USD",
      to: "USD",
      rate: 1,
    });
  }
}

