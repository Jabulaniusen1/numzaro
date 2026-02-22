import { NextResponse } from "next/server";
import { fiveSimClient } from "@/lib/5sim/client";
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

    // Get 5Sim API balance
    const fiveSimBalance = await fiveSimClient.getBalance();

    // Convert RUB to NGN for display
    let balanceNGN = fiveSimBalance;
    try {
      // Fetch exchange rate from RUB to NGN
      const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
      if (API_KEY) {
        const exchangeRateResponse = await fetch(
          `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/RUB/NGN`
        );
        if (exchangeRateResponse.ok) {
          const rateData = await exchangeRateResponse.json();
          if (rateData.result === "success" && rateData.conversion_rate) {
            balanceNGN = fiveSimBalance * rateData.conversion_rate;
          }
        }
      }
    } catch (error) {
      console.error("Error converting RUB to NGN:", error);
      // Use fallback rate
      balanceNGN = fiveSimBalance * 60;
    }

    return NextResponse.json({
      balance: balanceNGN.toString(),
      currency: "NGN",
      fiveSimBalance: fiveSimBalance,
      fiveSimCurrency: "RUB",
    });
  } catch (error) {
    console.error("Error fetching admin balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
