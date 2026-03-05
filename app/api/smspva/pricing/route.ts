
import { NextRequest, NextResponse } from "next/server";
import { smspvaClient, SmspvaRentDtype } from "@/lib/smspva/client";

const MARKUP = 1.5;

export async function GET(request: NextRequest) {
  const service = request.nextUrl.searchParams.get("service");
  const country = request.nextUrl.searchParams.get("country");
  const mode = request.nextUrl.searchParams.get("mode") || "activation"; // "activation" | "rental"

  if (!service || !country) {
    return NextResponse.json({ error: "service and country are required" }, { status: 400 });
  }

  try {
    if (mode === "rental") {
      // Fetch rental pricing for week and month options
      const [weekResult, monthResult] = await Promise.all([
        smspvaClient.getRentServices(country, "week", 1),
        smspvaClient.getRentServices(country, "month", 1),
      ]);

      const weekService = weekResult.data?.services?.find((s) => s.service === service);
      const monthService = monthResult.data?.services?.find((s) => s.service === service);

      const options = [];
      if (weekService) {
        options.push({
          dtype: "week" as SmspvaRentDtype,
          dcount: 1,
          label: "1 Week",
          pricePerDay: weekService.price_day,
          totalDays: 7,
          price: parseFloat((weekService.price_day * 7 * MARKUP).toFixed(2)),
          available: weekService.count,
        });
        options.push({
          dtype: "week" as SmspvaRentDtype,
          dcount: 2,
          label: "2 Weeks",
          pricePerDay: weekService.price_day,
          totalDays: 14,
          price: parseFloat((weekService.price_day * 14 * MARKUP).toFixed(2)),
          available: weekService.count,
        });
      }
      if (monthService) {
        options.push({
          dtype: "month" as SmspvaRentDtype,
          dcount: 1,
          label: "1 Month",
          pricePerDay: monthService.price_day,
          totalDays: 30,
          price: parseFloat((monthService.price_day * 30 * MARKUP).toFixed(2)),
          available: monthService.count,
        });
        options.push({
          dtype: "month" as SmspvaRentDtype,
          dcount: 3,
          label: "3 Months",
          pricePerDay: monthService.price_day,
          totalDays: 90,
          price: parseFloat((monthService.price_day * 90 * MARKUP).toFixed(2)),
          available: monthService.count,
        });
      }

      return NextResponse.json({ mode: "rental", service, country, options });
    }

    // Activation (one-time) pricing
    const [priceResult, countResult] = await Promise.all([
      smspvaClient.getServicePrice(service, country),
      smspvaClient.getCount(service, country),
    ]);

    if (priceResult.response !== "1") {
      return NextResponse.json({ error: "Pricing unavailable for this combination" }, { status: 404 });
    }

    const rawPrice = parseFloat(priceResult.price);
    const price = parseFloat((rawPrice * MARKUP).toFixed(2));
    const available = countResult.online ?? 0;

    return NextResponse.json({ mode: "activation", service, country, price, rawPrice, available });
  } catch (error: any) {
    console.error("[smspva/pricing]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
