import { NextRequest, NextResponse } from "next/server";
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

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all one-time OTP pricing settings
    const [typeResult, percentageResult, fixedResult] = await Promise.all([
      supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "one_time_otp_pricing_type")
        .single(),
      supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "one_time_otp_pricing_percentage")
        .single(),
      supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "one_time_otp_pricing_fixed")
        .single(),
    ]);

    return NextResponse.json({
      pricingType: typeResult.data?.value || "percentage",
      percentage: percentageResult.data
        ? parseFloat(percentageResult.data.value)
        : 20.0,
      fixed: fixedResult.data ? parseFloat(fixedResult.data.value) : 1.0,
    });
  } catch (error) {
    console.error("Error fetching one-time OTP pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { pricingType, percentage, fixed } = body;

    if (pricingType !== "percentage" && pricingType !== "fixed") {
      return NextResponse.json(
        { error: "Invalid pricingType. Must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    if (pricingType === "percentage") {
      if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
        return NextResponse.json(
          { error: "Invalid percentage. Must be between 0 and 100" },
          { status: 400 }
        );
      }
    } else {
      if (typeof fixed !== "number" || fixed < 0) {
        return NextResponse.json(
          { error: "Invalid fixed price. Must be a positive number" },
          { status: 400 }
        );
      }
    }

    // Update settings
    const updates = [
      supabase
        .from("admin_settings")
        .upsert(
          {
            key: "one_time_otp_pricing_type",
            value: pricingType,
            description: "Pricing type for one-time OTP numbers: 'percentage' or 'fixed'",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        ),
      supabase
        .from("admin_settings")
        .upsert(
          {
            key: "one_time_otp_pricing_percentage",
            value: percentage?.toString() || "20.00",
            description: "Percentage of monthly cost for one-time OTP numbers",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        ),
      supabase
        .from("admin_settings")
        .upsert(
          {
            key: "one_time_otp_pricing_fixed",
            value: fixed?.toString() || "1.00",
            description: "Fixed price in USD for one-time OTP numbers",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        ),
    ];

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error("Error updating one-time OTP pricing:", errors);
      return NextResponse.json(
        { error: "Failed to update pricing settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pricingType,
      percentage: pricingType === "percentage" ? percentage : undefined,
      fixed: pricingType === "fixed" ? fixed : undefined,
    });
  } catch (error) {
    console.error("Error updating one-time OTP pricing:", error);
    return NextResponse.json(
      { error: "Failed to update pricing settings" },
      { status: 500 }
    );
  }
}

