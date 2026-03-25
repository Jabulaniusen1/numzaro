"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { ShoppingBag, Phone, Wifi, ArrowRight, Loader2, RefreshCw, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  {
    href: "/dashboard/services",
    icon: ShoppingBag,
    label: "Boost Socials",
    description: "Grow followers, likes & views",
    gradient: "from-violet-500 to-indigo-500",
  },
  {
    href: "/dashboard/numbers",
    icon: Phone,
    label: "Virtual Numbers",
    description: "One-time US verifications",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    href: "/dashboard/rentals",
    icon: Calendar,
    label: "Rental Numbers",
    description: "Long-term US rentals",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    href: "/dashboard/esim",
    icon: Wifi,
    label: "eSIM",
    description: "View and track your eSIM packages",
    gradient: "from-cyan-500 to-teal-500",
  },
];

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") return "text-green-600 bg-green-50 dark:bg-green-900/20";
  if (s === "in progress" || s === "partial") return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
  if (s === "pending") return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
  if (s === "cancelled" || s === "canceled") return "text-red-600 bg-red-50 dark:bg-red-900/20";
  return "text-gray-600 bg-gray-100 dark:bg-gray-700";
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { format, convert } = useCurrency();
  const [profile, setProfile] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(refreshOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast({ title: "Wallet funded!", description: "Your wallet has been credited." });
      window.dispatchEvent(new CustomEvent("balanceUpdated"));
      cleanUrl();
    } else if (payment === "failed") {
      toast({ title: "Payment failed", description: "Could not process payment.", variant: "destructive" });
      cleanUrl();
    } else if (payment === "error") {
      toast({ title: "Payment error", description: "An error occurred.", variant: "destructive" });
      cleanUrl();
    }
  }, [searchParams]);

  const cleanUrl = () => {
    const url = new URL(window.location.href);
    ["payment", "type", "reference"].forEach((p) => url.searchParams.delete(p));
    window.history.replaceState({}, "", url.toString());
  };

  const fetchData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();
    if (!userProfile) {
      const { data: newProfile } = await supabase.from("users").insert({
        id: user.id, email: user.email!, full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      }).select().single();
      userProfile = newProfile;
    }
    setProfile(userProfile);

    const { data: orders } = await supabase.from("orders").select("*, services(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
    setRecentOrders(orders || []);
    setLoading(false);
  };

  const refreshOrders = async () => {
    setRefreshing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRefreshing(false); return; }
    const { data: orders } = await supabase.from("orders").select("*, services(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
    setRecentOrders(orders || []);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋
            </p>
          </div>
          <div className="shrink-0 mt-1">
            <BalanceCard />
          </div>
        </div>

        {/* Quick Links — hero */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            What would you like to do?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {QUICK_LINKS.map(({ href, icon: Icon, label, description, gradient }) => (
              <Link key={href} href={href}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-[#7C5CFC] hover:shadow-lg hover:shadow-violet-100 dark:hover:shadow-violet-900/20 transition-all group cursor-pointer h-full">
                  <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4", gradient)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-100 group-hover:text-[#7C5CFC] transition-colors">{label}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-tight">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h2 className="font-bold text-gray-800 dark:text-gray-100">Recent Orders</h2>
              <p className="text-xs text-gray-400 mt-0.5">Your 5 latest orders</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshOrders}
                disabled={refreshing}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </button>
              <Link href="/dashboard/orders">
                <button className="text-xs text-[#7C5CFC] font-semibold hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400 mb-3">No orders yet</p>
              <Link href="/dashboard/services">
                <Button size="sm" className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl">
                  Browse Services
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {order.services?.name || "Service"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.quantity?.toLocaleString()} items · {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", statusColor(order.status))}>
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {format(convert(order.charge || 0))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
