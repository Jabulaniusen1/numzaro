"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { ArrowLeft, Loader2, Phone, DollarSign, TrendingUp, Settings } from "lucide-react";
import { COUNTRIES } from "@/lib/data/countries";

interface Stats {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  totalNumbers: number;
  activeNumbers: number;
  thisMonthRevenue: number;
  thisMonthCosts: number;
  thisMonthProfit: number;
  countryStats: Array<{
    code: string;
    name: string;
    count: number;
  }>;
}

export default function AdminNumbersPage() {
  const { toast } = useToast();
  const { format } = useCurrency();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingType, setPricingType] = useState<"percentage" | "fixed">("percentage");
  const [percentage, setPercentage] = useState<string>("20");
  const [fixed, setFixed] = useState<string>("1.00");
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [markup, setMarkup] = useState<string>("50");
  const [savingMarkup, setSavingMarkup] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPricingSettings();
    fetchMarkup();
  }, []);

  const fetchMarkup = async () => {
    try {
      const res = await fetch("/api/admin/numbers/markup");
      if (res.ok) {
        const data = await res.json();
        setMarkup(data.markupPercentage?.toString() ?? "50");
      }
    } catch {}
  };

  const saveMarkup = async () => {
    setSavingMarkup(true);
    try {
      const res = await fetch("/api/admin/numbers/markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markupPercentage: parseFloat(markup) }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Markup saved", description: `Numbers will now be priced at ${(1 + parseFloat(markup) / 100).toFixed(2)}× API cost.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingMarkup(false);
    }
  };

  const fetchPricingSettings = async () => {
    setLoadingPricing(true);
    try {
      const response = await fetch("/api/admin/numbers/one-time-pricing");
      if (response.ok) {
        const data = await response.json();
        setPricingType(data.pricingType || "percentage");
        setPercentage(data.percentage?.toString() || "20");
        setFixed(data.fixed?.toString() || "1.00");
      }
    } catch (error) {
      console.error("Error fetching pricing settings:", error);
    } finally {
      setLoadingPricing(false);
    }
  };

  const savePricingSettings = async () => {
    setSavingPricing(true);
    try {
      const response = await fetch("/api/admin/numbers/one-time-pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pricingType,
          percentage: parseFloat(percentage),
          fixed: parseFloat(fixed),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast({
        title: "Success",
        description: "One-time OTP pricing settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSavingPricing(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/numbers/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load stats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const profitMargin = stats.totalRevenue > 0
    ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Virtual Numbers Analytics</h1>
          <p className="text-muted-foreground">Financial and usage statistics</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {format(stats.totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Costs</CardDescription>
            <CardTitle className="text-2xl">{format(stats.totalCosts)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Profit</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              {format(stats.totalProfit)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profit Margin</CardDescription>
            <CardTitle className="text-2xl">{profitMargin}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">{format(stats.thisMonthRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costs</p>
              <p className="text-2xl font-bold">{format(stats.thisMonthCosts)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit</p>
              <p className="text-2xl font-bold text-green-600">{format(stats.thisMonthProfit)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Numbers Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Numbers</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {stats.totalNumbers}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Numbers</p>
              <p className="text-2xl font-bold">{stats.activeNumbers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Country</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.countryStats.map((country) => (
                <div key={country.code} className="flex justify-between items-center">
                  <span className="text-sm">{country.name}</span>
                  <span className="font-semibold">{country.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMSPool Markup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Number Price Markup
          </CardTitle>
          <CardDescription>
            How much to charge users on top of the SMSPool API cost. Example: 50% markup means a $0.12 number costs users $0.18.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="markup">Markup Percentage (%)</Label>
            <Input
              id="markup"
              type="number"
              min="0"
              step="1"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              className="mt-1 max-w-xs"
            />
            {markup && !isNaN(parseFloat(markup)) && (
              <p className="text-xs text-muted-foreground mt-1">
                Users pay <strong>{(1 + parseFloat(markup) / 100).toFixed(2)}×</strong> the API cost.
                A $1.00 number becomes <strong>${(1 + parseFloat(markup) / 100).toFixed(2)}</strong>.
              </p>
            )}
          </div>
          <Button onClick={saveMarkup} disabled={savingMarkup}>
            {savingMarkup ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Markup"}
          </Button>
        </CardContent>
      </Card>

      {/* One-Time OTP Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            One-Time OTP Pricing Configuration
          </CardTitle>
          <CardDescription>
            Configure pricing for one-time OTP numbers. These numbers are automatically released after receiving the first OTP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPricing ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div>
                <Label className="mb-2 block">Pricing Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPricingType("percentage")}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      pricingType === "percentage"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium">Percentage</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Percentage of monthly cost
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingType("fixed")}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      pricingType === "fixed"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium">Fixed Amount</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fixed price in USD
                    </p>
                  </button>
                </div>
              </div>

              {pricingType === "percentage" ? (
                <div>
                  <Label htmlFor="percentage">Percentage of Monthly Cost (%)</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: 20% means one-time price = 20% of monthly subscription cost
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="fixed">Fixed Price (USD)</Label>
                  <Input
                    id="fixed"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fixed}
                    onChange={(e) => setFixed(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Fixed price in USD for all one-time OTP numbers
                  </p>
                </div>
              )}

              <Button
                onClick={savePricingSettings}
                disabled={savingPricing}
                className="w-full"
              >
                {savingPricing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

