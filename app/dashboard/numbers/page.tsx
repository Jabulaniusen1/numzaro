
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Search, List, Loader2, ChevronRight, Clock, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Service {
  code: string;
  name: string;
  logo: string | null;
  flag?: string;
  available: number;
}

interface Country {
  code: string;
  name: string;
  flag: string;
  shortCode?: string;
}

interface Pricing {
  price: number;
  rawPrice: number;
  available: number | null;
}
type Step = "service" | "country" | "confirm";

function ServiceLogo({ logo, name }: { logo: string | null; name: string }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-100 dark:border-gray-700 flex items-center justify-center p-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={name}
        width={36}
        height={36}
        className="object-contain w-full h-full"
        onError={() => setErr(true)}
      />
    </div>
  );
}

export default function NumbersPage() {
  const { toast } = useToast();
  const { format: formatCurrency, convert } = useCurrency();
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [step, setStep] = useState<Step>("service");
  const [serviceSearch, setServiceSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesTotalPages, setServicesTotalPages] = useState(1);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchServices(1);
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/user/balance");
      if (res.ok) setBalance(parseFloat((await res.json()).balance || "0"));
    } catch {}
  };

  const fetchServices = async (page = 1) => {
    setLoadingServices(true);
    try {
      const res = await fetch(`/api/smspool/services?page=${page}&limit=24&mode=activation`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      setServices(data.services ?? data);
      setServicesPage(data.page ?? 1);
      setServicesTotalPages(data.totalPages ?? 1);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load services", variant: "destructive" });
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchCountries = async () => {
    if (countries.length) return;
    setLoadingCountries(true);
    try {
      const res = await fetch("/api/smspool/countries");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      setCountries(data);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load countries", variant: "destructive" });
    } finally {
      setLoadingCountries(false);
    }
  };

  const selectService = (service: Service) => {
    setSelectedService(service);
    setSelectedCountry(null);
    setPricing(null);
    setStep("country");
    fetchCountries();
  };

  const fetchPricing = async (service: Service, country: Country | null) => {
    setLoadingPricing(true);
    try {
      const pricingParams = `service=${service.code}&country=${country!.code}`;
      const res = await fetch(`/api/smspool/pricing?${pricingParams}&mode=activation`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      if (!data) throw new Error("Empty pricing response");
      setPricing(data);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not load pricing", variant: "destructive" });
    } finally {
      setLoadingPricing(false);
    }
  };

  const selectCountry = (country: Country) => {
    if (!selectedService) return;
    setSelectedCountry(country);
    setStep("confirm");
    setPricing(null);
    fetchPricing(selectedService, country);
  };

  const handlePurchase = async () => {
    if (!selectedService || !pricing) return;
    if (!selectedCountry) return;

    setPurchasing(true);
    try {
      const body: any = {
        serviceCode: selectedService.code,
        serviceName: selectedService.name,
        country: selectedCountry?.code,
        countryName: selectedCountry?.name,
        countryShortCode: selectedCountry?.shortCode,
      };

      const res = await fetch("/api/numbers/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");

      toast({
        title: "Number Purchased!",
        description: `${data.number?.phone_number} is ready for ${selectedService.name}`,
      });

      setSelectedService(null);
      setSelectedCountry(null);
      setPricing(null);
      setStep("service");
      fetchBalance();
      router.push("/dashboard/numbers/my-numbers");
    } catch (e: any) {
      toast({ title: "Purchase Failed", description: e.message, variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );
  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const currentPrice = pricing ? pricing.price : null;
  const currentAvailable = pricing ? pricing.available : null;

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

      {/* Mode info */}
      <div className="px-4 md:px-6 py-3">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 shadow-sm">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">One-Time Activation</span>
          <span className="text-xs text-gray-400">• expires in 20 minutes</span>
        </div>
      </div>

      {/* Breadcrumb + Back button */}
      <div className="px-4 md:px-6 pb-2 flex items-center gap-3 text-sm">
        {/* Back button — visible whenever not on the first step */}
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

        <>
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
        </>
      </div>

      <div className="px-4 pb-32 md:pb-6 md:px-6">

        {/* Step 1 — Select Service */}
        {step === "service" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Select a service
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search service..."
                value={serviceSearch}
                onChange={(e) => { setServiceSearch(e.target.value); setServicesPage(1); }}
                className="pl-8 h-9 rounded-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            {loadingServices ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredServices.map((service) => (
                    <button
                      key={service.code}
                      onClick={() => selectService(service)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group"
                    >
                      <ServiceLogo logo={service.logo} name={service.name} />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 text-center leading-tight line-clamp-2">{service.name}</span>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {servicesTotalPages > 1 && !serviceSearch && (
                  <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => { const p = servicesPage - 1; setServicesPage(p); fetchServices(p); }}
                      disabled={servicesPage <= 1}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Page {servicesPage} of {servicesTotalPages}
                    </span>
                    <button
                      onClick={() => { const p = servicesPage + 1; setServicesPage(p); fetchServices(p); }}
                      disabled={servicesPage >= servicesTotalPages}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2 — Select Country */}
        {step === "country" && selectedService && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/20 border border-[#7C5CFC]/30 rounded-xl px-4 py-3">
              <ServiceLogo logo={selectedService.logo} name={selectedService.name} />
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
                  placeholder="Search country..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="pl-8 h-9 rounded-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              {loadingCountries ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === "confirm" && selectedService && selectedCountry && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Order Summary
              </h2>

              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ServiceLogo logo={selectedService.logo} name={selectedService.name} />
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
              </>

              {/* Mode badge */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3" /> One-Time (20 min)
                </span>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                {loadingPricing ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-[#7C5CFC]" />
                  </div>
                ) : !pricing ? (
                  <p className="text-sm text-red-500 text-center">Pricing unavailable for this combination.</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Price</span>
                      <span className="text-2xl font-black text-[#7C5CFC]">{formatCurrency(convert(pricing.price))}</span>
                    </div>
                    {pricing.available !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Available now</span>
                        <span className={cn("font-bold", pricing.available > 0 ? "text-green-600" : "text-red-500")}>
                          {pricing.available > 0 ? `${pricing.available} online` : "None available"}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {pricing && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500">Your balance</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">
                      {balance !== null ? formatCurrency(balance) : "—"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={
                purchasing ||
                loadingPricing ||
                !pricing ||
                currentAvailable === 0
              }
              className="w-full bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white h-14 text-base font-bold shadow-lg shadow-violet-200 dark:shadow-none rounded-2xl"
            >
              {purchasing ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
              ) : currentPrice !== null ? (
                `Buy ${selectedService.name} Number — ${formatCurrency(convert(currentPrice))}`
              ) : (
                "Select options above"
              )}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
