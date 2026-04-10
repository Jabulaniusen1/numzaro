"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Search, List, Loader2, ChevronRight, Clock, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  FaWhatsapp, FaInstagram, FaFacebook, FaTelegram, FaGoogle,
  FaTwitter, FaTiktok, FaYoutube, FaSpotify, FaDiscord,
  FaLinkedin, FaSnapchatGhost, FaPinterest, FaViber, FaWeixin,
  FaSkype, FaAmazon, FaApple, FaPaypal, FaReddit, FaSteam,
  FaLine, FaUber, FaEbay,
} from "react-icons/fa";
import type { IconType } from "react-icons";

// ─── react-icons per service code ────────────────────────────────────────────
const SERVICE_ICONS: Record<string, IconType> = {
  whatsapp:  FaWhatsapp,
  instagram: FaInstagram,
  facebook:  FaFacebook,
  telegram:  FaTelegram,
  google:    FaGoogle,
  twitter:   FaTwitter,
  tiktok:    FaTiktok,
  youtube:   FaYoutube,
  spotify:   FaSpotify,
  discord:   FaDiscord,
  linkedin:  FaLinkedin,
  snapchat:  FaSnapchatGhost,
  pinterest: FaPinterest,
  viber:     FaViber,
  wechat:    FaWeixin,
  skype:     FaSkype,
  amazon:    FaAmazon,
  apple:     FaApple,
  paypal:    FaPaypal,
  reddit:    FaReddit,
  steam:     FaSteam,
  line:      FaLine,
  uber:      FaUber,
  ebay:      FaEbay,
};

interface PlatfoneService {
  code: string;
  name: string;
  color: string;
  totalAvailable: number;
  priority: number;
}

interface PlatfoneCountry {
  code: string;
  name: string;
  flag: string;
  available: number;
  sellPrice: number;
}

type Step = "service" | "country" | "confirm";

// ─── Skeletons ────────────────────────────────────────────────────────────────
function ServiceGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      ))}
    </div>
  );
}

function CountryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      ))}
    </div>
  );
}

