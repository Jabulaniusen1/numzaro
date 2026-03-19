
import { NextRequest, NextResponse } from "next/server";
import { smsPoolClient } from "@/lib/smspool/client";
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
    console.error("[smspool/pricing] markup fetch failed:", e);
    return 5.0;
  }
}

export async function GET(request: NextRequest) {
  const service = request.nextUrl.searchParams.get("service");
  const country = request.nextUrl.searchParams.get("country");
  const rentalId = request.nextUrl.searchParams.get("rentalId");
  const mode = request.nextUrl.searchParams.get("mode") || "activation";

  try {
    if (mode === "rental") {
      if (!rentalId) {
        return NextResponse.json({ error: "rentalId is required for rental mode" }, { status: 400 });
      }

      const result = await smsPoolClient.getRentals(true);
      const rental = result.data?.find((r) => String(r.ID) === rentalId);

      if (!rental) {
        return NextResponse.json({ error: "Rental not found" }, { status: 404 });
      }

      const markup = await getMarkupMultiplier();
      // Build options from the actual pricing tiers: {days: price}
      const options = Object.entries(rental.pricing).map(([daysStr, rawPrice]) => {
        const totalDays = parseInt(daysStr);
        const price = parseFloat((rawPrice * markup).toFixed(2));
        const label = totalDays === 1 ? "1 Day"
          : totalDays === 7 ? "1 Week"
          : totalDays === 14 ? "2 Weeks"
          : totalDays === 28 || totalDays === 30 ? "1 Month"
          : totalDays === 60 ? "2 Months"
          : totalDays === 90 ? "3 Months"
          : totalDays === 180 ? "6 Months"
          : totalDays === 360 || totalDays === 365 ? "1 Year"
          : `${totalDays} Days`;

        return { rentalId, label, totalDays, price, rawPrice: rawPrice as number };
      }).sort((a, b) => a.totalDays - b.totalDays);

      return NextResponse.json({ mode: "rental", rentalId, options });
    }

    // Activation mode
    if (!service || !country) {
      return NextResponse.json({ error: "service and country are required" }, { status: 400 });
    }

    const result = await smsPoolClient.getSMSServicePrice(country, service);

    // SMSPool returns {price, high_price, success_rate} — no success field
    if (!result.price) {
      return NextResponse.json({ error: "Pricing unavailable for this combination" }, { status: 404 });
    }

    const markup = await getMarkupMultiplier();
    const rawPrice = parseFloat(result.high_price || result.price);
    if (Number.isNaN(rawPrice)) {
      return NextResponse.json({ error: "Invalid price returned from provider" }, { status: 400 });
    }
    const successRate = Number(result.success_rate);
    const price = parseFloat((rawPrice * markup).toFixed(2));
    const priceNGN = parseFloat((await convertCurrency(price, "USD", "NGN")).toFixed(2));

    return NextResponse.json({
      mode: "activation",
      service,
      country,
      price,
      priceNGN,
      rawPrice,
      successRate: Number.isNaN(successRate) ? null : successRate,
      available: null,
    });
  } catch (error: any) {
    console.error("[smspool/pricing]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
