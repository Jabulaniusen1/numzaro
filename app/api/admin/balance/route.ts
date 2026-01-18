import { NextResponse } from "next/server";
import { getBalance } from "@/lib/api/socialboost";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get exobooster API balance (admin's account)
    const balanceData = await getBalance();
    const balanceAmount = parseFloat(balanceData.balance || "0");
    const currency = balanceData.currency || "NGN"; // Default to NGN if not specified

    // Convert NGN to USD if needed
    let balanceUSD = balanceAmount;
    if (currency === "NGN" || currency === "NGN") {
      try {
        // Fetch exchange rate from NGN to USD
        const exchangeRateResponse = await fetch(
          `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/pair/NGN/USD`
        );
        if (exchangeRateResponse.ok) {
          const rateData = await exchangeRateResponse.json();
          if (rateData.result === "success" && rateData.conversion_rate) {
            // Convert from NGN to USD
            // conversion_rate tells us how many USD per 1 NGN
            // So we multiply: NGN amount * (USD per NGN) = USD amount
            balanceUSD = balanceAmount * rateData.conversion_rate;
          }
        }
      } catch (error) {
        console.error("Error converting currency:", error);
        // If conversion fails, return the original balance with currency info
      }
    }

    return NextResponse.json({ 
      balance: balanceUSD.toFixed(2),
      originalBalance: balanceAmount.toFixed(2),
      originalCurrency: currency,
      currency: "USD"
    });
  } catch (error) {
    console.error("Error fetching admin balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance", balance: "0.00" },
      { status: 500 }
    );
  }
}


