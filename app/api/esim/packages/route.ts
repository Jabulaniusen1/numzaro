import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { esimAccessClient, ESimAccessClient } from "@/lib/esimaccess/client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

async function getMarkupMultiplier() {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "esim_markup_percentage")
      .single();
    const pct = data ? parseFloat(data.value) : 30.0;
    return 1 + pct / 100;
  } catch {
    return 1.3; // default 30% markup
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const locationCode = body?.locationCode as string | undefined;
    const type = body?.type as "BASE" | "TOPUP" | undefined;
    const packageCode = body?.packageCode as string | undefined;
    const iccid = body?.iccid as string | undefined;

    const result = await esimAccessClient.listPackages({ locationCode, type, packageCode, iccid });
    const markupMultiplier = await getMarkupMultiplier();

    const packages = (result.packageList || []).map((pkg) => ({
      ...pkg,
      priceUsd: ESimAccessClient.priceToUsd(pkg.price),
      chargedUsd: parseFloat((ESimAccessClient.priceToUsd(pkg.price) * markupMultiplier).toFixed(4)),
      dataFormatted: ESimAccessClient.formatBytes(pkg.volume),
    }));

    return NextResponse.json({ packages });
  } catch (error: any) {
    console.error("[esim/packages] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
