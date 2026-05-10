import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Wallet balance is stored in NGN.
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

    const balanceNGN = parseFloat(userData?.wallet_balance || "0");

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
