import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "esim_markup_percentage")
      .single();

    return NextResponse.json({
      markupPercentage: data ? parseFloat(data.value) : 30.0,
    });
  } catch (error) {
    console.error("[admin/esim/markup] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch markup" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        {
          key: "esim_markup_percentage",
          value: markupPercentage.toString(),
          description: "Profit markup percentage for eSIM data plans",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      console.error("[admin/esim/markup] upsert error:", error);
      return NextResponse.json({ error: "Failed to update markup" }, { status: 500 });
    }

    return NextResponse.json({ success: true, markupPercentage });
  } catch (error) {
    console.error("[admin/esim/markup] POST error:", error);
    return NextResponse.json({ error: "Failed to update markup" }, { status: 500 });
  }
}
