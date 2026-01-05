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
    
    if (orders && orders.length > 0) {
      // Update status for pending/in-progress orders by polling the API
      const pendingOrders = orders.filter(
        (o: any) => o.status === "Pending" || o.status === "In Progress" || o.status === "Partial"
      );
      
      if (pendingOrders.length > 0) {
        try {
          // Use batch status endpoint to update multiple orders at once
          const orderIds = pendingOrders
            .map((o: any) => o.exosupplier_order_id)
            .filter((id: any) => id);
          
          if (orderIds.length > 0) {
            const response = await fetch("/api/orders/batch-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_ids: orderIds }),
            });
            
            if (response.ok) {
              // Re-fetch orders to get updated status
              const { data: updatedOrders } = await supabase
                .from("orders")
                .select("*, services(name)")
                .eq("user_id", currentUser.id)
                .order("created_at", { ascending: false })
                .limit(5);
              setRecentOrders(updatedOrders || []);
              return;
            }
          }
        } catch (error) {
          console.error("Error updating order statuses:", error);
        }
      }
    }
    
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
      } else {
        toast({
          title: "Payment successful!",
          description: "Your order has been created and is being processed.",
        });
        // Clean up URL params
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("payment");
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
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {profile?.full_name || user?.email}!
        </p>
      </div>

      <BalanceCard />

      {/* Important Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">⚠️ Important Information</CardTitle>
          <CardDescription className="text-blue-700">
            Please read these guidelines before placing an order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <p className="font-semibold text-sm text-gray-900 mb-1">
                1. Complete Previous Orders First
              </p>
              <p className="text-sm text-gray-700">
                If you have purchased TikTok followers already and want to purchase again, make sure your previous order is completed already!
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <p className="font-semibold text-sm text-gray-900 mb-1">
                2. TikTok Account Requirements
              </p>
              <p className="text-sm text-gray-700">
                Make sure the TikTok account is not private, and don't change the account's username while followers are being added!
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <p className="font-semibold text-sm text-gray-900 mb-1">
                3. Follower Retention
              </p>
              <p className="text-sm text-gray-700">
                Almost no drop in followers!
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <p className="font-semibold text-sm text-gray-900 mb-1">
                4. Average Quality Service
              </p>
              <p className="text-sm text-gray-700">
                Average quality means a shorter guarantee length, semi-real looking accounts/engagements, and average drops.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with SocialBoost</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/services">
              <Button className="w-full">Browse Services</Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button className="w-full" variant="outline">
                View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest orders</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshOrders}
                className="text-xs"
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
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {order.services?.name || "Service"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.quantity} items • {order.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{format(order.charge || order.customer_charge || 0)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">
                No orders yet.{" "}
                <Link
                  href="/dashboard/services"
                  className="text-[#1877F2] hover:underline"
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
