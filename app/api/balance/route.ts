import { NextResponse } from "next/server";
import { fiveSimClient } from "@/lib/5sim/client";

export async function GET() {
  try {
    // Get balance from 5Sim API
    const fiveSimBalance = await fiveSimClient.getBalance();
    
    // 5Sim uses RUB, convert to NGN for display
    let balanceNGN = fiveSimBalance;
    try {
      // Fetch exchange rate from RUB to NGN
      const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
      if (API_KEY) {
        const exchangeRateResponse = await fetch(
          `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/RUB/NGN`,
          {
            cache: 'no-store', // Don't cache in API routes
          }
        );
        if (exchangeRateResponse.ok) {
          const rateData = await exchangeRateResponse.json();
          if (rateData.result === "success" && rateData.conversion_rate) {
            // Convert from RUB to NGN
            // conversion_rate tells us how many NGN per 1 RUB
            balanceNGN = fiveSimBalance * rateData.conversion_rate;
          }
        } else {
          console.warn("Exchange rate API returned non-OK status:", exchangeRateResponse.status);
        }
      } else {
        console.warn("EXCHANGE_RATE_API_KEY not set, using direct 5Sim balance");
      }
    } catch (error) {
      console.error("Error converting RUB to NGN:", error);
      // If conversion fails, use a fallback rate (approximately 60 NGN per RUB)
      // This ensures the balance still displays even if the API is down
      balanceNGN = fiveSimBalance * 60;
    }

    return NextResponse.json({ 
      balance: balanceNGN.toString(),
      currency: "NGN",
      fiveSimBalance: fiveSimBalance,
      fiveSimCurrency: "RUB"
    });
  } catch (error) {
    console.error("Error fetching 5Sim balance:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    // Return 0 balance instead of error to prevent UI issues
    return NextResponse.json({ 
      balance: "0.00",
      error: errorMessage
    });
  }
}

