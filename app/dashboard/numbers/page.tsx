"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { NumberPurchaseModal } from "@/components/dashboard/NumberPurchaseModal";
import { Phone, Search, Loader2, ChevronRight, Filter, X, List } from "lucide-react";
import Link from "next/link";
import { Combobox } from "@/components/ui/combobox";
import { COUNTRIES, getCountryName } from "@/lib/data/countries";
import { Skeleton } from "@/components/ui/skeleton";

interface AvailableNumber {
  friendlyName: string;
  phoneNumber: string;
  region: string;
  countryCode: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
  monthly_cost: number;
  twilio_monthly_cost: number;
  numberType?: "local" | "mobile" | "tollFree";
}

export default function NumbersPage() {
  const { toast } = useToast();
  const { format, convert, currency, rate, switchCurrency, loading: currencyLoading } = useCurrency();
  const [country, setCountry] = useState("US");
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [filteredNumbers, setFilteredNumbers] = useState<AvailableNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [numberTypeFilter, setNumberTypeFilter] = useState<string>("all");
  const [capabilityFilter, setCapabilityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState({ local: 1, mobile: 1, tollFree: 1 });
  const [hasMore, setHasMore] = useState({ local: false, mobile: false, tollFree: false });
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Reset to page 1 when country changes
    setCurrentPage({ local: 1, mobile: 1, tollFree: 1 });
    setNumbers([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    searchAllNumberTypes(1, true);
  }, [country]);

  useEffect(() => {
    // Filter numbers based on search, capabilities, and number type
    let filtered = [...numbers];

    // Filter by number type
    if (numberTypeFilter !== "all") {
      filtered = filtered.filter((n) => {
        const type = n.numberType || "local";
        if (numberTypeFilter === "mobile") return type === "mobile";
        if (numberTypeFilter === "local") return type === "local";
        if (numberTypeFilter === "tollFree") return type === "tollFree";
        return true;
      });
    }

    // Filter by search query (phone number or region)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.phoneNumber.toLowerCase().includes(query) ||
          n.region.toLowerCase().includes(query)
      );
    }

    // Filter by capabilities
    if (capabilityFilter !== "all") {
      filtered = filtered.filter((n) => {
        if (capabilityFilter === "sms") return n.capabilities.SMS;
        if (capabilityFilter === "voice") return n.capabilities.voice;
        if (capabilityFilter === "mms") return n.capabilities.MMS;
        return true;
      });
    }

    setFilteredNumbers(filtered);
  }, [numbers, searchQuery, capabilityFilter, numberTypeFilter]);

  const searchAllNumberTypes = async (page: number = 1, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setFilterDialogOpen(false); // Close filters when search starts
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Fetch all three number types in parallel
      const [localResponse, mobileResponse, tollFreeResponse] = await Promise.allSettled([
        fetch(`/api/numbers/search?country=${country}&type=local&capabilities=SMS&page=${page}&pageSize=50`),
        fetch(`/api/numbers/search?country=${country}&type=mobile&capabilities=SMS&page=${page}&pageSize=50`),
        fetch(`/api/numbers/search?country=${country}&type=tollFree&capabilities=SMS&page=${page}&pageSize=50`),
      ]);

      const allNumbers: AvailableNumber[] = [];
      const newHasMore = { local: false, mobile: false, tollFree: false };

      // Process local numbers
      if (localResponse.status === "fulfilled" && localResponse.value.ok) {
        const data = await localResponse.value.json();
        if (data.numbers) {
          allNumbers.push(...data.numbers);
          newHasMore.local = data.pagination?.hasMore || false;
        }
      }

      // Process mobile numbers
      if (mobileResponse.status === "fulfilled" && mobileResponse.value.ok) {
        const data = await mobileResponse.value.json();
        if (data.numbers) {
          allNumbers.push(...data.numbers);
          newHasMore.mobile = data.pagination?.hasMore || false;
        }
      }

      // Process toll-free numbers
      if (tollFreeResponse.status === "fulfilled" && tollFreeResponse.value.ok) {
        const data = await tollFreeResponse.value.json();
        if (data.numbers) {
          allNumbers.push(...data.numbers);
          newHasMore.tollFree = data.pagination?.hasMore || false;
        }
      }

      // Check for errors
      const errors: string[] = [];
      if (localResponse.status === "rejected") errors.push("Local numbers: " + localResponse.reason);
      if (mobileResponse.status === "rejected") errors.push("Mobile numbers: " + mobileResponse.reason);
      if (tollFreeResponse.status === "rejected") errors.push("Toll-free numbers: " + tollFreeResponse.reason);

      // Try to get error messages from failed responses
      const errorPromises = [
        localResponse.status === "fulfilled" && !localResponse.value.ok ? localResponse.value.json() : null,
        mobileResponse.status === "fulfilled" && !mobileResponse.value.ok ? mobileResponse.value.json() : null,
        tollFreeResponse.status === "fulfilled" && !tollFreeResponse.value.ok ? tollFreeResponse.value.json() : null,
      ].filter(Boolean);

      if (errorPromises.length > 0) {
        const errorData = await Promise.all(errorPromises);
        errorData.forEach((err: any) => {
          if (err?.error && !err.error.includes("authentication")) {
            console.warn("Number search warning:", err.error);
          }
        });
      }

      // Sort numbers: Mobile first, then Local, then Toll-Free, then by price
      const sortedNumbers = allNumbers.sort((a, b) => {
        // First sort by type priority: mobile > local > tollFree
        const typeOrder = { mobile: 0, local: 1, tollFree: 2 };
        const aType = a.numberType || "local";
        const bType = b.numberType || "local";
        const typeDiff = (typeOrder[aType as keyof typeof typeOrder] || 1) - (typeOrder[bType as keyof typeof typeOrder] || 1);
        if (typeDiff !== 0) return typeDiff;
        // Then sort by price (ascending)
        return (a.monthly_cost || 0) - (b.monthly_cost || 0);
      });
      
      if (reset) {
        setNumbers(sortedNumbers);
      } else {
        // Append new numbers to existing ones
        setNumbers((prev) => {
          // Avoid duplicates by checking phone number
          const existingPhones = new Set(prev.map(n => n.phoneNumber));
          const newNumbers = sortedNumbers.filter(n => !existingPhones.has(n.phoneNumber));
          const combined = [...prev, ...newNumbers];
          // Re-sort combined list
          return combined.sort((a, b) => {
            const typeOrder = { mobile: 0, local: 1, tollFree: 2 };
            const aType = a.numberType || "local";
            const bType = b.numberType || "local";
            const typeDiff = (typeOrder[aType as keyof typeof typeOrder] || 1) - (typeOrder[bType as keyof typeof typeOrder] || 1);
            if (typeDiff !== 0) return typeDiff;
            return (a.monthly_cost || 0) - (b.monthly_cost || 0);
          });
        });
      }
      
      setHasMore(newHasMore);
      setCurrentPage(prev => ({
        local: newHasMore.local ? page : prev.local,
        mobile: newHasMore.mobile ? page : prev.mobile,
        tollFree: newHasMore.tollFree ? page : prev.tollFree,
      }));
      
      if (allNumbers.length === 0 && page === 1) {
        toast({
          title: "No Numbers Found",
          description: `No available numbers found for ${getCountryName(country)}. Try a different country.`,
          variant: "default",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load numbers. Check console for details.",
        variant: "destructive",
      });
      if (reset) {
        setNumbers([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadNextPage = () => {
    if (!loadingMore && (hasMore.local || hasMore.mobile || hasMore.tollFree)) {
      const nextPage = Math.max(currentPage.local, currentPage.mobile, currentPage.tollFree) + 1;
      searchAllNumberTypes(nextPage, false);
    }
  };

  const handlePurchase = (number: AvailableNumber) => {
    setSelectedNumber(number);
    setPurchaseModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between ">
        <div>
          <h1 className="lg:text-3xl text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Virtual Numbers</h1>
          <p className="text-muted-foreground lg:text-base text-sm">
            Browse and purchase virtual numbers from different countries
          </p>
        </div>
        <Link href="/dashboard/numbers/my-numbers">
          <Button variant="outline">
            <List className="h-4 w-4 mr-2" />
            My Numbers
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex gap-2 items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search phone number or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setFilterDialogOpen(!filterDialogOpen)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(numberTypeFilter !== "all" || capabilityFilter !== "all" || country !== "US") && (
                <span className="ml-2 h-2 w-2 rounded-full bg-primary"></span>
              )}
            </Button>
          </div>

          {/* Slide-down Filters Panel */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              filterDialogOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Country</label>
                  <Combobox
                    options={COUNTRIES.map((c) => ({
                      value: c.code,
                      label: c.name,
                    }))}
                    value={country}
                    onValueChange={setCountry}
                    placeholder="Select country..."
                    searchPlaceholder="Search countries..."
                    emptyMessage="No countries found."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Number Type</label>
                  <Select value={numberTypeFilter} onValueChange={setNumberTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="tollFree">Toll-Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Capabilities</label>
                  <Select value={capabilityFilter} onValueChange={setCapabilityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All capabilities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Capabilities</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="voice">Voice</SelectItem>
                      <SelectItem value="mms">MMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Currency</label>
                  <Select value={currency} onValueChange={(value) => switchCurrency(value as "USD" | "NGN")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Filter Actions */}
              <div className="flex gap-2 justify-end">
                {(numberTypeFilter !== "all" || capabilityFilter !== "all" || country !== "US") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNumberTypeFilter("all");
                      setCapabilityFilter("all");
                      setCountry("US");
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setFilterDialogOpen(false); // Close filters immediately
                    setCurrentPage({ local: 1, mobile: 1, tollFree: 1 });
                    setNumbers([]);
                    searchAllNumberTypes(1, true);
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Apply Filters
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && numbers.length === 0 ? (
        <div className="space-y-6">
          {/* Number Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => {
              const cardColors = [
                { bg: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30", border: "border-blue-200 dark:border-blue-800" },
                { bg: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30", border: "border-orange-200 dark:border-orange-800" },
                { bg: "from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30", border: "border-yellow-200 dark:border-yellow-800" },
              ];
              const colors = cardColors[i % cardColors.length];
              
              return (
                <Card key={i} className={`border-2 ${colors.border} bg-gradient-to-br ${colors.bg} hover:shadow-xl transition-all`}>
                  {/* Mobile Compact Skeleton */}
                  <div className="md:hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Skeleton className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20 flex-shrink-0" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <Skeleton className="h-4 w-28 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                            <Skeleton className="h-3 w-20 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right space-y-1">
                          <Skeleton className="h-5 w-16 bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20" />
                          <Skeleton className="h-3 w-12 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3">
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          <Skeleton className="h-5 w-12 rounded-full bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-800 dark:to-blue-700" />
                          <Skeleton className="h-5 w-10 rounded-full bg-gradient-to-r from-green-200 to-green-100 dark:from-green-800 dark:to-green-700" />
                        </div>
                        <Skeleton className="h-7 w-12 bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20 rounded-md" />
                      </div>
                    </CardContent>
                  </div>

                  {/* Desktop Full Skeleton */}
                  <div className="hidden md:block">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20" />
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-32 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                            <Skeleton className="h-4 w-24 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                          <Skeleton className="h-3 w-20 mb-2 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                          <Skeleton className="h-8 w-32 bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20" />
                          <Skeleton className="h-3 w-24 mt-2 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Skeleton className="h-6 w-16 rounded-full bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-800 dark:to-blue-700" />
                          <Skeleton className="h-6 w-12 rounded-full bg-gradient-to-r from-green-200 to-green-100 dark:from-green-800 dark:to-green-700" />
                        </div>
                        <Skeleton className="h-10 w-full bg-gradient-to-r from-primary/30 to-secondary/30 dark:from-primary/20 dark:to-secondary/20 rounded-md" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : filteredNumbers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              {numbers.length === 0
                ? `No numbers available for ${getCountryName(country)}`
                : "No numbers match your filters"}
            </p>
            {numbers.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCapabilityFilter("all");
                  setNumberTypeFilter("all");
                }}
                className="mt-4"
              >
                Clear Filters
                </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredNumbers.length} of {numbers.length} numbers
              {(hasMore.local || hasMore.mobile || hasMore.tollFree) && (
                <span className="ml-2 text-xs">(More available)</span>
              )}
            </div>
            {(hasMore.local || hasMore.mobile || hasMore.tollFree) && (
              <Button
                onClick={loadNextPage}
                disabled={loadingMore}
                variant="outline"
                size="sm"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredNumbers.map((number) => {
            // Determine color scheme based on number type
            const getColorScheme = () => {
              if (number.numberType === "mobile") {
                return {
                  cardBg: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
                  cardBorder: "border-orange-200 dark:border-orange-800",
                  iconBg: "from-orange-500 to-amber-500",
                  typeBadge: "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
                  priceText: "text-orange-700 dark:text-orange-300",
                  titleText: "text-orange-900 dark:text-orange-100",
                };
              } else if (number.numberType === "tollFree") {
                return {
                  cardBg: "from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30",
                  cardBorder: "border-yellow-200 dark:border-yellow-800",
                  iconBg: "from-yellow-500 to-amber-500",
                  typeBadge: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white",
                  priceText: "text-yellow-700 dark:text-yellow-300",
                  titleText: "text-yellow-900 dark:text-yellow-100",
                };
              } else {
                // local
                return {
                  cardBg: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
                  cardBorder: "border-blue-200 dark:border-blue-800",
                  iconBg: "from-blue-500 to-cyan-500",
                  typeBadge: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
                  priceText: "text-blue-700 dark:text-blue-300",
                  titleText: "text-blue-900 dark:text-blue-100",
                };
              }
            };

            const colors = getColorScheme();

            return (
              <Card 
                key={number.phoneNumber}
                className={`border-2 ${colors.cardBorder} bg-gradient-to-br ${colors.cardBg} hover:shadow-xl transition-all duration-300 md:hover:scale-105`}
              >
                {/* Mobile Compact Layout */}
                <div className="md:hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${colors.iconBg} shadow-sm flex-shrink-0`}>
                          <Phone className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className={`${colors.titleText} text-sm font-bold truncate`}>
                            {number.phoneNumber}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {number.region}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className={`text-lg font-bold ${colors.priceText}`}>
                          {format(convert(number.monthly_cost))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{currency}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {number.numberType && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${colors.typeBadge}`}>
                            {number.numberType === "local" ? "Local" : number.numberType === "mobile" ? "Mobile" : "Toll-Free"}
                          </span>
                        )}
                        {number.capabilities.SMS && (
                          <span className="text-[10px] bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-0.5 rounded-full font-semibold">
                            SMS
                          </span>
                        )}
                        {number.capabilities.voice && (
                          <span className="text-[10px] bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold">
                            Voice
                          </span>
                        )}
                        {number.capabilities.MMS && (
                          <span className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-semibold">
                            MMS
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className={`bg-gradient-to-r ${colors.iconBg} hover:opacity-90 text-white text-xs px-3 py-1.5 h-auto`}
                        onClick={() => handlePurchase(number)}
                      >
                        Buy
                      </Button>
                    </div>
                  </CardContent>
                </div>

                {/* Desktop Full Layout */}
                <div className="hidden md:block">
              <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${colors.iconBg} shadow-md`}>
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className={`${colors.titleText} text-lg font-bold`}>
                  {number.phoneNumber}
                </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                            {number.region}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                      {/* Pricing Section */}
                      <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          Monthly Fee
                        </p>
                        <p className={`text-3xl font-bold ${colors.priceText} mb-1`}>
                      {format(convert(number.monthly_cost))} {currency}
                    </p>
                        {number.twilio_monthly_cost && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Base: ${number.twilio_monthly_cost.toFixed(2)} USD
                      </p>
                    )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      + Pay-per-SMS for messages received
                    </p>
                  </div>

                      {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {number.numberType && (
                          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm ${colors.typeBadge}`}>
                        {number.numberType === "local" ? "Local" : number.numberType === "mobile" ? "Mobile" : "Toll-Free"}
                      </span>
                    )}
                    {number.capabilities.SMS && (
                          <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-full font-semibold shadow-sm">
                        SMS
                      </span>
                    )}
                    {number.capabilities.voice && (
                          <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full font-semibold shadow-sm">
                        Voice
                      </span>
                    )}
                    {number.capabilities.MMS && (
                          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full font-semibold shadow-sm">
                        MMS
                      </span>
                    )}
                  </div>

                      {/* Buy Button */}
                  <Button
                        className={`w-full bg-gradient-to-r ${colors.iconBg} hover:opacity-90 text-white font-semibold shadow-md hover:shadow-lg transition-all`}
                    onClick={() => handlePurchase(number)}
                  >
                    Buy Now
                  </Button>
                </div>
              </CardContent>
                </div>
            </Card>
            );
          })}
          </div>
          {(hasMore.local || hasMore.mobile || hasMore.tollFree) && filteredNumbers.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={loadNextPage}
                disabled={loadingMore}
                variant="outline"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  <>
                    Load More Numbers
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      <NumberPurchaseModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        number={
          selectedNumber
            ? {
                phoneNumber: selectedNumber.phoneNumber,
                countryCode: selectedNumber.countryCode,
                monthly_cost: selectedNumber.monthly_cost,
              }
            : null
        }
        onSuccess={() => {
          searchAllNumberTypes(1, true);
        }}
      />
    </div>
  );
}
