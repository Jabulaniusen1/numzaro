import { NextResponse } from "next/server";
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

    // Get user wallet balance
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching wallet balance:", userError);
      return NextResponse.json(
        { error: "Failed to fetch balance", balance: "0.00" },
        { status: 500 }
      );
    }

    const balance = userProfile?.wallet_balance || "0.00";

    return NextResponse.json({ balance: balance.toString() });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance", balance: "0.00" },
      { status: 500 }
    );
  }
}

