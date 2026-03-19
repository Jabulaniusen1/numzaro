import { NextRequest, NextResponse } from "next/server";
import { textverifiedClient } from "@/lib/textverified/client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { convertCurrency } from "@/lib/currency/rates";

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
  } catch (e) {
    console.error("[textverified/pricing] markup fetch failed:", e);
    return 5.0; // 400% fallback
  }
}

export async function GET(request: NextRequest) {
  const service = request.nextUrl.searchParams.get("service");
  const country = request.nextUrl.searchParams.get("country");
  const mode = request.nextUrl.searchParams.get("mode") || "activation";
  const isRenewableParam = request.nextUrl.searchParams.get("isRenewable");
  const duration = request.nextUrl.searchParams.get("duration");

  const RENTAL_DURATIONS: Array<{ key: string; label: string; days: number }> = [
    { key: "oneDay", label: "1 Day", days: 1 },
    { key: "threeDay", label: "3 Days", days: 3 },
    { key: "sevenDay", label: "1 Week", days: 7 },
    { key: "fourteenDay", label: "2 Weeks", days: 14 },
    { key: "thirtyDay", label: "1 Month", days: 30 },
    { key: "ninetyDay", label: "3 Months", days: 90 },
    { key: "oneYear", label: "1 Year", days: 365 },
  ];

  try {
    if (!service || !country) {
      return NextResponse.json({ error: "service and area code are required" }, { status: 400 });
    }

    if (mode === "rental") {
      const isRenewable = isRenewableParam !== "false";
      const areaCode = Boolean(country && country !== "any");
      const markup = await getMarkupMultiplier();

      const loadDurationPrice = async (durationKey: string) => {
        const price = await textverifiedClient.getRentalPrice({
          serviceName: service,
          areaCode,
          isRenewable,
          duration: durationKey as any,
          numberType: "mobile",
          capability: "sms",
        });
        const raw = parseFloat(String(price.price));
        if (Number.isNaN(raw)) return null;
        return raw;
      };

      if (duration) {
        const raw = await loadDurationPrice(duration);
        if (raw == null) {
          return NextResponse.json({ error: "Pricing unavailable for this combination" }, { status: 404 });
        }
        const option = RENTAL_DURATIONS.find((d) => d.key === duration);
        const price = parseFloat((raw * markup).toFixed(2));
        const priceNGN = parseFloat((await convertCurrency(price, "USD", "NGN")).toFixed(2));
        return NextResponse.json({
          mode: "rental",
          service,
          areaCode: country,
          isRenewable,
          duration,
          label: option?.label ?? duration,
          days: option?.days ?? null,
          price,
          priceNGN,
          rawPrice: raw,
        });
      }

      const options: Array<{ duration: string; label: string; days: number; price: number; rawPrice: number }> = [];
      for (const opt of RENTAL_DURATIONS) {
        try {
          const raw = await loadDurationPrice(opt.key);
          if (raw == null) continue;
          const price = parseFloat((raw * markup).toFixed(2));
          options.push({ duration: opt.key, label: opt.label, days: opt.days, price, rawPrice: raw });
        } catch {
          // skip unsupported duration
        }
      }

      if (options.length === 0) {
        return NextResponse.json({ error: "Pricing unavailable for this combination" }, { status: 404 });
      }

      return NextResponse.json({ mode: "rental", service, areaCode: country, isRenewable, options });
    }

    const pricing = await textverifiedClient.getVerificationPrice({
      serviceName: service,
      areaCode: Boolean(country && country !== "any"),
      carrier: false,
      numberType: "mobile",
      capability: "sms",
    });

    const rawPrice = parseFloat(String(pricing.price));
    if (Number.isNaN(rawPrice)) {
      return NextResponse.json({ error: "Invalid price returned from provider" }, { status: 400 });
    }
    const available = null;

    const markup = await getMarkupMultiplier();
    const price = parseFloat((rawPrice * markup).toFixed(2));
    const priceNGN = parseFloat((await convertCurrency(price, "USD", "NGN")).toFixed(2));

    return NextResponse.json({ service, country, price, priceNGN, rawPrice, available });
  } catch (error: any) {
    console.error("[textverified/pricing]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
