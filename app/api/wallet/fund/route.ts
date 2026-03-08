import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializeTransaction, PaystackError } from "@/lib/paystack/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency: requestCurrency } = body;

    // Default to USD if no currency specified
    const currency = requestCurrency || "USD";

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Get user email
    const { data: userProfile } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    const email = userProfile?.email || user.email;
    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Convert amount to smallest currency unit (kobo for NGN, cents for USD, etc.)
    // Most currencies use 100 as the multiplier, but we'll handle it generically
    const amountInSmallestUnit = Math.round(amount * 100);

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify?type=wallet`;

    const result = await initializeTransaction({
      email,
      amount: amountInSmallestUnit,
      currency: currency,
      callback_url: callbackUrl,
      metadata: {
        type: "wallet_funding",
        user_id: user.id,
        currency: currency, // Store currency in metadata for verification
      },
    });

    if (!result.status) {
      return NextResponse.json(
        { error: result.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      access_code: result.data.access_code,
      reference: result.data.reference,
      email: email, // Return email for popup SDK
    });
  } catch (error) {
    if (error instanceof PaystackError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }
    console.error("Wallet funding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


