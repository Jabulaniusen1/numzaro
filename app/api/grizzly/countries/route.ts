import { NextResponse } from "next/server";
import { textverifiedClient } from "@/lib/textverified/client";

let cache: { data: any[]; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const areaCodes = await textverifiedClient.getAreaCodes();
    if (!Array.isArray(areaCodes) || areaCodes.length === 0) {
      return NextResponse.json(
        { error: "No area codes returned from provider" },
        { status: 502 }
      );
    }

    const data = [
      { code: "any", name: "Any area code", flag: "🇺🇸" },
      ...areaCodes.map((c) => ({
        code: String(c.areaCode),
        name: `${c.state} (${c.areaCode})`,
        flag: "🇺🇸",
      })),
    ];

    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[textverified/area-codes]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
