
import { NextRequest, NextResponse } from "next/server";
import { smsPoolClient } from "@/lib/smspool/client";

async function getMarkupMultiplier() {
  return 1.5; // Fixed markup
}

async function convertUSDtoNGN(usdAmount: number): Promise<number> {
  try {
    const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
    if (API_KEY) {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/USD/NGN`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.result === "success" && data.conversion_rate) {
          return usdAmount * data.conversion_rate;
        }
      }
    }
  } catch {}
  return usdAmount * 1500; // fallback rate
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
    const rawPrice = parseFloat(result.price);
    const price = parseFloat((rawPrice * markup).toFixed(2));
    const priceNGN = parseFloat((await convertUSDtoNGN(price)).toFixed(2));

    return NextResponse.json({ mode: "activation", service, country, price, priceNGN, rawPrice, available: null });
  } catch (error: any) {
    console.error("[smspool/pricing]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
