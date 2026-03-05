
import { NextRequest, NextResponse } from "next/server";
import { smsPoolClient } from "@/lib/smspool/client";

const FLAG_MAP: Record<string, string> = {
  "United States": "🇺🇸", "Canada": "🇨🇦", "United Kingdom": "🇬🇧", "UK": "🇬🇧",
  "France": "🇫🇷", "Germany": "🇩🇪", "Italy": "🇮🇹", "Spain": "🇪🇸",
  "Australia": "🇦🇺", "Netherlands": "🇳🇱", "Poland": "🇵🇱",
  "Mexico": "🇲🇽", "Brazil": "🇧🇷", "Indonesia": "🇮🇩", "Philippines": "🇵🇭",
  "Hong Kong": "🇭🇰", "Japan": "🇯🇵", "Singapore": "🇸🇬", "Romania": "🇷🇴",
  "Russia": "🇷🇺", "India": "🇮🇳", "China": "🇨🇳", "South Korea": "🇰🇷",
  "Vietnam": "🇻🇳", "Nigeria": "🇳🇬", "Turkey": "🇹🇷", "Sweden": "🇸🇪",
};

function getFlag(name: string): string {
  const n = name.trim();
  for (const [key, flag] of Object.entries(FLAG_MAP)) {
    if (n === key || n.includes(key) || key.includes(n)) return flag;
  }
  return "🌍";
}

// Popular services: name fragment (lowercase) → domain + sort priority
// Priority 1–99 = popular (shown first), 100+ = everything else
const POPULAR: Record<string, { domain: string; priority: number }> = {
  // Social Media
  "facebook":      { domain: "facebook.com",       priority: 1  },
  "instagram":     { domain: "instagram.com",       priority: 2  },
  "whatsapp":      { domain: "whatsapp.com",        priority: 3  },
  "tiktok":        { domain: "tiktok.com",          priority: 4  },
  "telegram":      { domain: "telegram.org",        priority: 5  },
  "snapchat":      { domain: "snapchat.com",        priority: 6  },
  "twitter":       { domain: "twitter.com",         priority: 7  },
  "x (twitter)":   { domain: "x.com",              priority: 7  },
  "discord":       { domain: "discord.com",         priority: 8  },
  "reddit":        { domain: "reddit.com",          priority: 9  },
  "linkedin":      { domain: "linkedin.com",        priority: 10 },
  "pinterest":     { domain: "pinterest.com",       priority: 11 },
  "twitch":        { domain: "twitch.tv",           priority: 12 },
  "youtube":       { domain: "youtube.com",         priority: 13 },
  "signal":        { domain: "signal.org",          priority: 14 },
  "viber":         { domain: "viber.com",           priority: 15 },
  "wechat":        { domain: "wechat.com",          priority: 16 },
  "line":          { domain: "line.me",             priority: 17 },
  "skype":         { domain: "skype.com",           priority: 18 },
  "clubhouse":     { domain: "clubhouse.com",       priority: 19 },
  // Dating
  "tinder":        { domain: "tinder.com",          priority: 20 },
  "bumble":        { domain: "bumble.com",          priority: 21 },
  "hinge":         { domain: "hinge.co",            priority: 22 },
  "okcupid":       { domain: "okcupid.com",         priority: 23 },
  "match":         { domain: "match.com",           priority: 24 },
  "plenty of fish":{ domain: "pof.com",             priority: 25 },
  "pof":           { domain: "pof.com",             priority: 25 },
  "badoo":         { domain: "badoo.com",           priority: 26 },
  "grindr":        { domain: "grindr.com",          priority: 27 },
  "zoosk":         { domain: "zoosk.com",           priority: 28 },
  "meetme":        { domain: "meetme.com",          priority: 29 },
  "lovoo":         { domain: "lovoo.com",           priority: 30 },
  "tagged":        { domain: "tagged.com",          priority: 31 },
  "happn":         { domain: "happn.com",           priority: 32 },
  // Tech / Services
  "google":        { domain: "google.com",          priority: 40 },
  "gmail":         { domain: "gmail.com",           priority: 40 },
  "microsoft":     { domain: "microsoft.com",       priority: 41 },
  "apple":         { domain: "apple.com",           priority: 42 },
  "amazon":        { domain: "amazon.com",          priority: 43 },
  "netflix":       { domain: "netflix.com",         priority: 44 },
  "spotify":       { domain: "spotify.com",         priority: 45 },
  "uber":          { domain: "uber.com",            priority: 46 },
  "lyft":          { domain: "lyft.com",            priority: 47 },
  "paypal":        { domain: "paypal.com",          priority: 48 },
  "airbnb":        { domain: "airbnb.com",          priority: 49 },
  "steam":         { domain: "steampowered.com",    priority: 50 },
  "roblox":        { domain: "roblox.com",          priority: 51 },
  "zoom":          { domain: "zoom.us",             priority: 52 },
  "ebay":          { domain: "ebay.com",            priority: 53 },
  "alibaba":       { domain: "alibaba.com",         priority: 54 },
  "aliexpress":    { domain: "aliexpress.com",      priority: 55 },
  "shein":         { domain: "shein.com",           priority: 56 },
  "doordash":      { domain: "doordash.com",        priority: 57 },
  "uber eats":     { domain: "ubereats.com",        priority: 58 },
  "grubhub":       { domain: "grubhub.com",         priority: 59 },
  "coinbase":      { domain: "coinbase.com",        priority: 60 },
  "binance":       { domain: "binance.com",         priority: 61 },
};

