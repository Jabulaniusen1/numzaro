import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { smsPoolClient } from "@/lib/smspool/client";
import { getLiveFxRate } from "@/lib/currency/rates";

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
    return 1.3;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const locationCode = String(body?.locationCode || "").trim().toUpperCase();
    const markupMultiplier = await getMarkupMultiplier();
    const usdToNgnRate = await getLiveFxRate("USD", "NGN").catch(() => 1500);

    const gbToBytes = (gb: number) => {
      if (!Number.isFinite(gb) || gb <= 0) return 0;
      return Math.round(gb * 1024 * 1024 * 1024);
    };
    const formatBytes = (bytes: number) => {
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${Math.max(0, bytes)} B`;
    };

    let packages: any[] = [];

    if (locationCode) {
      const [plans, pricing] = await Promise.all([
        smsPoolClient.getEsimPlans(locationCode.toLowerCase()),
        smsPoolClient.getEsimCountries({ start: 0, length: 200, search: locationCode }).catch(() => ({ data: [] as any[] })),
      ]);

      const locationName =
        pricing.data?.find((c: any) => String(c.countryCode || "").toUpperCase() === locationCode)?.name ||
        locationCode;

      packages = (plans || []).map((plan: any) => {
        const priceUsd = parseFloat(String(plan.price || "0"));
        const dataGb = Number(plan.dataInGb || 0);
        const volumeBytes = gbToBytes(dataGb);
        return {
          packageCode: String(plan.ID),
          slug: `smspool-${plan.ID}`,
          name: `${locationName} ${dataGb > 0 ? `${dataGb}GB` : "Plan"} ${plan.duration ? `- ${plan.duration} days` : ""}`.trim(),
          price: priceUsd,
          currencyCode: "USD",
          volume: volumeBytes,
          duration: Number(plan.duration || 30),
          durationUnit: "DAY",
          location: locationName,
          priceUsd,
          chargedUsd: parseFloat((priceUsd * markupMultiplier).toFixed(4)),
          chargedNgn: parseFloat((priceUsd * markupMultiplier * usdToNgnRate).toFixed(2)),
          dataFormatted: formatBytes(volumeBytes),
        };
      });
    } else {
      const pricing = await smsPoolClient.getEsimCountries({ start: 0, length: 200 });
      packages = (pricing.data || []).map((item: any) => {
        const priceUsd = parseFloat(String(item.price || "0"));
        const dataGb = Number(item.dataInGb || 0);
        const volumeBytes = gbToBytes(dataGb);
        return {
          packageCode: String(item.ID),
          slug: `smspool-${item.ID}`,
          name: `${item.name || item.countryCode || "eSIM"} ${dataGb > 0 ? `${dataGb}GB` : "Plan"}${item.duration ? ` - ${item.duration} days` : ""}`,
          price: priceUsd,
          currencyCode: "USD",
          volume: volumeBytes,
          duration: Number(item.duration || 30),
          durationUnit: "DAY",
          location: item.name || item.countryCode || "Global",
          priceUsd,
          chargedUsd: parseFloat((priceUsd * markupMultiplier).toFixed(4)),
          chargedNgn: parseFloat((priceUsd * markupMultiplier * usdToNgnRate).toFixed(2)),
          dataFormatted: formatBytes(volumeBytes),
        };
      });
    }

    return NextResponse.json({ packages });
  } catch (error: any) {
    console.error("[esim/packages] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
