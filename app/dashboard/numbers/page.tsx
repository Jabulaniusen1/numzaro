"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Search, ChevronDown, List, Loader2 } from "lucide-react";
import Link from "next/link";
import { ServiceLogo } from "@/components/ui/service-logo";

// 5Sim API: /guest/countries returns { [countryKey]: { text_en, iso: {iso}, prefix: {prefix}, ... } }
interface Country {
  key: string;    // e.g. "russia", "usa"
  name: string;   // e.g. "Russia", "USA"
  iso: string;    // e.g. "RU", "US"
  prefix: string; // e.g. "7", "1"
}

// 5Sim API: /guest/prices?product=telegram returns:
// { [product]: { [country]: { [operator]: { cost, count, rate, ... } } } }
interface OperatorEntry {
  cost: number;
  count: number;
  rate?: number;
}

interface CountryAvailability {
  count: number;  // total across operators
  price: number;  // lowest cost across operators
}

// Static service list — matches 5Sim product keys exactly
interface Service {
  name: string;
  product: string; // 5Sim product key used in API calls
}

const SERVICES: Service[] = [
  { name: "Telegram", product: "telegram" },
  { name: "WhatsApp", product: "whatsapp" },
  { name: "Facebook", product: "facebook" },
  { name: "Instagram", product: "instagram" },
  { name: "Google", product: "google" },
  { name: "Twitter / X", product: "twitter" },
  { name: "Microsoft", product: "microsoft" },
  { name: "Amazon", product: "amazon" },
  { name: "TikTok", product: "tiktok" },
  { name: "Snapchat", product: "snapchat" },
  { name: "LinkedIn", product: "linkedin" },
  { name: "Discord", product: "discord" },
  { name: "Viber", product: "viber" },
  { name: "Signal", product: "signal" },
  { name: "Skype", product: "skype" },
  { name: "PayPal", product: "paypal" },
  { name: "Steam", product: "steam" },
  { name: "Apple", product: "apple" },
  { name: "Yahoo", product: "yahoo" },
  { name: "Yandex", product: "yandex" },
  { name: "Other", product: "other" },
];

