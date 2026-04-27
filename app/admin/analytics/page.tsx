"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsPayload {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  ordersToday: number;
  revenueToday: number;
  thisWeekOrders: number;
  lastWeekOrders: number;
  thisWeekRevenue: number;
  lastWeekRevenue: number;
  bySource: {
    social_boost: { count: number; revenue: number };
    number: { count: number; revenue: number };
    esim: { count: number; revenue: number };
  };
  statusCounts: {
    completed: number;
    pending: number;
    failed: number;
    other: number;
  };
  dailyTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "violet",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: "violet" | "green" | "blue" | "amber";
}) {
  const colors = {
    violet: { bg: "bg-violet-50 dark:bg-violet-900/20", icon: "text-violet-500" },
    green: { bg: "bg-green-50 dark:bg-green-900/20", icon: "text-green-500" },
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-500" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-500" },
  };

  const c = colors[color];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", c.bg)}>
          <Icon className={cn("h-4 w-4", c.icon)} />
        </div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      {sub ? <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{sub}</p> : null}
    </div>
  );
}

function pctChange(current: number, prev: number) {
  if (prev <= 0 && current <= 0) return 0;
  if (prev <= 0) return 100;
  return ((current - prev) / prev) * 100;
}

export default function AdminAnalyticsPage() {
  const { toast } = useToast();
  const { format, convert } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  const fetchAnalytics = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/admin/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      setData(await response.json());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const trendRevenueMax = useMemo(() => {
    if (!data?.dailyTrend?.length) return 1;
    const max = Math.max(...data.dailyTrend.map((item) => item.revenue));
    return max > 0 ? max : 1;
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-[#7C5CFC]" />
      </div>
    );
  }

  if (!data) return null;

  const orderGrowth = pctChange(data.thisWeekOrders, data.lastWeekOrders);
  const revenueGrowth = pctChange(data.thisWeekRevenue, data.lastWeekRevenue);
  const totalSourceCount =
    data.bySource.social_boost.count + data.bySource.number.count + data.bySource.esim.count;
  const statusTotal =
    data.statusCounts.completed +
    data.statusCounts.pending +
    data.statusCounts.failed +
    data.statusCounts.other;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Site Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Live performance snapshot across social boosts, numbers, and eSIM orders.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fetchAnalytics({ silent: true })}
          disabled={refreshing}
          className="rounded-xl"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-2", refreshing ? "animate-spin" : "")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Revenue"
          value={format(convert(data.totalRevenue))}
          sub={`Today: ${format(convert(data.revenueToday))}`}
          icon={Wallet}
          color="green"
        />
        <StatCard
          label="Total Orders"
          value={data.totalOrders.toLocaleString()}
          sub={`Today: ${data.ordersToday.toLocaleString()}`}
          icon={Package}
          color="violet"
        />
        <StatCard
          label="Avg. Order Value"
          value={format(convert(data.averageOrderValue))}
          sub="Across all order sources"
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          label="This Week Orders"
          value={data.thisWeekOrders.toLocaleString()}
          sub={`Last week: ${data.lastWeekOrders.toLocaleString()}`}
          icon={CalendarDays}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Revenue Trend (14 Days)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Each bar shows daily revenue</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(revenueGrowth).toFixed(1)}% vs last week
            </div>
          </div>

          <div className="h-52 flex items-end gap-1.5">
            {data.dailyTrend.map((point) => {
              const height = Math.max(8, Math.round((point.revenue / trendRevenueMax) * 100));
              return (
                <div key={point.date} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#7C5CFC] to-[#A893FF]"
                    style={{ height: `${height}%` }}
                    title={`${point.date}: ${format(convert(point.revenue))} • ${point.orders} orders`}
                  />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-full">
                    {new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Source Breakdown</p>
          <div className="space-y-3">
            {[
              {
                key: "social_boost",
                label: "Social Boost",
                color: "bg-violet-500",
                count: data.bySource.social_boost.count,
                revenue: data.bySource.social_boost.revenue,
              },
              {
                key: "number",
                label: "Numbers",
                color: "bg-blue-500",
                count: data.bySource.number.count,
                revenue: data.bySource.number.revenue,
              },
              {
                key: "esim",
                label: "eSIM",
                color: "bg-emerald-500",
                count: data.bySource.esim.count,
                revenue: data.bySource.esim.revenue,
              },
            ].map((item) => {
              const pct = totalSourceCount > 0 ? (item.count / totalSourceCount) * 100 : 0;
              return (
                <div key={item.key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm text-gray-700 dark:text-gray-200">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.count} orders • {format(convert(item.revenue))}
                    </p>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className={cn("h-full rounded-full", item.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Order Status Mix</p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              {orderGrowth >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(orderGrowth).toFixed(1)}% orders vs last week
            </div>
          </div>

          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex">
            {[
              { key: "completed", className: "bg-green-500", value: data.statusCounts.completed },
              { key: "pending", className: "bg-amber-500", value: data.statusCounts.pending },
              { key: "failed", className: "bg-red-500", value: data.statusCounts.failed },
              { key: "other", className: "bg-gray-500", value: data.statusCounts.other },
            ].map((item) => {
              const pct = statusTotal > 0 ? (item.value / statusTotal) * 100 : 0;
              return <div key={item.key} className={item.className} style={{ width: `${pct}%` }} />;
            })}
          </div>

          <div className="mt-4 space-y-2">
            {[
              { label: "Completed", value: data.statusCounts.completed, className: "text-green-600 dark:text-green-400" },
              { label: "Pending", value: data.statusCounts.pending, className: "text-amber-600 dark:text-amber-400" },
              { label: "Failed / Refunded", value: data.statusCounts.failed, className: "text-red-600 dark:text-red-400" },
              { label: "Other", value: data.statusCounts.other, className: "text-gray-600 dark:text-gray-300" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className={cn("font-semibold", item.className)}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Quick Insights</p>
          <div className="space-y-3">
            {[
              {
                label: "Weekly Revenue",
                value: `${format(convert(data.thisWeekRevenue))} this week`,
                sub: `${format(convert(data.lastWeekRevenue))} last week`,
              },
              {
                label: "Weekly Orders",
                value: `${data.thisWeekOrders.toLocaleString()} this week`,
                sub: `${data.lastWeekOrders.toLocaleString()} last week`,
              },
              {
                label: "Best Performing Source",
                value:
                  data.bySource.social_boost.revenue >= data.bySource.number.revenue &&
                  data.bySource.social_boost.revenue >= data.bySource.esim.revenue
                    ? "Social Boost"
                    : data.bySource.number.revenue >= data.bySource.esim.revenue
                    ? "Numbers"
                    : "eSIM",
                sub: "Based on revenue",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-100 dark:border-gray-700/70 bg-gray-50/70 dark:bg-gray-900/30 px-3.5 py-3"
              >
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">{item.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

