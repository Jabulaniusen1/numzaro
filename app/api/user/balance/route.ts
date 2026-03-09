import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's wallet balance from users table (stored in USD)
    const { data: userData, error } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user balance:", error);
      return NextResponse.json({ 
        balance: "0.00",
        error: "Failed to fetch balance"
      });
    }

    let balanceNGN = parseFloat(userData?.wallet_balance || "0");
    
    // Convert from USD to NGN for display
    if (balanceNGN > 0) {
      try {
        // Fetch exchange rate from USD to NGN
        const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
        if (API_KEY) {
          const exchangeRateResponse = await fetch(
            `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/USD/NGN`,
            {
              cache: 'no-store',
            }
          );
          if (exchangeRateResponse.ok) {
            const rateData = await exchangeRateResponse.json();
            if (rateData.result === "success" && rateData.conversion_rate) {
              // Convert from USD to NGN
              balanceNGN = balanceNGN * rateData.conversion_rate;
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
        balanceNGN = balanceNGN * 1500;
      }
    }

    return NextResponse.json({ 
      balance: balanceNGN.toString(),
      currency: "NGN"
    });
  } catch (error) {
    console.error("Error fetching user balance:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      balance: "0.00",
      error: errorMessage
    });
  }
}
