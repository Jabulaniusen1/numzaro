import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { platfoneClient } from "@/lib/platfone/client";

async function getMarkupMultiplier(): Promise<number> {
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

/**
 * GET /api/platfone/countries?service=whatsapp
 *
 * Calls GET /activation/prices/services?service_id=whatsapp which returns
 * [{ service_id, countries: [{ country_id, price: { min, max, suggested }, count }] }]
 *
 * Also fetches GET /activation/countries for display names.
 *
 * Response: { countries: Array<{ code, name, flag, available, sellPrice }> }
 */

const FLAG_MAP: Record<string, string> = {
  uk: "🇬🇧", us: "🇺🇸", ru: "🇷🇺", ua: "🇺🇦", kz: "🇰🇿", id: "🇮🇩",
  ph: "🇵🇭", mm: "🇲🇲", in: "🇮🇳", bd: "🇧🇩", ng: "🇳🇬", vn: "🇻🇳",
  pk: "🇵🇰", kh: "🇰🇭", cn: "🇨🇳", gh: "🇬🇭", pl: "🇵🇱", za: "🇿🇦",
  br: "🇧🇷", my: "🇲🇾", ke: "🇰🇪", co: "🇨🇴", eg: "🇪🇬", mx: "🇲🇽",
  th: "🇹🇭", ar: "🇦🇷", pe: "🇵🇪", ro: "🇷🇴", ir: "🇮🇷", de: "🇩🇪",
  fr: "🇫🇷", it: "🇮🇹", es: "🇪🇸", nl: "🇳🇱", pt: "🇵🇹", se: "🇸🇪",
  tr: "🇹🇷", il: "🇮🇱", sa: "🇸🇦", ae: "🇦🇪", iq: "🇮🇶", ma: "🇲🇦",
  ca: "🇨🇦", au: "🇦🇺", jp: "🇯🇵", kr: "🇰🇷", tw: "🇹🇼", et: "🇪🇹",
  tz: "🇹🇿", ug: "🇺🇬", us_v: "🇺🇸", uk_v: "🇬🇧",
};

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = request.nextUrl.searchParams.get("service");
    if (!service) {
      return NextResponse.json({ error: "service query param is required" }, { status: 400 });
    }

    // Fetch prices, country names, and markup in parallel
    const [pricesList, countriesList, markupMultiplier] = await Promise.all([
      platfoneClient.getPricesByService(service),
      platfoneClient.getCountries().catch(() => [] as any[]),
      getMarkupMultiplier(),
    ]);

    // Build country name lookup
    const countryNames: Record<string, string> = {};
    for (const c of countriesList) {
      countryNames[c.country_id] = c.name;
    }

    // pricesList = [{ service_id, countries: [...] }] — find our service
    const serviceEntry = pricesList.find((s) => s.service_id === service);
    if (!serviceEntry) {
      return NextResponse.json({ countries: [] });
    }

    const countries = serviceEntry.countries
      .filter((c) => c.count > 0)
      .map((c) => ({
        code: c.country_id,
        name: countryNames[c.country_id] ?? c.country_id.toUpperCase(),
        flag: FLAG_MAP[c.country_id] ?? "🌍",
        available: c.count,
        // suggested price in USD cents → convert to USD, then apply markup
        sellPrice: parseFloat((((c.price?.suggested ?? c.price?.min ?? 0) / 100) * markupMultiplier).toFixed(2)),
      }))
      .sort((a, b) => {
        const aKnown = FLAG_MAP[a.code] !== undefined;
        const bKnown = FLAG_MAP[b.code] !== undefined;
        if (aKnown !== bKnown) return aKnown ? -1 : 1;
        return b.available - a.available;
      });

    return NextResponse.json({ countries });
  } catch (error: any) {
    console.error("[/api/platfone/countries] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Platfone countries" },
      { status: 500 }
    );
  }
}
