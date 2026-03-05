
import { NextRequest, NextResponse } from "next/server";
import { smspvaClient, SMSPVA_IMG_BASE } from "@/lib/smspva/client";

// Cache services for 5 minutes to avoid hammering SMSPVA
let cache: { data: any[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") || "US";

  try {
    // Serve from cache if fresh
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const result = await smspvaClient.getRentServices(country, "week", 1);

    if (result.status !== 1 || !result.data?.services) {
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }

    const services = result.data.services
      .filter((s) => s.count > 0)  // only show services that have numbers available
      .map((s) => ({
        code: s.service,
        name: s.name,
        logo: s.img ? `${SMSPVA_IMG_BASE}${s.img}` : null,
        priceDay: s.price_day,
        available: s.count,
      }));

    cache = { data: services, ts: Date.now() };
    return NextResponse.json(services);
  } catch (error: any) {
    console.error("[smspva/services]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
