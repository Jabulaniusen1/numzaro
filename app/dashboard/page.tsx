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

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { format } = useCurrency();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh orders every 30 seconds to update status
    const interval = setInterval(() => {
      refreshOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
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
        <p className="text-purple-800 dark:text-purple-200 font-bold text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent drop-shadow-lg">
          🎨 Dashboard
        </h1>
        <p className="text-purple-800 dark:text-purple-200 mt-2 text-lg font-semibold">
          Welcome back, {profile?.full_name || user?.email}! 👋
        </p>
      </div>

      <BalanceCard />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-4 border-pink-400 dark:border-pink-600 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/50 dark:via-purple-900/50 dark:to-blue-900/50 rounded-cartoon shadow-xl">
          <CardHeader>
            <CardTitle className="text-purple-900 dark:text-purple-100 text-2xl">⚡ Quick Actions</CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-300 font-semibold">Get started with services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/services">
              <Button className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white rounded-cartoon border-2 border-white font-bold shadow-lg">
                🎯 Browse Services
              </Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button className="w-full border-4 border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-cartoon font-bold" variant="outline">
                📦 View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-4 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 dark:from-purple-900/50 dark:via-pink-900/50 dark:to-yellow-900/50 rounded-cartoon shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-purple-900 dark:text-purple-100 text-2xl">📋 Recent Orders</CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300 font-semibold">Your latest orders</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshOrders}
                className="text-xs border-2 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-cartoon font-bold"
              >
                🔄 Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center p-3 border-4 border-purple-300 dark:border-purple-700 rounded-cartoon bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 hover:shadow-lg transition-all"
                  >
                    <div>
                      <p className="font-bold text-purple-900 dark:text-purple-100">
                        {order.services?.name || "Service"}
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 font-semibold">
                        {order.quantity} items • {order.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-900 dark:text-purple-100">{format(order.charge || 0)}</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 font-semibold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-purple-800 dark:text-purple-200 text-center py-4 font-semibold">
                No orders yet.{" "}
                <Link
                  href="/dashboard/services"
                  className="text-pink-600 dark:text-pink-400 hover:text-purple-600 dark:hover:text-purple-400 underline font-bold"
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
