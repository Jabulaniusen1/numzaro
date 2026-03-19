import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { convertCurrency } from "@/lib/currency/rates";

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
        balanceNGN = await convertCurrency(balanceNGN, "USD", "NGN");
      } catch (error) {
        console.error("Error converting USD to NGN:", error);
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