function getLogo(name: string): string | null {
  const lower = name.toLowerCase();
  // Split compound names like "Google/Gmail", "TikTok/Douyin", "Instagram / Threads"
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

// Full cache (sorted, with logos)
let activationCache: { data: any[]; ts: number } | null = null;
let rentalCache: { data: any[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;
const DEFAULT_LIMIT = 24;

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") || "activation";
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(request.nextUrl.searchParams.get("limit") || String(DEFAULT_LIMIT)));

  try {
    if (mode === "rental") {
      if (!rentalCache || Date.now() - rentalCache.ts >= CACHE_TTL) {
        const result = await smsPoolClient.getRentals(true);
        if (!result.success || !Array.isArray(result.data)) {
          return NextResponse.json({ error: "Failed to fetch rentals" }, { status: 500 });
        }
        const sorted = result.data
          .map((r) => {
            const pricingEntries = Object.entries(r.pricing).map(([d, p]) => ({ days: parseInt(d), price: p as number }));
            const minOption = pricingEntries.reduce((a, b) => a.price < b.price ? a : b);
            const displayName = r.tag || r.name;
            return {
              code: String(r.ID),
              name: displayName,
              logo: null,
              flag: getFlag(displayName),
              available: null,
              startingPrice: minOption.price,
              pricing: r.pricing,
              priority: getPriority(r.name),
            };
          })
          .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
        rentalCache = { data: sorted, ts: Date.now() };
      }

      const total = rentalCache.data.length;
      const start = (page - 1) * limit;
      return NextResponse.json({
        services: rentalCache.data.slice(start, start + limit),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Activation mode
    if (!activationCache || Date.now() - activationCache.ts >= CACHE_TTL) {
      const raw = await smsPoolClient.getServices();
      if (!Array.isArray(raw)) {
        return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
      }
      const sorted = raw
        .map((s) => ({
          code: String(s.ID),
          name: s.name,
          logo: getLogo(s.name),
          available: null,
          priority: getPriority(s.name),
        }))
        .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
      activationCache = { data: sorted, ts: Date.now() };
    }

    const total = activationCache.data.length;
    const start = (page - 1) * limit;
    return NextResponse.json({
      services: activationCache.data.slice(start, start + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("[smspool/services]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
