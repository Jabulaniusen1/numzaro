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

function flagFromIso2(iso2?: string) {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const code = iso2.toUpperCase();
  const base = 0x1f1e6;
  const cp1 = base + (code.charCodeAt(0) - 65);
  const cp2 = base + (code.charCodeAt(1) - 65);
  if (cp1 < base || cp2 < base) return "🌍";
  return String.fromCodePoint(cp1, cp2);
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const markup = await getMarkupMultiplier();
    const usdToNgnRate = await getLiveFxRate("USD", "NGN").catch(() => 1500);
    const pricing = await smsPoolClient.getEsimCountries({ start: 0, length: 300 });
    const rows = Array.isArray(pricing?.data) ? pricing.data : [];

    const merged = new Map<string, any>();

    for (const row of rows) {
      const code = String(row.countryCode || "").toUpperCase();
      if (!code) continue;
      const name = String(row.name || code);
      const rawPrice = parseFloat(String(row.price || "0"));
      const charged = Number.isFinite(rawPrice)
        ? parseFloat((rawPrice * markup).toFixed(4))
        : 0;
      const chargedNgn = Number.isFinite(charged)
        ? parseFloat((charged * usdToNgnRate).toFixed(2))
        : 0;
      const current = merged.get(code);

      if (!current || charged < current.startingChargedUsd) {
        merged.set(code, {
          code,
          name,
          flag: flagFromIso2(code),
          startingPriceUsd: Number.isFinite(rawPrice) ? rawPrice : 0,
          startingChargedUsd: charged,
          startingChargedNgn: chargedNgn,
        });
      }
    }

    const countries = Array.from(merged.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name))
    );

    return NextResponse.json({ countries });
  } catch (error: any) {
    console.error("[esim/countries] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
