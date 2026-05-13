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
    const provider = String(body?.provider || "paystack").toLowerCase();
    if (provider !== "paystack") {
      return NextResponse.json(
        { error: "Unsupported payment provider. Use Paystack.", provider: "paystack" },
        { status: 400 }
      );
    }

    const amount = Number(body?.amount);
    const rawMetadata = body?.metadata;
    const currency = String(body?.currency || "NGN").toUpperCase();
    const metadata =
      rawMetadata && typeof rawMetadata === "object" && !Array.isArray(rawMetadata)
        ? rawMetadata
        : {};

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    const amountInSubunit = Math.round(amount * 100);
    if (!amountInSubunit || amountInSubunit <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    const email = userProfile?.email || user.email;
    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const reference = `NMZ-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not configured" }, { status: 500 });
    }

    const paymentType = typeof metadata?.type === "string" ? metadata.type : undefined;
    const callbackQuery = paymentType ? `?type=${encodeURIComponent(paymentType)}` : "";
    const callbackUrl = `${appUrl}/api/payments/verify${callbackQuery}`;

    const result = await initializeTransaction({
      email,
      amount: amountInSubunit,
      currency,
      reference,
      callback_url: callbackUrl,
      metadata: { ...metadata, user_id: user.id, type: paymentType || "wallet_funding" },
    });

    return NextResponse.json({
      provider: "paystack",
      checkout_url: result.data.authorization_url,
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    });
  } catch (error) {
    if (error instanceof PaystackError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
