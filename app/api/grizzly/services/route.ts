import { NextRequest, NextResponse } from "next/server";
import { textverifiedClient } from "@/lib/textverified/client";

// Popular services: name fragment (lowercase) → domain + sort priority
const POPULAR: Record<string, { domain: string; priority: number }> = {
  "facebook": { domain: "facebook.com", priority: 1 },
  "instagram": { domain: "instagram.com", priority: 2 },
  "whatsapp": { domain: "whatsapp.com", priority: 3 },
  "tiktok": { domain: "tiktok.com", priority: 4 },
  "telegram": { domain: "telegram.org", priority: 5 },
  "snapchat": { domain: "snapchat.com", priority: 6 },
  "twitter": { domain: "twitter.com", priority: 7 },
  "x (twitter)": { domain: "x.com", priority: 7 },
  "discord": { domain: "discord.com", priority: 8 },
  "reddit": { domain: "reddit.com", priority: 9 },
  "linkedin": { domain: "linkedin.com", priority: 10 },
  "pinterest": { domain: "pinterest.com", priority: 11 },
  "twitch": { domain: "twitch.tv", priority: 12 },
  "youtube": { domain: "youtube.com", priority: 13 },
  "signal": { domain: "signal.org", priority: 14 },
  "viber": { domain: "viber.com", priority: 15 },
  "wechat": { domain: "wechat.com", priority: 16 },
  "line": { domain: "line.me", priority: 17 },
  "skype": { domain: "skype.com", priority: 18 },
  "clubhouse": { domain: "clubhouse.com", priority: 19 },
  "tinder": { domain: "tinder.com", priority: 20 },
  "bumble": { domain: "bumble.com", priority: 21 },
  "hinge": { domain: "hinge.co", priority: 22 },
  "okcupid": { domain: "okcupid.com", priority: 23 },
  "match": { domain: "match.com", priority: 24 },
  "pof": { domain: "pof.com", priority: 25 },
  "badoo": { domain: "badoo.com", priority: 26 },
  "grindr": { domain: "grindr.com", priority: 27 },
  "zoosk": { domain: "zoosk.com", priority: 28 },
  "google": { domain: "google.com", priority: 40 },
  "gmail": { domain: "gmail.com", priority: 40 },
  "microsoft": { domain: "microsoft.com", priority: 41 },
  "apple": { domain: "apple.com", priority: 42 },
  "amazon": { domain: "amazon.com", priority: 43 },
  "netflix": { domain: "netflix.com", priority: 44 },
  "spotify": { domain: "spotify.com", priority: 45 },
  "uber": { domain: "uber.com", priority: 46 },
  "paypal": { domain: "paypal.com", priority: 48 },
  "airbnb": { domain: "airbnb.com", priority: 49 },
  "steam": { domain: "steampowered.com", priority: 50 },
  "roblox": { domain: "roblox.com", priority: 51 },
  "zoom": { domain: "zoom.us", priority: 52 },
  "ebay": { domain: "ebay.com", priority: 53 },
  "alibaba": { domain: "alibaba.com", priority: 54 },
  "aliexpress": { domain: "aliexpress.com", priority: 55 },
  "shein": { domain: "shein.com", priority: 56 },
  "doordash": { domain: "doordash.com", priority: 57 },
  "ubereats": { domain: "ubereats.com", priority: 58 },
  "grubhub": { domain: "grubhub.com", priority: 59 },
  "coinbase": { domain: "coinbase.com", priority: 60 },
  "binance": { domain: "binance.com", priority: 61 },
};

function getLogo(name: string): string | null {
  const lower = name.toLowerCase();
  const parts = lower.split(/[\/,&]/).map((p) => p.trim()).filter(Boolean);
  for (const [key, val] of Object.entries(POPULAR)) {
    if (parts.some((p) => p === key || p.includes(key) || key.includes(p))) {
      return `https://www.google.com/s2/favicons?domain=${val.domain}&sz=128`;
    }
  }
  return null;
}

function getPriority(name: string): number {
  const lower = name.toLowerCase();
  const parts = lower.split(/[\/,&]/).map((p) => p.trim()).filter(Boolean);
  for (const [key, val] of Object.entries(POPULAR)) {
    if (parts.some((p) => p === key || p.includes(key) || key.includes(p))) {
      return val.priority;
    }
  }
  return 999;
}

let cache: { data: any[]; ts: number; reservationType: string } | null = null;
const CACHE_TTL = 5 * 60 * 1000;
const DEFAULT_LIMIT = 24;

export async function GET(request: NextRequest) {
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(request.nextUrl.searchParams.get("limit") || String(DEFAULT_LIMIT)));
  const reservationTypeParam = request.nextUrl.searchParams.get("reservationType") || "verification";
  const reservationType =
    reservationTypeParam === "renewable" || reservationTypeParam === "nonrenewable"
      ? reservationTypeParam
      : "verification";

  try {
    if (
      !cache ||
      cache.reservationType !== reservationType ||
      Date.now() - cache.ts >= CACHE_TTL
    ) {
      const raw = await textverifiedClient.getServicesList({
        numberType: "mobile",
        reservationType,
      });
      const sorted = raw
        .map((s) => {
          const name = s.serviceName;
          return {
            code: name,
            name,
            logo: getLogo(name),
            available: null,
            priority: getPriority(name),
          };
        })
        .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
      cache = { data: sorted, ts: Date.now(), reservationType };
    }

    const total = cache.data.length;
    const start = (page - 1) * limit;
    return NextResponse.json({
      services: cache.data.slice(start, start + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("[textverified/services]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
