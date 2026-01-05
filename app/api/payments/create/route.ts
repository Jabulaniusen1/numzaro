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
    const { amount, metadata } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    // Get user email - use auth user email as fallback
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

    // Convert amount to kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(amount * 100);

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`;

    const result = await initializeTransaction({
      email,
      amount: amountInKobo,
      callback_url: callbackUrl,
      metadata: {
        ...metadata,
        user_id: user.id,
      },
    });

    if (!result.status) {
      return NextResponse.json(
        { error: result.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error) {
    if (error instanceof PaystackError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

