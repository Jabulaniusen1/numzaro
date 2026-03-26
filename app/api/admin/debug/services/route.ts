import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    if (!adminEmails.includes(user.email || ""))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Sample 10 services to see actual stored values
    const { data: services } = await supabase
      .from("services")
      .select("id, service_id, name, cost_rate, rate, markup_percentage")
      .order("name", { ascending: true })
      .limit(10);

    // Get markup setting
    const { data: markupSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "default_markup_percentage")
      .single();

    return NextResponse.json({
      markup_in_db: markupSetting?.value,
      sample_services: services?.map((s) => ({
        name: s.name,
        cost_rate: s.cost_rate,
        rate: s.rate,
        markup_percentage: s.markup_percentage,
        computed_rate_30pct: (parseFloat(s.cost_rate) * 1.3).toFixed(6),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
