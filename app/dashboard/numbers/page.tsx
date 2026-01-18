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
import { Phone, Search, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
];

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
  const [capabilityFilter, setCapabilityFilter] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Reset to page 1 when country changes
    setCurrentPage(1);
    setNumbers([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    searchNumbers(1, true);
  }, [country]);

  useEffect(() => {
    // Filter numbers based on search, capabilities, and price
    let filtered = [...numbers];

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

    // Filter by max price (convert max price to USD for comparison since API prices are in USD)
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      if (!isNaN(maxPriceNum)) {
        // Convert max price from selected currency to USD for comparison
        const maxPriceUSD = currency === "USD" ? maxPriceNum : maxPriceNum / rate;
        filtered = filtered.filter((n) => n.monthly_cost <= maxPriceUSD);
      }
    }

    setFilteredNumbers(filtered);
  }, [numbers, searchQuery, capabilityFilter, maxPrice, currency, rate]);

  const searchNumbers = async (page: number = 1, reset: boolean = false) => {
    if (reset) {
    setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const response = await fetch(`/api/numbers/search?country=${country}&capabilities=SMS&page=${page}&pageSize=50`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("API Error:", data);
        throw new Error(data.error || data.details || "Failed to search numbers");
      }

      console.log("Search results:", data);
      
      if (reset) {
      setNumbers(data.numbers || []);
      } else {
        // Append new numbers to existing ones
        setNumbers((prev) => [...prev, ...(data.numbers || [])]);
      }
      
      setHasMore(data.pagination?.hasMore || false);
      setCurrentPage(page);
      
      if ((data.numbers || []).length === 0 && page === 1) {
        toast({
          title: "No Numbers Found",
          description: `No available numbers found for ${country}. Try a different country or check Twilio account.`,
          variant: "default",
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
    if (!loadingMore && hasMore) {
      searchNumbers(currentPage + 1, false);
    }
  };

  const handlePurchase = (number: AvailableNumber) => {
    setSelectedNumber(number);
    setPurchaseModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Virtual Number Marketplace</h1>
          <p className="text-muted-foreground">
            Browse and purchase virtual numbers from different countries
          </p>
        </div>
        <Link href="/dashboard/numbers/my-numbers">
          <Button variant="outline">
            My Numbers
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
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
            <div className="flex-1">
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
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Max Price ({currency})</label>
              <Input
                type="number"
                placeholder="No limit"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => {
                setCurrentPage(1);
                setNumbers([]);
                searchNumbers(1, true);
              }} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
      </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Search by Number or Region</label>
            <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
                placeholder="Search phone number or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
        </CardContent>
      </Card>

      {loading && numbers.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNumbers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {numbers.length === 0
                ? "No numbers available for this country"
                : "No numbers match your filters"}
            </p>
            {numbers.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCapabilityFilter("all");
                  setMaxPrice("");
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
              {hasMore && (
                <span className="ml-2 text-xs">(Page {currentPage}, more available)</span>
              )}
            </div>
            {hasMore && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNumbers.map((number) => (
            <Card key={number.phoneNumber}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {number.phoneNumber}
                </CardTitle>
                <CardDescription>{number.region}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monthly Fee</p>
                    <p className="text-2xl font-bold">
                      {format(convert(number.monthly_cost))} {currency}
                    </p>
                    {currency === "NGN" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ≈ ${number.monthly_cost.toFixed(2)} USD
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      + Pay-per-SMS for messages received
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {number.capabilities.SMS && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                        SMS
                      </span>
                    )}
                    {number.capabilities.voice && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                        Voice
                      </span>
                    )}
                    {number.capabilities.MMS && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                        MMS
                      </span>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(number)}
                  >
                    Buy Now
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
          {hasMore && filteredNumbers.length > 0 && (
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
          searchNumbers();
        }}
      />
    </div>
  );
}
