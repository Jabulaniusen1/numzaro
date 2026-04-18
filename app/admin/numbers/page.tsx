"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Loader2, Phone, Wallet, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  totalNumbers: number;
  activeNumbers: number;
  thisMonthRevenue: number;
  thisMonthCosts: number;
  thisMonthProfit: number;
  countryStats: Array<{ code: string; name: string; count: number }>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "violet",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color?: "violet" | "green" | "red" | "blue";
}) {
  const colors = {
    violet: { bg: "bg-violet-50 dark:bg-violet-900/20", icon: "text-violet-500" },
    green:  { bg: "bg-green-50 dark:bg-green-900/20",   icon: "text-green-500"  },
    red:    { bg: "bg-red-50 dark:bg-red-900/20",       icon: "text-red-500"    },
    blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",     icon: "text-blue-500"   },
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
    </div>
  );
}

export default function AdminNumbersPage() {
  const { toast } = useToast();
  const { format: formatCurrency, convert } = useCurrency();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/numbers/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      setStats(await response.json());
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load stats", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#7C5CFC]" />
      </div>
    );
  }

  if (!stats) return null;

  const profitMargin = stats.totalRevenue > 0
    ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={formatCurrency(convert(stats.totalRevenue))} icon={Wallet}      color="green"  />
        <StatCard label="Total Costs"   value={formatCurrency(convert(stats.totalCosts))}   icon={TrendingDown} color="red"    />
        <StatCard label="Total Profit"  value={formatCurrency(convert(stats.totalProfit))}  icon={TrendingUp}  color="violet" />
        <StatCard label="Profit Margin" value={`${profitMargin}%`}                          icon={BarChart3}   color="blue"   />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* This month */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">This Month</p>
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700/50">
            {[
              { label: "Revenue", value: formatCurrency(convert(stats.thisMonthRevenue)), color: "text-green-600 dark:text-green-400"  },
              { label: "Costs",   value: formatCurrency(convert(stats.thisMonthCosts)),   color: "text-red-600 dark:text-red-400"     },
              { label: "Profit",  value: formatCurrency(convert(stats.thisMonthProfit)),  color: "text-violet-600 dark:text-violet-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-2.5">
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className={cn("text-sm font-bold", color)}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Numbers overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Numbers Overview</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {[
              { label: "Total Numbers",  value: stats.totalNumbers },
              { label: "Active",         value: stats.activeNumbers },
              { label: "Inactive",       value: stats.totalNumbers - stats.activeNumbers },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2.5">
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#7C5CFC]" />
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* By country */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">By Country</p>
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
            {stats.countryStats.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No data</p>
            ) : stats.countryStats.map((country) => (
              <div key={country.code} className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{country.name}</span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100 ml-2 flex-shrink-0">{country.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
