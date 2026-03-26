import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

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
      .eq("key", "default_markup_percentage")
      .single();

    return NextResponse.json({
      markupPercentage: markupSetting
        ? parseFloat(markupSetting.value)
        : 30.0,
    });
  } catch (error) {
    console.error("Error fetching markup:", error);
    return NextResponse.json(
      { error: "Failed to fetch markup" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

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

    if (typeof markupPercentage !== "number" || markupPercentage < 0 || markupPercentage > 10000) {
      return NextResponse.json(
        { error: "Markup percentage must be between 0 and 10000" },
        { status: 400 }
      );
    }

    // Update markup setting
    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        {
          key: "default_markup_percentage",
          value: markupPercentage.toString(),
          description: "Default profit markup percentage for all services",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      console.error("Error updating markup:", error);
      return NextResponse.json(
        { error: "Failed to update markup" },
        { status: 500 }
      );
    }

    // No need to update individual service rates — they are computed live from
    // cost_rate + this markup setting at request time.
    return NextResponse.json({ success: true, markupPercentage });
  } catch (error) {
    console.error("Error updating markup:", error);
    return NextResponse.json(
      { error: "Failed to update markup" },
      { status: 500 }
    );
  }
}

