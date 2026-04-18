import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { textverifiedClient } from "@/lib/textverified/client";

async function getMarkupMultiplier() {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "phone_numbers_markup_percentage")
      .single();
    const pct = data ? parseFloat(data.value) : 400.0;
    return 1 + pct / 100;
  } catch {
    return 5.0;
  }
}

export async function GET(request: NextRequest) {
  const { user } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceName = request.nextUrl.searchParams.get("service")?.trim();
  if (!serviceName) return NextResponse.json({ error: "service is required" }, { status: 400 });

  try {
    const [priceData, markupMultiplier] = await Promise.all([
      textverifiedClient.getVerificationPrice({ serviceName }),
      getMarkupMultiplier(),
    ]);
    const rawPrice = typeof priceData.price === "number" ? priceData.price : parseFloat(String(priceData.price));
    if (isNaN(rawPrice)) return NextResponse.json({ error: "Invalid price from provider" }, { status: 400 });
    const userPrice = parseFloat((rawPrice * markupMultiplier).toFixed(2));
    return NextResponse.json({ price: userPrice, rawPrice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Service not available" }, { status: 400 });
  }
}
