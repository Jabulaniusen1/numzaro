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

const SERVICE_COLORS: Record<string, string> = {
  whatsapp:  "#25D366",
  instagram: "#E1306C",
  facebook:  "#1877F2",
  telegram:  "#2AABEE",
  google:    "#4285F4",
  twitter:   "#1DA1F2",
  tiktok:    "#010101",
  youtube:   "#FF0000",
  spotify:   "#1DB954",
  discord:   "#5865F2",
  linkedin:  "#0A66C2",
  snapchat:  "#FFFC00",
  pinterest: "#E60023",
  viber:     "#7360F2",
  wechat:    "#07C160",
  skype:     "#00AFF0",
  amazon:    "#FF9900",
  apple:     "#555555",
  paypal:    "#003087",
  reddit:    "#FF4500",
  steam:     "#1b2838",
  line:      "#00C300",
  uber:      "#000000",
  ebay:      "#E53238",
};

interface SmsPoolService {
  code: string;
  name: string;
  color?: string;
  totalAvailable: number;
  priority: number;
}

interface TvService {
  serviceName: string;
}

interface SmsPoolCountry {
  code: string;
  name: string;
  shortCode?: string;
  flag: string;
  available: number;
  sellPrice: number;
}

type Region = "us" | "other";
type Step = "region" | "service" | "country" | "confirm";

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

function ServiceIcon({ code, name, color }: { code: string; name: string; color: string }) {
  const lowerCode = code.toLowerCase();
  const lowerName = name.toLowerCase();
  const matchedKey = Object.keys(SERVICE_ICONS).find(
    (key) => lowerCode === key || lowerName.includes(key)
  );
  const Icon = matchedKey ? SERVICE_ICONS[matchedKey] : undefined;
  const bg = (matchedKey && SERVICE_COLORS[matchedKey]) || color;
  const iconColor = bg === "#FFFC00" || bg === "#FAE100" ? "#000" : "#fff";

  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: bg }}
    >
      {Icon
        ? <Icon size={22} color={iconColor} />
        : <span className="font-black text-lg" style={{ color: iconColor }}>{name.charAt(0).toUpperCase()}</span>
      }
    </div>
  );
}

