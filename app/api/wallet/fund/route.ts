import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { initializeTransaction, PaystackError } from "@/lib/paystack/client";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body?.amount);
    const currency = "NGN";

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const amountInSubunit = Math.round(amount * 100);
    if (!amountInSubunit || amountInSubunit <= 0) {
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

    const reference = `NMZ-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not configured" }, { status: 500 });
    }

    const callbackUrl = `${appUrl}/api/payments/verify?type=wallet`;

    const initialized = await initializeTransaction({
      email,
      amount: amountInSubunit,
      currency,
      reference,
      callback_url: callbackUrl,
      metadata: {
        type: "wallet_funding",
        user_id: user.id,
        source: "wallet_topup",
      },
    });

    return NextResponse.json({
      reference: initialized.data.reference,
      email,
      name,
      amount,
      currency,
      userId: user.id,
      access_code: initialized.data.access_code,
      authorization_url: initialized.data.authorization_url,
      checkout_url: initialized.data.authorization_url,
    });
  } catch (error) {
    if (error instanceof PaystackError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    console.error("Wallet funding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
