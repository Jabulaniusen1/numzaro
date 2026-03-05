
import { NextRequest, NextResponse } from "next/server";
import { quackrClient } from "@/lib/quackr/client";

const MARKUP = 1.5;

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale");
  if (!locale) {
    return NextResponse.json({ error: "locale is required" }, { status: 400 });
  }

  try {
    const result = await quackrClient.getPricing(locale);
    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
    }

    // Apply markup and return labeled durations
    const p = result.pricing as unknown as Record<string, string>;
    const durations = [
      { key: "halfDay",      label: "12 Hours" },
      { key: "oneDay",       label: "1 Day" },
      { key: "oneWeek",      label: "1 Week" },
      { key: "oneMonth",     label: "1 Month" },
      { key: "threeMonths",  label: "3 Months" },
      { key: "sixMonths",    label: "6 Months" },
      { key: "twelveMonths", label: "12 Months" },
    ];

    const pricing = durations
      .filter((d) => p[d.key] !== undefined)
      .map((d) => ({
        key: d.key,
        label: d.label,
        price: parseFloat((parseFloat(p[d.key]) * MARKUP).toFixed(2)),
        rawPrice: parseFloat(p[d.key]),
      }));

    return NextResponse.json({ locale, pricing });
  } catch (error: any) {
    console.error("[quackr/pricing]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