export default function NumbersPage() {
  const { toast }  = useToast();
  const { format: formatCurrency, convert } = useCurrency();
  const router     = useRouter();

  const [balance, setBalance]               = useState<number | null>(null);
  const [region, setRegion]                 = useState<Region | null>(null);

  // SMSPool (other countries)
  const [services, setServices]             = useState<SmsPoolService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // TextVerified (US)
  const [tvServices, setTvServices]         = useState<TvService[]>([]);
  const [loadingTvServices, setLoadingTvServices] = useState(false);
  const [tvPrice, setTvPrice]               = useState<number | null>(null);
  const [loadingTvPrice, setLoadingTvPrice] = useState(false);

  const [countries, setCountries]           = useState<SmsPoolCountry[]>([]);
  const [selectedService, setSelectedService] = useState<SmsPoolService | TvService | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<SmsPoolCountry | null>(null);
  const [step, setStep]                     = useState<Step>("region");
  const [serviceSearch, setServiceSearch]   = useState("");
  const [countrySearch, setCountrySearch]   = useState("");
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [purchasing, setPurchasing]         = useState(false);

  useEffect(() => { fetchBalance(); }, []);

  async function fetchBalance() {
    try {
      const res = await fetch("/api/user/balance");
      if (res.ok) setBalance(parseFloat((await res.json()).balance || "0"));
    } catch {}
  }

  async function fetchSmsPoolServices() {
    setLoadingServices(true);
    try {
      const limit = 100;
      const firstRes  = await fetch(`/api/smspool/services?mode=activation&limit=${limit}&page=1`);
      const firstData = await firstRes.json();
      if (!firstRes.ok) throw new Error(firstData?.error || `${firstRes.status}`);

      let allServices = [...(firstData.services || [])];
      const totalPages = Number(firstData.totalPages || 1);
      if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page++) {
          const res = await fetch(`/api/smspool/services?mode=activation&limit=${limit}&page=${page}`);
          const data = await res.json();
          if (res.ok && Array.isArray(data.services)) {
            allServices = allServices.concat(data.services);
          }
        }
      }

      setServices(
        allServices.map((s: any) => ({
          code: String(s.code),
          name: String(s.name || s.code),
          color: "#7C5CFC",
          totalAvailable: Number(s.available ?? 1),
          priority: Number(s.priority ?? 999),
        }))
      );
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load services", variant: "destructive" });
    } finally {
      setLoadingServices(false);
    }
  }

  async function fetchTvServices() {
    setLoadingTvServices(true);
    try {
      const res  = await fetch("/api/numbers/tv-services");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      setTvServices(data.services ?? []);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load US services", variant: "destructive" });
    } finally {
      setLoadingTvServices(false);
    }
  }

  async function fetchCountries(serviceCode: string) {
    setLoadingCountries(true);
    setCountries([]);
    try {
      const res  = await fetch(`/api/smspool/suggested-countries?service=${encodeURIComponent(serviceCode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      setCountries(data.countries ?? []);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load countries", variant: "destructive" });
    } finally {
      setLoadingCountries(false);
    }
  }

  async function fetchTvPrice(serviceName: string) {
    setTvPrice(null);
    setLoadingTvPrice(true);
    try {
      const res  = await fetch(`/api/numbers/tv-price?service=${encodeURIComponent(serviceName)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Price unavailable");
      setTvPrice(data.price);
    } catch (err: any) {
      toast({ title: "Price Error", description: err?.message || "Failed to fetch price", variant: "destructive" });
    } finally {
      setLoadingTvPrice(false);
    }
  }

  function selectRegion(r: Region) {
    setRegion(r);
    setSelectedService(null);
    setSelectedCountry(null);
    setTvPrice(null);
    setServiceSearch("");
    setCountrySearch("");
    setStep("service");
    if (r === "us") {
      if (tvServices.length === 0) fetchTvServices();
    } else {
      if (services.length === 0) fetchSmsPoolServices();
    }
  }

  function selectService(service: SmsPoolService | TvService) {
    setSelectedService(service);
    setSelectedCountry(null);
    if (region === "us") {
      const tvSvc = service as TvService;
      setStep("confirm");
      fetchTvPrice(tvSvc.serviceName);
    } else {
      const smpSvc = service as SmsPoolService;
      setStep("country");
      fetchCountries(smpSvc.code);
    }
  }

  function selectCountry(country: SmsPoolCountry) {
    setSelectedCountry(country);
    setStep("confirm");
  }

  function goBack() {
    if (step === "confirm") {
      if (region === "us") setStep("service");
      else setStep("country");
    } else if (step === "country") {
      setStep("service");
    } else if (step === "service") {
      setStep("region");
      setRegion(null);
    } else {
      setStep("region");
    }
  }

  async function handlePurchase() {
    if (!selectedService) return;
    if (region === "other" && !selectedCountry) return;

    setPurchasing(true);
    try {
      let body: Record<string, any>;

      if (region === "us") {
        const tvSvc = selectedService as TvService;
        body = {
          serviceName: tvSvc.serviceName,
          countryShortCode: "US",
          countryName: "United States",
          country: "1",
          serviceCode: tvSvc.serviceName,
        };
      } else {
        const smpSvc = selectedService as SmsPoolService;
        body = {
          serviceCode: smpSvc.code,
          country:     selectedCountry!.code,
          serviceName: smpSvc.name,
          countryName: selectedCountry!.name,
          countryShortCode: selectedCountry!.shortCode || undefined,
        };
      }

      const res = await fetch("/api/numbers/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        const label = data.provider || data.errorSource;
        const prefix = label ? `${label}: ` : "";
        throw new Error(`${prefix}${data.error || "Purchase failed"}`);
      }

      const displayName = region === "us"
        ? (selectedService as TvService).serviceName
        : (selectedService as SmsPoolService).name;

      toast({
        title: "Number Purchased!",
        description: `${data.number?.phone_number} is ready for ${displayName}`,
      });

      setRegion(null);
      setSelectedService(null);
      setSelectedCountry(null);
      setTvPrice(null);
      setStep("region");
      fetchBalance();
      router.push("/dashboard/numbers/my-numbers");
    } catch (e: any) {
      toast({ title: "Purchase Failed", description: e.message, variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  }

  // Filtered lists
  const filteredSmpServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(serviceSearch.toLowerCase())
  );
  const filteredTvServices = tvServices.filter((s) =>
    s.serviceName.toLowerCase().includes(serviceSearch.toLowerCase())
  );
  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const userPrice = selectedCountry?.sellPrice ?? null;

  // Breadcrumb steps for display
  const crumbs =
    region === "us"
      ? ["Region", "Service", "Confirm"]
      : ["Region", "Service", "Country", "Confirm"];
  const stepIndex: Record<Step, number> = {
    region: 0, service: 1, country: 2, confirm: region === "us" ? 2 : 3,
  };
  const currentIndex = stepIndex[step];

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
      <div className="px-4 md:px-6 pb-2 flex items-center gap-3 text-sm flex-wrap">
        {step !== "region" && (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-xs font-bold text-[#7C5CFC] bg-violet-50 dark:bg-violet-900/30 px-3 py-1.5 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors mr-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        )}
        {crumbs.map((label, i) => (
          <span key={label} className="flex items-center gap-3">
            {i > 0 && <ChevronRight className="h-4 w-4 text-gray-300" />}
            <span className={cn(
              "font-semibold transition-colors",
              i === currentIndex ? "text-[#7C5CFC]" : "text-gray-400"
            )}>
              {i + 1}. {label}
            </span>
          </span>
        ))}
      </div>

      <div className="px-4 pb-32 md:pb-6 md:px-6">

        {/* ── Step 0: Choose Region ─────────────────────────────────────────────── */}
        {step === "region" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-5">
                Choose a region
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* US Numbers */}
                <button
                  onClick={() => selectRegion("us")}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group text-left"
                >
                  <span className="text-5xl">🇺🇸</span>
                  <div className="text-center">
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-base">US Numbers</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">United States only</p>
                  </div>
                </button>

                {/* Other Countries */}
                <button
                  onClick={() => selectRegion("other")}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group text-left"
                >
                  <span className="text-5xl">🌍</span>
                  <div className="text-center">
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-base">Other Countries</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">International numbers</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Select Service ──────────────────────────────────────────── */}
        {step === "service" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Select a service
              </h2>
              <span className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-full",
                region === "us"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
              )}>
                {region === "us" ? "🇺🇸 US Numbers" : "🌍 International Numbers"}
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search service…"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="pl-8 h-9 rounded-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {region === "us" ? (
              loadingTvServices ? (
                <ServiceGridSkeleton />
              ) : filteredTvServices.length === 0 ? (
                <p className="text-center py-10 text-sm text-gray-400">No services found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredTvServices.map((svc) => (
                    <button
                      key={svc.serviceName}
                      onClick={() => selectService(svc)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                    >
                      <ServiceIcon code={svc.serviceName} name={svc.serviceName} color="#7C5CFC" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 text-center leading-tight line-clamp-2">
                        {svc.serviceName}
                      </span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              loadingServices ? (
                <ServiceGridSkeleton />
              ) : filteredSmpServices.length === 0 ? (
                <p className="text-center py-10 text-sm text-gray-400">No services found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredSmpServices.map((service) => (
                    <button
                      key={service.code}
                      onClick={() => selectService(service)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                    >
                      <ServiceIcon code={service.code} name={service.name} color={service.color || "#7C5CFC"} />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 text-center leading-tight line-clamp-2">
                        {service.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {service.totalAvailable.toLocaleString()} avail.
                      </span>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* ── Step 2 (Other): Select Country ─────────────────────────────────── */}
        {step === "country" && region === "other" && selectedService && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/20 border border-[#7C5CFC]/30 rounded-xl px-4 py-3">
              <ServiceIcon
                code={(selectedService as SmsPoolService).code}
                name={(selectedService as SmsPoolService).name}
                color={(selectedService as SmsPoolService).color || "#7C5CFC"}
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected service</p>
                <p className="font-bold text-gray-800 dark:text-gray-100">{(selectedService as SmsPoolService).name}</p>
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

        {/* ── Confirm ──────────────────────────────────────────────────────────── */}
        {step === "confirm" && selectedService && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Order Summary
              </h2>

              {/* Service row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {region === "us" ? (
                    <ServiceIcon
                      code={(selectedService as TvService).serviceName}
                      name={(selectedService as TvService).serviceName}
                      color="#7C5CFC"
                    />
                  ) : (
                    <ServiceIcon
                      code={(selectedService as SmsPoolService).code}
                      name={(selectedService as SmsPoolService).name}
                      color={(selectedService as SmsPoolService).color || "#7C5CFC"}
                    />
                  )}
                  <span className="font-bold text-gray-800 dark:text-gray-100">
                    {region === "us"
                      ? (selectedService as TvService).serviceName
                      : (selectedService as SmsPoolService).name}
                  </span>
                </div>
                <button onClick={() => setStep("service")} className="text-xs text-[#7C5CFC] font-semibold hover:underline">Change</button>
              </div>

              {/* Country row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{region === "us" ? "🇺🇸" : selectedCountry?.flag}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100">
                    {region === "us" ? "United States" : selectedCountry?.name}
                  </span>
                </div>
                {region === "other" && (
                  <button onClick={() => setStep("country")} className="text-xs text-[#7C5CFC] font-semibold hover:underline">Change</button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3" /> One-Time (20 min)
                </span>
              </div>
              <div className="rounded-xl border border-amber-200/80 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Tip: If you use a VPN set to the country you want to receive OTPs from, it can increase your success rate.
                </p>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Price</span>
                  {region === "us" ? (
                    loadingTvPrice ? (
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Fetching price…</span>
                      </span>
                    ) : tvPrice !== null ? (
                      <span className="text-2xl font-black text-[#7C5CFC]">
                        {formatCurrency(convert(tvPrice))}
                      </span>
                    ) : (
                      <span className="text-sm text-red-500">Price unavailable</span>
                    )
                  ) : (
                    <span className="text-2xl font-black text-[#7C5CFC]">
                      {userPrice !== null ? formatCurrency(convert(userPrice)) : "—"}
                    </span>
                  )}
                </div>
                {region === "other" && selectedCountry && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Available now</span>
                    <span className={cn("font-bold", selectedCountry.available > 0 ? "text-green-600" : "text-red-500")}>
                      {selectedCountry.available.toLocaleString()} online
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Your balance</span>
                  <span className="font-bold text-gray-700 dark:text-gray-200">
                    {balance !== null ? formatCurrency(convert(balance)) : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handlePurchase}
                disabled={
                  purchasing ||
                  loadingTvPrice ||
                  (region === "us" && tvPrice === null) ||
                  (region === "other" && selectedCountry?.available === 0)
                }
                className="w-full bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white h-14 text-base font-bold shadow-lg shadow-violet-200 dark:shadow-none rounded-2xl"
              >
                {purchasing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing…</>
                ) : region === "us" ? (
                  loadingTvPrice
                    ? "Fetching price…"
                    : tvPrice !== null
                      ? `Buy Number — ${formatCurrency(convert(tvPrice))}`
                      : "Price unavailable"
                ) : userPrice !== null ? (
                  `Buy Number — ${formatCurrency(convert(userPrice))}`
                ) : (
                  "Select options above"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={purchasing}
                onClick={goBack}
                className="w-full h-11 rounded-2xl border-gray-200 dark:border-gray-700"
              >
                {region === "us" ? "Choose a different service" : "Find another number"}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
