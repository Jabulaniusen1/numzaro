"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import Link from "next/link";
import { Users, Phone, Loader2 } from "lucide-react";

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
  const [phoneMarkup, setPhoneMarkup] = useState<number>(400);
  const [phoneMarkupInput, setPhoneMarkupInput] = useState("400");
  const [updatingPhoneMarkup, setUpdatingPhoneMarkup] = useState(false);
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
    fetchPhoneMarkup();
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

  const fetchPhoneMarkup = async () => {
    try {
      const response = await fetch("/api/admin/numbers/markup");
      if (response.ok) {
        const data = await response.json();
        setPhoneMarkup(data.markupPercentage);
        setPhoneMarkupInput(data.markupPercentage.toString());
      }
    } catch (error) {
      console.error("Error fetching phone numbers markup:", error);
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

  const handleUpdatePhoneMarkup = async () => {
    const newMarkup = parseFloat(phoneMarkupInput);
    if (isNaN(newMarkup) || newMarkup < 0) {
      toast({
        title: "Invalid markup",
        description: "Please enter a valid percentage",
        variant: "destructive",
      });
      return;
    }

    setUpdatingPhoneMarkup(true);
    try {
      const response = await fetch("/api/admin/numbers/markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markupPercentage: newMarkup }),
      });

      if (response.ok) {
        setPhoneMarkup(newMarkup);
        toast({
          title: "Phone Numbers Markup updated",
          description: `Markup set to ${newMarkup}%. New number prices will reflect this markup.`,
        });
      } else {
        throw new Error("Failed to update markup");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update phone numbers markup",
        variant: "destructive",
      });
    } finally {
      setUpdatingPhoneMarkup(false);
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
      <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-10 md:px-6 md:pt-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor profits and manage settings</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </Button>
          </Link>
          <Link href="/admin/numbers">
            <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Phone className="h-4 w-4 mr-2" />
              Numbers Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* API Balance Card */}
      <Card className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-900 dark:text-blue-100">API Account Balance</CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-200">
                Your therealowlet.com account balance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700 dark:text-blue-200 font-medium">Currency:</span>
              <div className="flex border border-blue-300/70 rounded-md overflow-hidden">
                <button
                  onClick={() => setDisplayCurrency("USD")}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    displayCurrency === "USD"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-700 hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-200 dark:hover:bg-blue-900/30"
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setDisplayCurrency("NGN")}
                  className={`px-3 py-1 text-sm font-medium transition-colors border-l border-blue-300 ${
                    displayCurrency === "NGN"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-700 hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-200 dark:hover:bg-blue-900/30"
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
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">Loading...</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
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
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      {parseFloat(apiBalanceOriginal || "0").toLocaleString()} {originalCurrency}
                    </p>
                  )}
                  {displayCurrency === "NGN" && apiBalance && (
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      ${parseFloat(apiBalance || "0").toFixed(2)} USD
                    </p>
                  )}
                </div>
                <Button onClick={fetchApiBalance} variant="outline" size="sm" className="bg-white/80 dark:bg-gray-900 border-blue-200/60">
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services Sync */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-100">Services Management</CardTitle>
          <CardDescription>Sync services from SHOPRIME API to database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Fetch the latest services from SHOPRIME API and sync them to the database.
                Users will see services from the database.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Services are fetched from the API, markup is applied, and stored in the database.
              </p>
            </div>
            <Button 
              onClick={handleSyncServices} 
              disabled={syncingServices}
              className="ml-4 bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl"
            >
              {syncingServices ? "Syncing..." : "Sync Services"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Markup Control */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-100">Services Profit Markup Settings</CardTitle>
          <CardDescription>Control the profit margin percentage for all social media services</CardDescription>
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
                  className="w-32 rounded-xl"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current markup: {markup}% | Example: $1.00 API cost = ${(1 * (1 + markup / 100)).toFixed(2)} customer price
              </p>
            </div>
            <Button onClick={handleUpdateMarkup} disabled={updatingMarkup} className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl">
              {updatingMarkup ? "Updating..." : "Update Markup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phone Numbers Markup Control */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-100">Phone Numbers Profit Markup Settings</CardTitle>
          <CardDescription>Control the profit margin percentage for virtual phone numbers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneMarkup">Markup Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="phoneMarkup"
                  type="number"
                  min="0"
                  step="0.1"
                  value={phoneMarkupInput}
                  onChange={(e) => setPhoneMarkupInput(e.target.value)}
                  className="w-32 rounded-xl"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current markup: {phoneMarkup}% | Example: $1.00 base cost = ${(1 * (1 + phoneMarkup / 100)).toFixed(2)} customer price
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Default: 400% (5x cost). This markup applies to monthly number rental fees.
              </p>
            </div>
            <Button onClick={handleUpdatePhoneMarkup} disabled={updatingPhoneMarkup} className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl">
              {updatingPhoneMarkup ? "Updating..." : "Update Markup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">${stats?.totalRevenue.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ${stats?.totalCosts.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">API costs</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${stats?.totalProfit.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Net profit</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-100">This Month</CardTitle>
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
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">${stats?.thisMonthRevenue.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${stats?.thisMonthProfit.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-100">Last Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">${stats?.lastMonthRevenue.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${stats?.lastMonthProfit.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader className="border-b border-gray-100 dark:border-gray-700">
          <CardTitle className="text-gray-800 dark:text-gray-100">Recent Orders</CardTitle>
          <CardDescription>Latest orders with profit data</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {order.services?.name || "Service"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.users?.email || order.users?.full_name || "User"}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.quantity.toLocaleString()} items
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Revenue</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          ${parseFloat(order.customer_charge || order.charge || "0").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Profit</p>
                        <p className="font-medium text-green-600">
                          ${parseFloat(order.profit || "0").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Date</p>
                        <p className="font-medium text-xs text-gray-600 dark:text-gray-300">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No orders yet</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
