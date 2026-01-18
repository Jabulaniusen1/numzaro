"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";

interface Stats {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  totalOrders: number;
  thisMonthRevenue: number;
  thisMonthProfit: number;
  lastMonthRevenue: number;
  lastMonthProfit: number;
  recentOrders: any[];
}

export default function AdminPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [markup, setMarkup] = useState<number>(30);
  const [markupInput, setMarkupInput] = useState("30");
  const [updatingMarkup, setUpdatingMarkup] = useState(false);
  const [apiBalance, setApiBalance] = useState<string | null>(null);
  const [apiBalanceOriginal, setApiBalanceOriginal] = useState<string | null>(null);
  const [apiBalanceCurrency, setApiBalanceCurrency] = useState<string>("USD");
  const [originalCurrency, setOriginalCurrency] = useState<string>("NGN");
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "NGN">("USD");
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [syncingServices, setSyncingServices] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchMarkup();
    fetchApiBalance();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkup = async () => {
    try {
      const response = await fetch("/api/admin/markup");
      if (response.ok) {
        const data = await response.json();
        setMarkup(data.markupPercentage);
        setMarkupInput(data.markupPercentage.toString());
      }
    } catch (error) {
      console.error("Error fetching markup:", error);
    }
  };

  const fetchApiBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await fetch("/api/admin/balance");
      if (response.ok) {
        const data = await response.json();
        setApiBalance(data.balance || "0.00");
        setApiBalanceOriginal(data.originalBalance || data.balance || "0.00");
        setApiBalanceCurrency(data.currency || "USD");
        setOriginalCurrency(data.originalCurrency || "NGN");
      } else {
        setApiBalance("0.00");
        setApiBalanceOriginal("0.00");
        setApiBalanceCurrency("USD");
        setOriginalCurrency("NGN");
      }
    } catch (error) {
      console.error("Error fetching API balance:", error);
      setApiBalance("0.00");
      setApiBalanceOriginal("0.00");
      setApiBalanceCurrency("USD");
      setOriginalCurrency("NGN");
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleUpdateMarkup = async () => {
    const newMarkup = parseFloat(markupInput);
    if (isNaN(newMarkup) || newMarkup < 0) {
      toast({
        title: "Invalid markup",
        description: "Please enter a valid percentage",
        variant: "destructive",
      });
      return;
    }

    setUpdatingMarkup(true);
    try {
      const response = await fetch("/api/admin/markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markupPercentage: newMarkup }),
      });

      if (response.ok) {
        setMarkup(newMarkup);
        toast({
          title: "Markup updated",
          description: `Markup set to ${newMarkup}%. Services will be updated on next sync.`,
        });
        fetchStats(); // Refresh stats
      } else {
        throw new Error("Failed to update markup");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update markup",
        variant: "destructive",
      });
    } finally {
      setUpdatingMarkup(false);
    }
  };

  const handleSyncServices = async () => {
    setSyncingServices(true);
    try {
      const response = await fetch("/api/admin/services/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Services synced",
          description: `Successfully synced ${data.count || 0} services from SHOPRIME API.`,
        });
      } else {
        throw new Error(data.error || data.details || "Failed to sync services");
      }
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncingServices(false);
    }
  };

  const revenueChange =
    stats && stats.lastMonthRevenue > 0
      ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
      : 0;
  const profitChange =
    stats && stats.lastMonthProfit > 0
      ? ((stats.thisMonthProfit - stats.lastMonthProfit) / stats.lastMonthProfit) * 100
      : 0;

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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor profits and manage settings</p>
      </div>

      {/* API Balance Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-900">API Account Balance</CardTitle>
              <CardDescription className="text-blue-700">
                Your therealowlet.com account balance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700 font-medium">Currency:</span>
              <div className="flex border border-blue-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setDisplayCurrency("USD")}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    displayCurrency === "USD"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setDisplayCurrency("NGN")}
                  className={`px-3 py-1 text-sm font-medium transition-colors border-l border-blue-300 ${
                    displayCurrency === "NGN"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  NGN (₦)
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <p className="text-2xl font-bold text-blue-900">Loading...</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-900">
                    {displayCurrency === "USD" ? "$" : "₦"}
                    {displayCurrency === "USD"
                      ? parseFloat(apiBalance || "0").toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : parseFloat(apiBalanceOriginal || "0").toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </p>
                  {displayCurrency === "USD" && apiBalanceOriginal && (
                    <p className="text-sm text-blue-700 mt-1">
                      {parseFloat(apiBalanceOriginal || "0").toLocaleString()} {originalCurrency}
                    </p>
                  )}
                  {displayCurrency === "NGN" && apiBalance && (
                    <p className="text-sm text-blue-700 mt-1">
                      ${parseFloat(apiBalance || "0").toFixed(2)} USD
                    </p>
                  )}
                </div>
                <Button onClick={fetchApiBalance} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services Sync */}
      <Card>
        <CardHeader>
          <CardTitle>Services Management</CardTitle>
          <CardDescription>Sync services from SHOPRIME API to database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Fetch the latest services from SHOPRIME API and sync them to the database.
                Users will see services from the database.
              </p>
              <p className="text-xs text-gray-500">
                Services are fetched from the API, markup is applied, and stored in the database.
              </p>
            </div>
            <Button 
              onClick={handleSyncServices} 
              disabled={syncingServices}
              className="ml-4"
            >
              {syncingServices ? "Syncing..." : "Sync Services"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Markup Control */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Markup Settings</CardTitle>
          <CardDescription>Control the profit margin percentage for all services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="markup">Markup Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="markup"
                  type="number"
                  min="0"
                  step="0.1"
                  value={markupInput}
                  onChange={(e) => setMarkupInput(e.target.value)}
                  className="w-32"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="text-sm text-gray-500">
                Current markup: {markup}% | Example: $1.00 API cost = ${(1 * (1 + markup / 100)).toFixed(2)} customer price
              </p>
            </div>
            <Button onClick={handleUpdateMarkup} disabled={updatingMarkup}>
              {updatingMarkup ? "Updating..." : "Update Markup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats?.totalRevenue.toFixed(2) || "0.00"}</div>
            <p className="text-sm text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ${stats?.totalCosts.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-gray-600 mt-1">API costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${stats?.totalProfit.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-gray-600 mt-1">Net profit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-sm text-gray-600 mt-1">All orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
            <CardDescription>
              {revenueChange !== 0 && (
                <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                  {revenueChange >= 0 ? "+" : ""}
                  {revenueChange.toFixed(1)}% from last month
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-bold">${stats?.thisMonthRevenue.toFixed(2) || "0.00"}</div>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${stats?.thisMonthProfit.toFixed(2) || "0.00"}
              </div>
              <p className="text-sm text-gray-600">Profit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-bold">${stats?.lastMonthRevenue.toFixed(2) || "0.00"}</div>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${stats?.lastMonthProfit.toFixed(2) || "0.00"}
              </div>
              <p className="text-sm text-gray-600">Profit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders with profit data</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {order.services?.name || "Service"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.users?.email || order.users?.full_name || "User"}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.quantity.toLocaleString()} items
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="font-medium">
                          ${parseFloat(order.customer_charge || order.charge || "0").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Profit</p>
                        <p className="font-medium text-green-600">
                          ${parseFloat(order.profit || "0").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

