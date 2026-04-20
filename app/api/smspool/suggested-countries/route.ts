import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { smsPoolClient } from "@/lib/smspool/client";

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

function flagFromIso2(iso2?: string) {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const code = iso2.toUpperCase();
  const A = 0x1f1e6;
  const cp1 = code.charCodeAt(0) - 65 + A;
  const cp2 = code.charCodeAt(1) - 65 + A;
  if (cp1 < A || cp2 < A) return "🌍";
  return String.fromCodePoint(cp1, cp2);
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = request.nextUrl.searchParams.get("service");
    if (!service) {
      return NextResponse.json({ error: "service query param is required" }, { status: 400 });
    }

    const [markupMultiplier, suggested] = await Promise.all([
      getMarkupMultiplier(),
      smsPoolClient.getSuggestedCountries(service),
    ]);

    const countries = (suggested || [])
      .map((item) => {
        const rawPrice = parseFloat(String(item.high_price ?? item.price ?? "0"));
        const sellPrice = Number.isFinite(rawPrice) && rawPrice > 0
          ? parseFloat((rawPrice * markupMultiplier).toFixed(2))
          : 0;
        const shortCode = String(item.short_name || "").toUpperCase();
        return {
          code: String(item.country_id),
          name: item.name || `Country ${item.country_id}`,
          shortCode,
          flag: flagFromIso2(shortCode),
          available: 1, // Suggested countries are expected to be purchasable now.
          sellPrice,
          rawPrice: Number.isFinite(rawPrice) ? rawPrice : 0,
          pool: item.pool ?? null,
        };
      })
      .sort((a, b) => a.sellPrice - b.sellPrice);

    return NextResponse.json({ countries });
  } catch (error: any) {
    console.error("[smspool/suggested-countries]", error.message);
    return NextResponse.json({ error: error.message || "Failed to fetch countries" }, { status: 500 });
  }
}