// ─── Service icon — react-icons with brand color, letter fallback ─────────────
function ServiceIcon({ code, name, color }: { code: string; name: string; color: string }) {
  const Icon = SERVICE_ICONS[code.toLowerCase()];
  // Snapchat has a yellow bg — use dark icon; most others need white
  const iconColor = color === "#FFFC00" || color === "#FAE100" ? "#000" : "#fff";

  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {Icon
        ? <Icon size={22} color={iconColor} />
        : <span className="font-black text-lg" style={{ color: iconColor }}>{name.charAt(0).toUpperCase()}</span>
      }
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NumbersPage() {
  const { toast }  = useToast();
  const { format: formatCurrency, convert } = useCurrency();
  const router     = useRouter();

  const [balance, setBalance]         = useState<number | null>(null);
  const [services, setServices]       = useState<PlatfoneService[]>([]);
  const [countries, setCountries]     = useState<PlatfoneCountry[]>([]);
  const [selectedService, setSelectedService] = useState<PlatfoneService | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<PlatfoneCountry | null>(null);
  const [step, setStep]               = useState<Step>("service");
  const [serviceSearch, setServiceSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [purchasing, setPurchasing]   = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchServices();
  }, []);

  async function fetchBalance() {
    try {
      const res = await fetch("/api/user/balance");
      if (res.ok) setBalance(parseFloat((await res.json()).balance || "0"));
    } catch {}
  }

  async function fetchServices() {
    setLoadingServices(true);
    try {
      const res  = await fetch("/api/platfone/services");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      setServices(data.services ?? []);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load services", variant: "destructive" });
    } finally {
      setLoadingServices(false);
    }
  }

  async function fetchCountries(serviceCode: string) {
    setLoadingCountries(true);
    setCountries([]);
    try {
      const res  = await fetch(`/api/platfone/countries?service=${encodeURIComponent(serviceCode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      setCountries(data.countries ?? []);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load countries", variant: "destructive" });
    } finally {
      setLoadingCountries(false);
    }
  }

  function selectService(service: PlatfoneService) {
    setSelectedService(service);
    setSelectedCountry(null);
    setStep("country");
    fetchCountries(service.code);
  }

  function selectCountry(country: PlatfoneCountry) {
    setSelectedCountry(country);
    setStep("confirm");
  }

  async function handlePurchase() {
    if (!selectedService || !selectedCountry) return;

    setPurchasing(true);
    try {
      const res = await fetch("/api/numbers/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider:    "platfone",
          service:     selectedService.code,
          country:     selectedCountry.code,
          serviceName: selectedService.name,
          countryName: selectedCountry.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");

      toast({
        title: "Number Purchased!",
        description: `${data.number?.phone_number} is ready for ${selectedService.name}`,
      });

      setSelectedService(null);
      setSelectedCountry(null);
      setStep("service");
      fetchBalance();
      router.push("/dashboard/numbers/my-numbers");
    } catch (e: any) {
      toast({ title: "Purchase Failed", description: e.message, variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  }

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(serviceSearch.toLowerCase())
  );
  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Price shown to user — backend applies our markup on top of Platfone's price
  const userPrice = selectedCountry?.sellPrice ?? null;

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Virtual Phone Numbers
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/rentals">
            <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs md:text-sm">
              <List className="h-3.5 w-3.5 mr-1.5" />
              Rentals
            </Button>
          </Link>
          <Link href="/dashboard/numbers/my-numbers">
            <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs md:text-sm">
              My Numbers
            </Button>
          </Link>
        </div>
      </div>

      {/* Mode badge */}
      <div className="px-4 md:px-6 py-3">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 shadow-sm">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">One-Time Activation</span>
          <span className="text-xs text-gray-400">• expires in 20 minutes</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 md:px-6 pb-2 flex items-center gap-3 text-sm">
        {step !== "service" && (
          <button
            onClick={() => {
              if (step === "confirm") setStep("country");
              else setStep("service");
            }}
            className="flex items-center gap-1 text-xs font-bold text-[#7C5CFC] bg-violet-50 dark:bg-violet-900/30 px-3 py-1.5 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors mr-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        )}
        <button onClick={() => setStep("service")} className={cn("font-semibold transition-colors", step === "service" ? "text-[#7C5CFC]" : "text-gray-400 hover:text-gray-600")}>
          1. Service
        </button>
        <ChevronRight className="h-4 w-4 text-gray-300" />
        <button onClick={() => selectedService && setStep("country")} disabled={!selectedService} className={cn("font-semibold transition-colors", step === "country" ? "text-[#7C5CFC]" : "text-gray-400", selectedService ? "hover:text-gray-600" : "cursor-default")}>
          2. Country
        </button>
        <ChevronRight className="h-4 w-4 text-gray-300" />
        <span className={cn("font-semibold", step === "confirm" ? "text-[#7C5CFC]" : "text-gray-400")}>
          3. Confirm
        </span>
      </div>

      <div className="px-4 pb-32 md:pb-6 md:px-6">

        {/* ── Step 1: Select Service ──────────────────────────────────────────── */}
        {step === "service" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Select a service
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search service…"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="pl-8 h-9 rounded-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {loadingServices ? (
              <ServiceGridSkeleton />
            ) : filteredServices.length === 0 ? (
              <p className="text-center py-10 text-sm text-gray-400">No services found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredServices.map((service) => (
                  <button
                    key={service.code}
                    onClick={() => selectService(service)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group"
                  >
                    <ServiceIcon code={service.code} name={service.name} color={service.color} />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 text-center leading-tight line-clamp-2">
                      {service.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {service.totalAvailable.toLocaleString()} avail.
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Select Country ──────────────────────────────────────────── */}
        {step === "country" && selectedService && (
          <div className="space-y-4">
            {/* Selected service summary */}
            <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/20 border border-[#7C5CFC]/30 rounded-xl px-4 py-3">
              <ServiceIcon code={selectedService.code} name={selectedService.name} color={selectedService.color} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected service</p>
                <p className="font-bold text-gray-800 dark:text-gray-100">{selectedService.name}</p>
              </div>
              <button onClick={() => setStep("service")} className="ml-auto text-xs text-[#7C5CFC] font-semibold hover:underline">
                Change
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Select a country
              </h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search country…"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="pl-8 h-9 rounded-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {loadingCountries ? (
                <CountryGridSkeleton />
              ) : filteredCountries.length === 0 ? (
                <p className="text-center py-10 text-sm text-gray-400">
                  {countrySearch ? "No countries match your search." : "No countries available for this service."}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => selectCountry(country)}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                    >
                      <span className="text-3xl">{country.flag}</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 text-center">{country.name}</span>
                      <span className="text-[10px] text-gray-400">{country.available.toLocaleString()} avail.</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ─────────────────────────────────────────────────── */}
        {step === "confirm" && selectedService && selectedCountry && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Order Summary
              </h2>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ServiceIcon code={selectedService.code} name={selectedService.name} color={selectedService.color} />
                  <span className="font-bold text-gray-800 dark:text-gray-100">{selectedService.name}</span>
                </div>
                <button onClick={() => setStep("service")} className="text-xs text-[#7C5CFC] font-semibold hover:underline">Change</button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedCountry.flag}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100">{selectedCountry.name}</span>
                </div>
                <button onClick={() => setStep("country")} className="text-xs text-[#7C5CFC] font-semibold hover:underline">Change</button>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3" /> One-Time (20 min)
                </span>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Price</span>
                  <span className="text-2xl font-black text-[#7C5CFC]">
                    {userPrice !== null ? formatCurrency(convert(userPrice)) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Available now</span>
                  <span className={cn("font-bold", selectedCountry.available > 0 ? "text-green-600" : "text-red-500")}>
                    {selectedCountry.available.toLocaleString()} online
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Your balance</span>
                  <span className="font-bold text-gray-700 dark:text-gray-200">
                    {balance !== null ? formatCurrency(balance) : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handlePurchase}
                disabled={purchasing || selectedCountry.available === 0}
                className="w-full bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white h-14 text-base font-bold shadow-lg shadow-violet-200 dark:shadow-none rounded-2xl"
              >
                {purchasing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing…</>
                ) : userPrice !== null ? (
                  `Buy ${selectedService.name} Number — ${formatCurrency(convert(userPrice))}`
                ) : (
                  "Select options above"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={purchasing}
                onClick={() => { setSelectedCountry(null); setStep("country"); }}
                className="w-full h-11 rounded-2xl border-gray-200 dark:border-gray-700"
              >
                Find another number
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
