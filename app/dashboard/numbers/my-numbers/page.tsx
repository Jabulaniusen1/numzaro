"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberCard } from "@/components/dashboard/NumberCard";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { Phone, Plus, Loader2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VirtualNumber {
  id: string;
  phone_number: string;
  country_code: string;
  country_name: string;
  status: string;
  monthly_cost: number;
  message_count?: number;
  pending_otp_count?: number;
  created_at: string;
  expires_at: string;
}

export default function MyNumbersPage() {
  const { toast } = useToast();
  const { format } = useCurrency();
  const [numbers, setNumbers] = useState<VirtualNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/numbers");
      if (!response.ok) {
        throw new Error("Failed to fetch numbers");
      }

      const data = await response.json();
      setNumbers(data.numbers || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load numbers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredNumbers = numbers.filter((number) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      number.phone_number.toLowerCase().includes(query) ||
      number.country_name.toLowerCase().includes(query) ||
      number.country_code.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: numbers.length,
    active: numbers.filter((n) => n.status === "active").length,
    totalMessages: numbers.reduce((sum, n) => sum + (n.message_count || 0), 0),
    pendingOTPs: numbers.reduce((sum, n) => sum + (n.pending_otp_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Virtual Numbers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your virtual numbers and view messages
          </p>
        </div>
        <Link href="/dashboard/numbers">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Buy New Number
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Numbers</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Numbers</CardDescription>
            <CardTitle className="text-2xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Messages</CardDescription>
            <CardTitle className="text-2xl">{stats.totalMessages}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending OTPs</CardDescription>
            <CardTitle className="text-2xl">{stats.pendingOTPs}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone number, country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Numbers List */}
      {loading ? (
        <div className="space-y-6">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => {
              const colors = [
                { bg: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30", border: "border-blue-200 dark:border-blue-800" },
                { bg: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", border: "border-green-200 dark:border-green-800" },
                { bg: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30", border: "border-purple-200 dark:border-purple-800" },
                { bg: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30", border: "border-orange-200 dark:border-orange-800" },
              ];
              const colorScheme = colors[i % colors.length];
              return (
                <Card key={i} className={`border-2 ${colorScheme.border} bg-gradient-to-br ${colorScheme.bg}`}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                    <Skeleton className="h-8 w-16 mt-2 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Number Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => {
              const cardColors = [
                { bg: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30", border: "border-blue-200 dark:border-blue-800" },
                { bg: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", border: "border-green-200 dark:border-green-800" },
                { bg: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30", border: "border-purple-200 dark:border-purple-800" },
              ];
              const colors = cardColors[i % cardColors.length];
              return (
                <Card key={i} className={`border-2 ${colors.border} bg-gradient-to-br ${colors.bg} hover:shadow-xl transition-all`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                          <Skeleton className="h-4 w-24 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full bg-gradient-to-r from-green-200 to-green-100 dark:from-green-800 dark:to-green-700" />
                      <Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-800 dark:to-blue-700" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                      <Skeleton className="h-4 w-3/4 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1 bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20 rounded-md" />
                      <Skeleton className="h-9 flex-1 bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : filteredNumbers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No numbers match your search" : "You don't have any virtual numbers yet"}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/numbers">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Buy Your First Number
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNumbers.map((number) => (
            <NumberCard key={number.id} number={number} />
          ))}
        </div>
      )}
    </div>
  );
}

