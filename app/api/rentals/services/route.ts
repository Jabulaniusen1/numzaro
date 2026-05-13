import { NextRequest, NextResponse } from "next/server";
import { textverifiedClient } from "@/lib/textverified/client";

const POPULAR: Record<string, { domain: string; priority: number }> = {
  "facebook":   { domain: "facebook.com",     priority: 1 },
  "instagram":  { domain: "instagram.com",    priority: 2 },
  "whatsapp":   { domain: "whatsapp.com",     priority: 3 },
  "tiktok":     { domain: "tiktok.com",       priority: 4 },
  "telegram":   { domain: "telegram.org",     priority: 5 },
  "snapchat":   { domain: "snapchat.com",     priority: 6 },
  "twitter":    { domain: "twitter.com",      priority: 7 },
  "x (twitter)":{ domain: "x.com",           priority: 7 },
  "discord":    { domain: "discord.com",      priority: 8 },
  "reddit":     { domain: "reddit.com",       priority: 9 },
  "linkedin":   { domain: "linkedin.com",     priority: 10 },
  "pinterest":  { domain: "pinterest.com",    priority: 11 },
  "twitch":     { domain: "twitch.tv",        priority: 12 },
  "youtube":    { domain: "youtube.com",      priority: 13 },
  "signal":     { domain: "signal.org",       priority: 14 },
  "viber":      { domain: "viber.com",        priority: 15 },
  "google":     { domain: "google.com",       priority: 40 },
  "gmail":      { domain: "gmail.com",        priority: 40 },
  "microsoft":  { domain: "microsoft.com",    priority: 41 },
  "apple":      { domain: "apple.com",        priority: 42 },
  "amazon":     { domain: "amazon.com",       priority: 43 },
  "netflix":    { domain: "netflix.com",      priority: 44 },
  "spotify":    { domain: "spotify.com",      priority: 45 },
  "uber":       { domain: "uber.com",         priority: 46 },
  "paypal":     { domain: "paypal.com",       priority: 48 },
  "steam":      { domain: "steampowered.com", priority: 50 },
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
    if (!cache || cache.reservationType !== reservationType || Date.now() - cache.ts >= CACHE_TTL) {
      const raw = await textverifiedClient.getServicesList({ numberType: "mobile", reservationType });
      const sorted = raw
        .map((s) => ({ code: s.serviceName, name: s.serviceName, logo: getLogo(s.serviceName), available: null, priority: getPriority(s.serviceName) }))
        .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
      cache = { data: sorted, ts: Date.now(), reservationType };
    }

    const total = cache.data.length;
    const start = (page - 1) * limit;
    return NextResponse.json({ services: cache.data.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("[rentals/services]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
