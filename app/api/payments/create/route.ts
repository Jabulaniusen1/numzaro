import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { initializeCharge, KorapayError } from "@/lib/korapay/client";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, metadata } = body;

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
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
    const redirect_url = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`;

    const result = await initializeCharge({
      email,
      amount,           // Korapay uses main currency unit — no kobo conversion
      currency: "NGN",
      reference,
      redirect_url,
      metadata: { ...metadata, user_id: user.id },
    });

    return NextResponse.json({
      checkout_url: result.data.checkout_url,
      reference: result.data.reference,
    });
  } catch (error) {
    if (error instanceof KorapayError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
