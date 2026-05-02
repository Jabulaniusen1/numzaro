import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;
    // Korapay wallet-funding popup is configured for NGN in this app.
    // Keep the charge currency fixed to prevent unsupported-currency failures.
    const currency = "NGN";

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("email, full_name, username")
      .eq("id", user.id)
      .maybeSingle();

    const email = userProfile?.email || user.email;
    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const name =
      userProfile?.full_name ||
      userProfile?.username ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split("@")[0];

    // For the inline/popup SDK flow, we only generate a reference here.
    // The Korapay SDK initializes the charge itself — pre-registering it
    // via initializeCharge would cause a "duplicate payment reference" error.
    const reference = `NMZ-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

    return NextResponse.json({ reference, email, name, amount, currency });
  } catch (error) {
    console.error("Wallet funding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
