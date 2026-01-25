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

    const { data: markupSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "phone_numbers_markup_percentage")
      .single();

    return NextResponse.json({
      markupPercentage: markupSetting
        ? parseFloat(markupSetting.value)
        : 400.0, // Default 400% markup (5x cost)
    });
  } catch (error) {
    console.error("Error fetching phone numbers markup:", error);
    return NextResponse.json(
      { error: "Failed to fetch markup" },
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
    const { markupPercentage } = body;

    if (typeof markupPercentage !== "number" || markupPercentage < 0) {
      return NextResponse.json(
        { error: "Invalid markup percentage" },
        { status: 400 }
      );
    }

    // Update markup setting
    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        {
          key: "phone_numbers_markup_percentage",
          value: markupPercentage.toString(),
          description: "Profit markup percentage for virtual phone numbers",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      console.error("Error updating phone numbers markup:", error);
      return NextResponse.json(
        { error: "Failed to update markup" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, markupPercentage });
  } catch (error) {
    console.error("Error updating phone numbers markup:", error);
    return NextResponse.json(
      { error: "Failed to update markup" },
      { status: 500 }
    );
  }
}






