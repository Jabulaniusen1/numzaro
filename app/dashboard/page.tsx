"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { 
  ShoppingBag, 
  Phone, 
  Package, 
  Bell, 
  Users, 
  Heart, 
  Eye, 
  MessageSquare,
  ArrowRight,
  TrendingUp
} from "lucide-react";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { format } = useCurrency();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceStats, setServiceStats] = useState<{ total: number }>({ total: 0 });

  useEffect(() => {
    fetchData();
    fetchServiceStats();
    
    // Auto-refresh orders every 30 seconds to update status
    const interval = setInterval(() => {
      refreshOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchServiceStats = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        const services = data.services || [];
        
        setServiceStats({
          total: services.length,
        });
      }
    } catch (error) {
      console.error("Error fetching service stats:", error);
    }
  };
  
  const refreshOrders = async () => {
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return;
    }

    // Get recent orders
    const { data: orders } = await supabase
      .from("orders")
      .select("*, services(name)")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    setRecentOrders(orders || []);
  };

  useEffect(() => {
    const payment = searchParams.get("payment");
    const reference = searchParams.get("reference");
    const type = searchParams.get("type");

    // Only handle payment success/failure from redirects (legacy flow)
    // Popup payments handle their own success/failure in the callback
    if (payment === "success") {
      if (type === "wallet") {
        toast({
          title: "Wallet funded successfully!",
          description: "Your wallet has been credited. You can now place orders.",
        });
        // Trigger balance refresh event instead of reloading
        window.dispatchEvent(new CustomEvent("balanceUpdated"));
        // Clean up URL params to prevent re-triggering
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("payment");
          url.searchParams.delete("type");
          url.searchParams.delete("reference");
          window.history.replaceState({}, "", url.toString());
        }
      }
    } else if (payment === "failed") {
      toast({
        title: "Payment failed",
        description: "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
      // Clean up URL params
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("payment");
        url.searchParams.delete("reference");
        window.history.replaceState({}, "", url.toString());
      }
    } else if (payment === "error") {
      toast({
        title: "Payment error",
        description: "An error occurred during payment processing.",
        variant: "destructive",
      });
      // Clean up URL params
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("payment");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [searchParams, toast]);

  const fetchData = async () => {
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return;
    }

    setUser(currentUser);

    // Get user profile - create if it doesn't exist
    let { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }

    // Create user profile if it doesn't exist
    if (!userProfile && !profileError) {
      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .insert({
          id: currentUser.id,
          email: currentUser.email!,
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating user profile:", insertError);
      } else {
        userProfile = newProfile;
      }
    }

    setProfile(userProfile);

    // Get recent orders
    const { data: orders } = await supabase
      .from("orders")
      .select("*, services(name)")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentOrders(orders || []);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-purple-500/10 dark:from-primary/20 dark:via-secondary/20 dark:to-purple-500/20 rounded-2xl blur-xl"></div>
        <div className="relative p-6 rounded-2xl border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-white/80 to-purple-50/80 dark:from-gray-900/80 dark:to-purple-950/80 backdrop-blur-sm">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-primary/80 dark:text-primary/70 mt-2 font-medium">
            Welcome back, {profile?.full_name || user?.email}!
          </p>
        </div>
      </div>

      <BalanceCard />

      {/* Quick Access Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/services">
            <Card className="hover:shadow-xl transition-all cursor-pointer h-full border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:scale-105">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="mt-2 text-blue-900 dark:text-blue-100">All Services</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  {serviceStats.total > 0 
                    ? `${serviceStats.total} services available`
                    : "Browse all services"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/numbers">
            <Card className="hover:shadow-xl transition-all cursor-pointer h-full border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:scale-105">
          <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="mt-2 text-green-900 dark:text-green-100">Virtual Numbers</CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Get phone numbers from 100+ countries
                </CardDescription>
          </CardHeader>
            </Card>
            </Link>

            <Link href="/dashboard/orders">
            <Card className="hover:shadow-xl transition-all cursor-pointer h-full border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 hover:scale-105">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="mt-2 text-purple-900 dark:text-purple-100">Orders</CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">
                  View and manage your orders
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/notifications">
            <Card className="hover:shadow-xl transition-all cursor-pointer h-full border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 hover:scale-105">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="mt-2 text-orange-900 dark:text-orange-100">Notifications</CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">
                  View your notifications
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-purple-900 dark:text-purple-100">Recent Orders</CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">Your latest orders</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshOrders}
                className="text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900"
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center p-3 border-2 border-purple-100 dark:border-purple-900 rounded-lg bg-white/60 dark:bg-gray-800/60 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100">
                        {order.services?.name || "Service"}
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {order.quantity} items • {order.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-purple-900 dark:text-purple-100">{format(order.charge || 0)}</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-purple-700 dark:text-purple-300 text-center py-4">
                No orders yet.{" "}
                <Link
                  href="/dashboard/services"
                  className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  Browse services
                </Link>{" "}
                to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
