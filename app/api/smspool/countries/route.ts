
import { NextResponse } from "next/server";
import { smsPoolClient } from "@/lib/smspool/client";

// Map country name → flag emoji
const FLAG_MAP: Record<string, string> = {
  "United States": "🇺🇸", "Canada": "🇨🇦", "United Kingdom": "🇬🇧",
  "France": "🇫🇷", "Germany": "🇩🇪", "Italy": "🇮🇹", "Spain": "🇪🇸",
  "Australia": "🇦🇺", "Netherlands": "🇳🇱", "Poland": "🇵🇱",
  "Mexico": "🇲🇽", "Brazil": "🇧🇷", "Indonesia": "🇮🇩", "Philippines": "🇵🇭",
  "Hong Kong": "🇭🇰", "Japan": "🇯🇵", "Singapore": "🇸🇬", "Romania": "🇷🇴",
  "Lithuania": "🇱🇹", "Finland": "🇫🇮", "Sweden": "🇸🇪", "Czech Republic": "🇨🇿",
  "Georgia": "🇬🇪", "Kazakhstan": "🇰🇿", "Russia": "🇷🇺", "Ukraine": "🇺🇦",
  "India": "🇮🇳", "China": "🇨🇳", "South Korea": "🇰🇷", "Thailand": "🇹🇭",
  "Vietnam": "🇻🇳", "Nigeria": "🇳🇬", "South Africa": "🇿🇦", "Egypt": "🇪🇬",
  "Pakistan": "🇵🇰", "Bangladesh": "🇧🇩", "Colombia": "🇨🇴", "Argentina": "🇦🇷",
  "Chile": "🇨🇱", "Peru": "🇵🇪", "Portugal": "🇵🇹", "Belgium": "🇧🇪",
  "Switzerland": "🇨🇭", "Austria": "🇦🇹", "Denmark": "🇩🇰", "Norway": "🇳🇴",
  "Israel": "🇮🇱", "Turkey": "🇹🇷", "Saudi Arabia": "🇸🇦", "UAE": "🇦🇪",
};

// Cache for 10 minutes — countries rarely change
let cache: { data: any[]; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const countries = await smsPoolClient.getCountries();
    if (!Array.isArray(countries)) {
      return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
    }

    const data = countries.map((c) => ({
      code: String(c.ID),
      name: c.name,
      flag: FLAG_MAP[c.name] ?? FLAG_MAP[c.short_name] ?? "🌍",
    }));

    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[smspool/countries]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
