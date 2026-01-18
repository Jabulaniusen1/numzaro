import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication error", balance: "0.00" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user wallet balance (stored in USD)
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching wallet balance:", userError);
      // Return 0 balance instead of error to prevent UI issues
      return NextResponse.json({ balance: "0.00" });
    }

    const balanceUSD = parseFloat(userProfile?.wallet_balance || "0.00");

    // Convert USD to NGN for display
    let balanceNGN = balanceUSD;
    try {
      // Fetch exchange rate from USD to NGN
      const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
      if (API_KEY) {
        const exchangeRateResponse = await fetch(
          `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/USD/NGN`,
          {
            cache: 'no-store', // Don't cache in API routes
          }
        );
        if (exchangeRateResponse.ok) {
          const rateData = await exchangeRateResponse.json();
          if (rateData.result === "success" && rateData.conversion_rate) {
            // Convert from USD to NGN
            // conversion_rate tells us how many NGN per 1 USD
            balanceNGN = balanceUSD * rateData.conversion_rate;
          }
        } else {
          console.warn("Exchange rate API returned non-OK status:", exchangeRateResponse.status);
        }
      } else {
        console.warn("EXCHANGE_RATE_API_KEY not set, using fallback rate");
      }
    } catch (error) {
      console.error("Error converting USD to NGN:", error);
      // If conversion fails, use a fallback rate (approximately 1500 NGN per USD)
      // This ensures the balance still displays even if the API is down
      balanceNGN = balanceUSD * 1500;
    }

    return NextResponse.json({ balance: balanceNGN.toString() });
  } catch (error) {
    console.error("Error fetching balance:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    // Return 0 balance instead of error to prevent UI issues
    return NextResponse.json({ balance: "0.00" });
  }
}

