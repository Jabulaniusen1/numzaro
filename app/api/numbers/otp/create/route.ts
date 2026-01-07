import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Create an OTP number purchase request
 * This endpoint handles rate limiting and creates OTP number purchases
 */
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
    const { country, service_name } = body;

    if (!country) {
      return NextResponse.json(
        { error: "Country is required" },
        { status: 400 }
      );
    }

    // Rate limiting: Check how many OTP numbers user has purchased in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentOtpCount } = await supabase
      .from("phone_numbers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "otp")
      .gte("created_at", oneHourAgo);

    // Allow max 5 OTP numbers per hour per user
    const maxOtpPerHour = 5;
    if ((recentOtpCount || 0) >= maxOtpPerHour) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `You can only purchase ${maxOtpPerHour} OTP numbers per hour`,
        },
        { status: 429 }
      );
    }

    // Redirect to regular purchase endpoint with OTP type
    // The frontend should call /api/numbers/purchase with type="otp"
    // This endpoint is mainly for rate limiting validation
    return NextResponse.json({
      message: "Rate limit check passed",
      canPurchase: true,
    });
  } catch (error: any) {
    console.error("OTP create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

