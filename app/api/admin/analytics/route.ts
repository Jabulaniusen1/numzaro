import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type SourceType = "social_boost" | "number" | "esim";

interface BaseOrder {
  source: SourceType;
  amount: number;
  status: string;
  created_at: string;
}

type WindowKey = "24h" | "1d" | "1w" | "1m" | "6m" | "1y";

interface WindowConfig {
  key: WindowKey;
  label: string;
  rangeStart: Date;
  rangeEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

function toNumber(value: unknown): number {
  const parsed = parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(status: string | null | undefined): string {
  const s = String(status || "unknown").toLowerCase();
  if (["completed", "success", "successful", "delivered"].includes(s)) return "completed";
  if (["pending", "processing", "in_progress", "queued"].includes(s)) return "pending";
  if (["failed", "cancelled", "canceled", "refunded", "expired"].includes(s)) return "failed";
  return "other";
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function hourKey(date: Date): string {
  return date.toISOString().slice(0, 13);
}

function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function pctChange(current: number, prev: number): number {
  if (prev <= 0 && current <= 0) return 0;
  if (prev <= 0) return 100;
  return ((current - prev) / prev) * 100;
}

function parseWindow(windowParam: string | null): WindowKey {
  const v = (windowParam || "").toLowerCase().trim();
  if (v === "24h" || v === "1d" || v === "1w" || v === "1m" || v === "6m" || v === "1y") {
    return v;
  }
  return "1w";
}

function getWindowConfig(key: WindowKey, now: Date): WindowConfig {
  if (key === "24h") {
    const rangeEnd = now;
    const rangeStart = new Date(rangeEnd.getTime() - 24 * 60 * 60 * 1000);
    const previousEnd = rangeStart;
    const previousStart = new Date(previousEnd.getTime() - 24 * 60 * 60 * 1000);
    return { key, label: "Last 24 Hours", rangeStart, rangeEnd, previousStart, previousEnd };
  }

  if (key === "1d") {
    const rangeEnd = now;
    const rangeStart = startOfUtcDay(now);
    const previousEnd = rangeStart;
    const previousStart = new Date(previousEnd.getTime() - 24 * 60 * 60 * 1000);
    return { key, label: "Today (1D)", rangeStart, rangeEnd, previousStart, previousEnd };
  }

  if (key === "1w") {
    const rangeEnd = now;
    const rangeStart = new Date(rangeEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousEnd = rangeStart;
    const previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { key, label: "Last 1 Week", rangeStart, rangeEnd, previousStart, previousEnd };
  }

  if (key === "1m") {
    const rangeEnd = now;
    const rangeStart = new Date(rangeEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousEnd = rangeStart;
    const previousStart = new Date(previousEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { key, label: "Last 1 Month", rangeStart, rangeEnd, previousStart, previousEnd };
  }

  if (key === "6m") {
    const rangeEnd = now;
    const rangeStart = addMonths(rangeEnd, -6);
    const previousEnd = rangeStart;
    const previousStart = addMonths(previousEnd, -6);
    return { key, label: "Last 6 Months", rangeStart, rangeEnd, previousStart, previousEnd };
  }

  const rangeEnd = now;
  const rangeStart = addMonths(rangeEnd, -12);
  const previousEnd = rangeStart;
  const previousStart = addMonths(previousEnd, -12);
  return { key: "1y", label: "Last 1 Year", rangeStart, rangeEnd, previousStart, previousEnd };
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const now = new Date();
    const windowKey = parseWindow(request.nextUrl.searchParams.get("window"));
    const windowConfig = getWindowConfig(windowKey, now);

    const [socialResult, numberResult, esimResult, usersWindowResult, usersCountResult] = await Promise.all([
      supabase
        .from("orders")
        .select("charge, status, created_at")
        .gte("created_at", windowConfig.previousStart.toISOString()),
      supabase
        .from("number_purchases")
        .select("amount, status, created_at")
        .gte("created_at", windowConfig.previousStart.toISOString()),
      supabase
        .from("esim_orders")
        .select("charged_amount, status, created_at")
        .gte("created_at", windowConfig.previousStart.toISOString()),
      supabase
        .from("users")
        .select("created_at, country_name, country_code")
        .gte("created_at", windowConfig.previousStart.toISOString()),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true }),
    ]);

    if (
      socialResult.error ||
      numberResult.error ||
      esimResult.error ||
      usersWindowResult.error ||
      usersCountResult.error
    ) {
      console.error("Error fetching analytics data:", {
        social: socialResult.error,
        number: numberResult.error,
        esim: esimResult.error,
        usersWindow: usersWindowResult.error,
        usersCount: usersCountResult.error,
      });
      return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
    }

    const socialOrders: BaseOrder[] = (socialResult.data || []).map((order: any) => ({
      source: "social_boost",
      amount: toNumber(order.charge),
      status: order.status || "unknown",
      created_at: order.created_at,
    }));

    const numberOrders: BaseOrder[] = (numberResult.data || []).map((order: any) => ({
      source: "number",
      amount: toNumber(order.amount),
      status: order.status || "completed",
      created_at: order.created_at,
    }));

    const esimOrders: BaseOrder[] = (esimResult.data || []).map((order: any) => ({
      source: "esim",
      amount: toNumber(order.charged_amount),
      status: order.status || "pending",
      created_at: order.created_at,
    }));

    const allOrders = [...socialOrders, ...numberOrders, ...esimOrders];
    const inCurrentRange = (date: Date) =>
      date >= windowConfig.rangeStart && date <= windowConfig.rangeEnd;
    const inPreviousRange = (date: Date) =>
      date >= windowConfig.previousStart && date < windowConfig.previousEnd;

    const currentOrders = allOrders.filter((order) => inCurrentRange(new Date(order.created_at)));
    const previousOrders = allOrders.filter((order) => inPreviousRange(new Date(order.created_at)));

    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.amount, 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.amount, 0);
    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;
    const averageOrderValue = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;

    const bySource: Record<SourceType, { count: number; revenue: number }> = {
      social_boost: { count: 0, revenue: 0 },
      number: { count: 0, revenue: 0 },
      esim: { count: 0, revenue: 0 },
    };

    const statusCounts: Record<string, number> = {
      completed: 0,
      pending: 0,
      failed: 0,
      other: 0,
    };

    for (const order of currentOrders) {
      bySource[order.source].count += 1;
      bySource[order.source].revenue += order.amount;
      statusCounts[normalizeStatus(order.status)] += 1;
    }

    const usersWindowRows = usersWindowResult.data || [];
    const usersInSpan = usersWindowRows.map((u: any) => new Date(u.created_at));
    const totalUsers = usersCountResult.count || 0;
    const currentSignups = usersInSpan.filter((date) => inCurrentRange(date)).length;
    const previousSignups = usersInSpan.filter((date) => inPreviousRange(date)).length;
    const currentCountryMap = new Map<string, { country: string; code: string; count: number }>();

    for (const row of usersWindowRows as any[]) {
      const signupAt = new Date(row.created_at);
      if (!inCurrentRange(signupAt)) continue;
      const country = String(row.country_name || "Unknown");
      const code = String(row.country_code || "XX");
      const key = `${code}:${country}`;
      const existing = currentCountryMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        currentCountryMap.set(key, { country, code, count: 1 });
      }
    }

    const countryBreakdown = Array.from(currentCountryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        percentage: currentSignups > 0 ? Number(((item.count / currentSignups) * 100).toFixed(2)) : 0,
      }));

