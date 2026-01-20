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
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [serviceStats, setServiceStats] = useState<{ total: number; categories: Record<string, number> }>({ total: 0, categories: {} });

  useEffect(() => {
    fetchData();
    fetchServiceCategories();
    
    // Auto-refresh orders every 30 seconds to update status
    const interval = setInterval(() => {
      refreshOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchServiceCategories = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        const categories = data.filters?.categories || [];
        const services = data.services || [];
        
        // Count services per category
        const categoryCounts: Record<string, number> = {};
        services.forEach((service: any) => {
          if (service.category) {
            categoryCounts[service.category] = (categoryCounts[service.category] || 0) + 1;
          }
        });
        
        setServiceCategories(categories);
        setServiceStats({
          total: services.length,
          categories: categoryCounts,
        });
      }
    } catch (error) {
      console.error("Error fetching service categories:", error);
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
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {profile?.full_name || user?.email}!
        </p>
      </div>

      <BalanceCard />

      {/* Quick Access Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/services">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <ShoppingBag className="h-8 w-8 text-blue-600" />
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="mt-2">All Services</CardTitle>
                <CardDescription>
                  {serviceStats.total > 0 
                    ? `${serviceStats.total} services available`
                    : "Browse all services"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/numbers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
          <CardHeader>
                <div className="flex items-center justify-between">
                  <Phone className="h-8 w-8 text-green-600" />
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="mt-2">Virtual Numbers</CardTitle>
                <CardDescription>
                  Get phone numbers from 100+ countries
                </CardDescription>
          </CardHeader>
            </Card>
            </Link>

            <Link href="/dashboard/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8 text-purple-600" />
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="mt-2">Orders</CardTitle>
                <CardDescription>
                  View and manage your orders
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/notifications">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Bell className="h-8 w-8 text-orange-600" />
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="mt-2">Notifications</CardTitle>
                <CardDescription>
                  View your notifications
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Service Categories */}
      {serviceCategories.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Service Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceCategories.slice(0, 6).map((category) => (
              <Link 
                key={category} 
                href={`/dashboard/services?category=${encodeURIComponent(category)}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{category}</CardTitle>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <CardDescription>
                      {serviceStats.categories[category] || 0} services
                    </CardDescription>
                  </CardHeader>
                </Card>
            </Link>
            ))}
            {serviceCategories.length > 6 && (
              <Link href="/dashboard/services">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-dashed">
                  <CardHeader>
                    <div className="flex items-center justify-center h-full py-4">
                      <CardTitle className="text-lg text-gray-500">
                        View All Categories
                      </CardTitle>
                    </div>
                  </CardHeader>
        </Card>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">

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
                      <p className="font-medium">{format(order.charge || 0)}</p>
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