function getFlag(iso: string | { iso?: string } | any): string {
  // Handle cases where iso might be an object like { iso: "RU" }
  const isoStr = typeof iso === "object" ? (iso?.iso || "") : (iso || "");
  if (!isoStr || isoStr.length < 2) return "🏳️";
  const code = isoStr.toUpperCase().slice(0, 2);
  return code
    .split("")
    .map((c: string) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export default function NumbersPage() {
  const { toast } = useToast();
  const { format: formatCurrency, convert } = useCurrency();

  const [balance, setBalance] = useState<number | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [availability, setAvailability] = useState<Record<string, CountryAvailability>>({});

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [serviceSearch, setServiceSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [sortBy, setSortBy] = useState<"popularity" | "name" | "price">("popularity");

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Load balance and countries on mount
  useEffect(() => {
    fetchBalance();
    fetchCountries();
  }, []);

  // When service changes, fetch prices for that product
  useEffect(() => {
    if (selectedService) {
      setSelectedCountry(null);
      fetchPrices(selectedService.product);
    } else {
      setAvailability({});
    }
  }, [selectedService]);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/user/balance");
      if (res.ok) {
        const data = await res.json();
        setBalance(parseFloat(data.balance || "0"));
      }
    } catch (e) {
      console.error("Balance fetch error:", e);
    }
  };

  // GET /guest/countries → object keyed by country name
  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const res = await fetch("/api/5sim/countries");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();

      const arr: Country[] = Object.entries(data).map(([key, val]: [string, any]) => {
        const isoRaw = val.iso;
        const prefixRaw = val.prefix;
        // iso is { "af": 1 } — key is the ISO code
        const iso = typeof isoRaw === "object" && isoRaw !== null
          ? Object.keys(isoRaw)[0] || ""
          : (isoRaw || "");
        // prefix is { "+93": 1 } — key is the prefix, strip the "+"
        const prefixKey = typeof prefixRaw === "object" && prefixRaw !== null
          ? Object.keys(prefixRaw)[0] || ""
          : (prefixRaw || "");
        const prefix = prefixKey.replace("+", "");
        return {
          key,
          name: val.text_en || key.charAt(0).toUpperCase() + key.slice(1),
          iso: iso.toUpperCase(),
          prefix,
        };
      });

      setCountries(arr);
    } catch (e) {
      console.error("Countries fetch error:", e);
      toast({ title: "Error", description: "Failed to load countries", variant: "destructive" });
    } finally {
      setLoadingCountries(false);
    }
  };

  // GET /guest/prices?product={product}
  // Response: { [product]: { [country]: { [operator]: { cost, count } } } }
  const fetchPrices = async (product: string) => {
    setLoadingPrices(true);
    setAvailability({});
    try {
      const res = await fetch(`/api/5sim/prices?product=${product}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: Record<string, Record<string, Record<string, OperatorEntry>>> = await res.json();

      // The top-level key is the product name (e.g. "instagram")
      const countryData = data[product];
      if (!countryData) {
        console.warn(`No data found for product "${product}" in response`, Object.keys(data));
        setAvailability({});
        return;
      }

      const avail: Record<string, CountryAvailability> = {};
      Object.entries(countryData).forEach(([countryKey, operators]) => {
        // Sum count and find lowest cost across all operators
        let totalCount = 0;
        let lowestCost = Infinity;

        Object.values(operators).forEach((op) => {
          if (op.count > 0) {
            totalCount += op.count;
            if (op.cost < lowestCost) lowestCost = op.cost;
          }
        });

        if (totalCount > 0) {
          avail[countryKey] = { count: totalCount, price: lowestCost };
        }
      });

      setAvailability(avail);
    } catch (e) {
      console.error("Prices fetch error:", e);
    } finally {
      setLoadingPrices(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedService || !selectedCountry) {
      toast({ title: "Select a service and country first", variant: "destructive" });
      return;
    }

    const avail = availability[selectedCountry.key];
    if (!avail || avail.count === 0) {
      toast({ title: "No numbers available", variant: "destructive" });
      return;
    }

    setPurchasing(true);
    try {
      const res = await fetch("/api/numbers/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: selectedCountry.key,
          service: selectedService.product,
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");

      toast({
        title: "Number Purchased!",
        description: `Your number ${data.phoneNumber} is ready`,
      });

      setSelectedCountry(null);
      setQuantity(1);
      fetchBalance();
      if (selectedService) fetchPrices(selectedService.product);
    } catch (e: any) {
      toast({ title: "Purchase Failed", description: e.message, variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  };

  const filteredServices = SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.product.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredCountries = countries
    .filter((c) => {
      const hasNumbers = (availability[c.key]?.count || 0) > 0;
      const matchesSearch =
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.key.toLowerCase().includes(countrySearch.toLowerCase());
      return hasNumbers && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "popularity") {
        return (availability[b.key]?.count || 0) - (availability[a.key]?.count || 0);
      } else if (sortBy === "price") {
        return (availability[a.key]?.price || 0) - (availability[b.key]?.price || 0);
      }
      return a.name.localeCompare(b.name);
    });

  // On mobile: show service panel OR country panel depending on step
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);

  // When a service is selected on mobile, auto-advance to step 2
  const handleServiceSelect = (service: Service) => {
    const isSelected = selectedService?.product === service.product;
    setSelectedService(isSelected ? null : service);
    if (!isSelected) setMobileStep(2);
  };

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Find Numbers
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
            SMS verification via 5Sim
          </p>
        </div>
        <Link href="/dashboard/numbers/my-numbers">
          <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs md:text-sm">
            <List className="h-3.5 w-3.5 mr-1.5" />
            My Numbers
          </Button>
        </Link>
      </div>

      {/* Mobile step tabs */}
      <div className="md:hidden flex mx-4 mb-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setMobileStep(1)}
          className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
            mobileStep === 1
              ? "bg-[#7C5CFC] text-white"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          1. Service{selectedService ? ` — ${selectedService.name}` : ""}
        </button>
        <button
          onClick={() => { if (selectedService) setMobileStep(2); }}
          className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
            mobileStep === 2
              ? "bg-[#7C5CFC] text-white"
              : selectedService
              ? "text-gray-500 dark:text-gray-400"
              : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
          }`}
        >
          2. Country{selectedCountry ? ` — ${selectedCountry.name}` : ""}
        </button>
      </div>

      {/* Main layout */}
      <div className="px-4 pb-32 md:pb-6 md:px-6 md:flex md:gap-6 md:h-[calc(100vh-130px)]">

        {/* Services panel — always visible on desktop, step 1 on mobile */}
        <div className={`md:w-64 lg:w-72 md:flex md:flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${mobileStep === 1 ? "flex flex-col" : "hidden md:flex"}`}>
          <div className="p-3 md:p-4 flex flex-col h-full">
            <h2 className="hidden md:block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              1. Select Service
            </h2>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search service..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="pl-8 h-8 rounded-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5 md:max-h-none max-h-[55vh]">
              {filteredServices.map((service) => {
                const isSelected = selectedService?.product === service.product;
                return (
                  <button
                    key={service.product}
                    onClick={() => handleServiceSelect(service)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? "bg-[#7C5CFC] text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <ServiceLogo serviceName={service.name} serviceCode={service.product} size={20} />
                    <span className="font-medium text-sm">{service.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Countries panel — always visible on desktop, step 2 on mobile */}
        <div className={`flex-1 md:flex md:flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${mobileStep === 2 ? "flex flex-col" : "hidden md:flex"}`}>
          <div className="p-3 md:p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {selectedService ? (
                  <span>
                    <span className="hidden md:inline">2. </span>
                    <span className="text-[#7C5CFC] normal-case">{selectedService.name}</span>
                    <span className="normal-case font-normal text-gray-400"> — pick a country</span>
                  </span>
                ) : (
                  <span className="hidden md:inline">2. Select Country</span>
                )}
              </h2>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full px-2.5 py-1 pr-6 text-gray-700 dark:text-gray-200"
                >
                  <option value="popularity">Availability</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search country..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="pl-8 h-8 rounded-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Country list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 md:max-h-none max-h-[45vh]">
              {!selectedService ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-xs">Select a service first</p>
                </div>
              ) : loadingCountries || loadingPrices ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
                </div>
              ) : filteredCountries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-2">🌍</div>
                  <p className="text-xs">No countries available for {selectedService.name}</p>
                </div>
              ) : (
                filteredCountries.map((country) => {
                  const avail = availability[country.key]!;
                  const isSelected = selectedCountry?.key === country.key;
                  return (
                    <div
                      key={country.key}
                      onClick={() => setSelectedCountry(isSelected ? null : country)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "border-[#7C5CFC] bg-violet-50 dark:bg-violet-900/20"
                          : "border-transparent bg-gray-50 dark:bg-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl flex-shrink-0">{getFlag(country.iso)}</span>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {country.name}
                            {country.prefix && (
                              <span className="ml-1 text-gray-400 font-normal text-xs">+{country.prefix}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {avail.count.toLocaleString()} available
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {isSelected && (
                          <div className="flex items-center bg-white dark:bg-gray-600 rounded-full border border-gray-300 dark:border-gray-500">
                            <button
                              onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-l-full text-sm"
                            >
                              −
                            </button>
                            <span className="px-1.5 text-xs font-medium text-gray-900 dark:text-gray-100 min-w-[16px] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setQuantity(quantity + 1); }}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-r-full text-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                        <div className="bg-[#7C5CFC] text-white text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                          {formatCurrency(convert(avail.price))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom action bar — desktop only inside panel */}
            <div className="hidden md:flex mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Balance</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {balance !== null ? formatCurrency(balance) : "—"}
                </div>
              </div>
              <Button
                onClick={handlePurchase}
                disabled={purchasing || !selectedService || !selectedCountry}
                className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white px-5 h-9 text-sm disabled:opacity-50"
              >
                {purchasing ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Processing...</>
                ) : selectedService && selectedCountry ? (
                  `Buy — ${formatCurrency(convert(availability[selectedCountry.key]?.price || 0))}`
                ) : (
                  "Select service & country"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-50">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Balance: <span className="font-semibold text-gray-900 dark:text-gray-100">{balance !== null ? formatCurrency(balance) : "—"}</span>
          </div>
          {selectedService && selectedCountry && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {getFlag(selectedCountry.iso)} {selectedCountry.name}
            </div>
          )}
        </div>
        <Button
          onClick={handlePurchase}
          disabled={purchasing || !selectedService || !selectedCountry}
          className="w-full bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white h-11 text-sm font-semibold disabled:opacity-50 rounded-xl"
        >
          {purchasing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
          ) : selectedService && selectedCountry ? (
            `Buy ${selectedService.name} — ${formatCurrency(convert(availability[selectedCountry.key]?.price || 0))}`
          ) : !selectedService ? (
            "← Select a service first"
          ) : (
            "Select a country above"
          )}
        </Button>
      </div>
    </div>
  );
}