    const trendMap = new Map<
      string,
      { label: string; revenue: number; orders: number; signups: number }
    >();

    if (windowKey === "24h" || windowKey === "1d") {
      const base =
        windowKey === "1d"
          ? startOfUtcDay(windowConfig.rangeEnd)
          : new Date(windowConfig.rangeEnd.getTime() - 23 * 60 * 60 * 1000);

      for (let i = 0; i < 24; i++) {
        const slot = new Date(base.getTime() + i * 60 * 60 * 1000);
        const key = hourKey(slot);
        const label = slot.toLocaleTimeString("en-US", { hour: "numeric" });
        trendMap.set(key, { label, revenue: 0, orders: 0, signups: 0 });
      }

      for (const order of currentOrders) {
        const key = hourKey(new Date(order.created_at));
        const item = trendMap.get(key);
        if (!item) continue;
        item.orders += 1;
        item.revenue += order.amount;
      }

      for (const signupAt of usersInSpan) {
        if (!inCurrentRange(signupAt)) continue;
        const key = hourKey(signupAt);
        const item = trendMap.get(key);
        if (item) item.signups += 1;
      }
    } else if (windowKey === "6m" || windowKey === "1y") {
      const monthCount = windowKey === "6m" ? 6 : 12;
      const startMonth = new Date(windowConfig.rangeEnd);
      startMonth.setUTCDate(1);
      startMonth.setUTCHours(0, 0, 0, 0);
      startMonth.setUTCMonth(startMonth.getUTCMonth() - (monthCount - 1));

      for (let i = 0; i < monthCount; i++) {
        const slot = addMonths(startMonth, i);
        const key = monthKey(slot);
        const label = slot.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        trendMap.set(key, { label, revenue: 0, orders: 0, signups: 0 });
      }

      for (const order of currentOrders) {
        const key = monthKey(new Date(order.created_at));
        const item = trendMap.get(key);
        if (!item) continue;
        item.orders += 1;
        item.revenue += order.amount;
      }

      for (const signupAt of usersInSpan) {
        if (!inCurrentRange(signupAt)) continue;
        const key = monthKey(signupAt);
        const item = trendMap.get(key);
        if (item) item.signups += 1;
      }
    } else {
      const dayCount = windowKey === "1m" ? 30 : 7;
      const startDay = new Date(windowConfig.rangeEnd.getTime() - (dayCount - 1) * 24 * 60 * 60 * 1000);
      startDay.setUTCHours(0, 0, 0, 0);

      for (let i = 0; i < dayCount; i++) {
        const slot = new Date(startDay.getTime() + i * 24 * 60 * 60 * 1000);
        const key = dayKey(slot);
        const label = slot.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        trendMap.set(key, { label, revenue: 0, orders: 0, signups: 0 });
      }

      for (const order of currentOrders) {
        const key = dayKey(new Date(order.created_at));
        const item = trendMap.get(key);
        if (!item) continue;
        item.orders += 1;
        item.revenue += order.amount;
      }

      for (const signupAt of usersInSpan) {
        if (!inCurrentRange(signupAt)) continue;
        const key = dayKey(signupAt);
        const item = trendMap.get(key);
        if (item) item.signups += 1;
      }
    }

    const trend = Array.from(trendMap.entries()).map(([key, item]) => ({
      key,
      label: item.label,
      revenue: Number(item.revenue.toFixed(2)),
      orders: item.orders,
      signups: item.signups,
    }));

    return NextResponse.json({
      window: {
        key: windowConfig.key,
        label: windowConfig.label,
        rangeStart: windowConfig.rangeStart.toISOString(),
        rangeEnd: windowConfig.rangeEnd.toISOString(),
        previousStart: windowConfig.previousStart.toISOString(),
        previousEnd: windowConfig.previousEnd.toISOString(),
      },
      orderMetrics: {
        orders: currentOrderCount,
        previousOrders: previousOrderCount,
        revenue: Number(currentRevenue.toFixed(2)),
        previousRevenue: Number(previousRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        growthOrdersPct: Number(pctChange(currentOrderCount, previousOrderCount).toFixed(2)),
        growthRevenuePct: Number(pctChange(currentRevenue, previousRevenue).toFixed(2)),
      },
      userMetrics: {
        totalUsers,
        signups: currentSignups,
        previousSignups,
        growthSignupsPct: Number(pctChange(currentSignups, previousSignups).toFixed(2)),
        countryBreakdown,
      },
      bySource,
      statusCounts,
      trend,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
