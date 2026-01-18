"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { ArrowLeft, Loader2, Phone, DollarSign, TrendingUp } from "lucide-react";

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

  useEffect(() => {
    fetchStats();
  }, []);

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
    </div>
  );
}

