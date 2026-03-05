
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Search, List, Loader2, ChevronRight, Clock, Calendar, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
}

interface ActivationPricing {
  mode: "activation";
  price: number;
  available: number;
}

interface RentalOption {
  rentalId: string;
  label: string;
  totalDays: number;
  price: number;
  available: number;
}

interface RentalPricing {
  mode: "rental";
  options: RentalOption[];
}

type Pricing = ActivationPricing | RentalPricing;
type Mode = "activation" | "rental";
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
  const { format: formatCurrency } = useCurrency();

  const [mode, setMode] = useState<Mode>("activation");
  const [balance, setBalance] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [selectedRentalOption, setSelectedRentalOption] = useState<RentalOption | null>(null);
  const [step, setStep] = useState<Step>("service");
  const [serviceSearch, setServiceSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesTotalPages, setServicesTotalPages] = useState(1);
  const [servicesTotal, setServicesTotal] = useState(0);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchServices(1);
  }, []);

  // Re-fetch services when mode changes
  useEffect(() => {
    setSelectedService(null);
    setSelectedCountry(null);
    setPricing(null);
    setStep("service");
    setServicesPage(1);
    fetchServices(1);
  }, [mode]);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/user/balance");
      if (res.ok) setBalance(parseFloat((await res.json()).balance || "0"));
    } catch {}
  };

  const fetchServices = async (page = 1) => {
    setLoadingServices(true);
    try {
      const res = await fetch(`/api/smspool/services?mode=${mode}&page=${page}&limit=24`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setServices(data.services ?? data);
      setServicesPage(data.page ?? 1);
      setServicesTotalPages(data.totalPages ?? 1);
      setServicesTotal(data.total ?? 0);
    } catch {
      toast({ title: "Error", description: "Failed to load services", variant: "destructive" });
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchCountries = async () => {
    if (countries.length) return;
    setLoadingCountries(true);
    try {
      const res = await fetch("/api/smspool/countries");
      if (!res.ok) throw new Error(`${res.status}`);
      setCountries(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load countries", variant: "destructive" });
    } finally {
      setLoadingCountries(false);
    }
  };

  const selectService = (service: Service) => {
    setSelectedService(service);
    setSelectedCountry(null);
    setPricing(null);
    setSelectedRentalOption(null);
    if (mode === "rental") {
      // Rental: the pool IS the country — go straight to confirm
      setStep("confirm");
      fetchPricing(service, null);
    } else {
      setStep("country");
      fetchCountries();
    }
  };

  const fetchPricing = async (service: Service, country: Country | null) => {
    setLoadingPricing(true);
    try {
      const pricingParams = mode === "rental"
        ? `rentalId=${service.code}&mode=rental`
        : `service=${service.code}&country=${country!.code}&mode=activation`;
      const res = await fetch(`/api/smspool/pricing?${pricingParams}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setPricing(data);
      if (data.mode === "rental" && data.options?.length) {
        setSelectedRentalOption(data.options[0]);
      }
    } catch {
      toast({ title: "Error", description: "Could not load pricing", variant: "destructive" });
    } finally {
      setLoadingPricing(false);
    }
  };

  const selectCountry = (country: Country) => {
    if (!selectedService) return;
    setSelectedCountry(country);
    setStep("confirm");
    setPricing(null);
    setSelectedRentalOption(null);
    fetchPricing(selectedService, country);
  };

  const handlePurchase = async () => {
    if (!selectedService || !pricing) return;
    if (mode === "activation" && !selectedCountry) return;
    if (mode === "rental" && !selectedRentalOption) return;

    setPurchasing(true);
    try {
      const body: any = { mode };
      if (mode === "rental" && selectedRentalOption) {
        body.rentalId = selectedRentalOption.rentalId;
        body.rentalName = selectedService.name;
        body.days = selectedRentalOption.totalDays;
      } else {
        body.serviceCode = selectedService.code;
        body.serviceName = selectedService.name;
        body.country = selectedCountry?.code;
        body.countryName = selectedCountry?.name;
      }

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
      setSelectedRentalOption(null);
      setStep("service");
      fetchBalance();
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

  const currentPrice =
    mode === "activation" && pricing?.mode === "activation"
      ? pricing.price
      : selectedRentalOption?.price ?? null;

  const currentAvailable =
    mode === "activation" && pricing?.mode === "activation"
      ? pricing.available
      : selectedRentalOption?.available ?? null;

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Virtual Phone Numbers
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
            Powered by SMSPool
          </p>
        </div>
        <Link href="/dashboard/numbers/my-numbers">
          <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs md:text-sm">
            <List className="h-3.5 w-3.5 mr-1.5" />
            My Numbers
          </Button>
        </Link>
      </div>

      {/* Mode toggle */}
      <div className="px-4 md:px-6 py-3">
        <div className="inline-flex rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 gap-1 shadow-sm">
          <button
            onClick={() => setMode("activation")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              mode === "activation"
                ? "bg-[#7C5CFC] text-white shadow-md shadow-violet-200"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100"
            )}
          >
            <Clock className="h-4 w-4" />
            One-Time
          </button>
          <button
            onClick={() => setMode("rental")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              mode === "rental"
                ? "bg-[#7C5CFC] text-white shadow-md shadow-violet-200"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100"
            )}
          >
            <Calendar className="h-4 w-4" />
            Monthly Rental
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-1">
          {mode === "activation"
            ? "Receive one SMS code — number expires in 20 minutes."
            : "Rent a number for weeks or months — receive unlimited SMS."}
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 md:px-6 pb-2 flex items-center gap-2 text-sm">
        {mode === "rental" ? (
          <>
            <button onClick={() => setStep("service")} className={cn("font-semibold transition-colors", step === "service" ? "text-[#7C5CFC]" : "text-gray-400 hover:text-gray-600")}>
              1. Country
            </button>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className={cn("font-semibold", step === "confirm" ? "text-[#7C5CFC]" : "text-gray-400")}>
              2. Confirm
            </span>
          </>
        ) : (
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
        )}
      </div>

      <div className="px-4 pb-32 md:pb-6 md:px-6">

        {/* Step 1 — Select Service (activation) or Country (rental) */}
        {step === "service" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              {mode === "rental" ? "Select a country" : "Select a service"}
            </h2>
            {mode === "activation" && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search service..."
                  value={serviceSearch}
                  onChange={(e) => { setServiceSearch(e.target.value); setServicesPage(1); }}
                  className="pl-8 h-9 rounded-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            )}
            {loadingServices ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : mode === "rental" ? (
              /* Rental: show 4 country cards with flags */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {services.map((service) => (
                  <button
                    key={service.code}
                    onClick={() => selectService(service)}
                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                  >
                    <span className="text-4xl">{service.flag ?? "🌍"}</span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 text-center">{service.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* Activation: service grid with logos + pagination */
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

        {/* Step 2/3 — Confirm */}
        {step === "confirm" && selectedService && (mode === "rental" || selectedCountry) && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Order Summary
              </h2>

              {mode === "rental" ? (
                /* Rental: show flag + country name (the rental pool) */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedService.flag ?? "🌍"}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{selectedService.name}</span>
                  </div>
                  <button onClick={() => setStep("service")} className="text-xs text-[#7C5CFC] font-semibold hover:underline">Change</button>
                </div>
              ) : (
                /* Activation: show service + country separately */
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
                      <span className="text-2xl">{selectedCountry!.flag}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">{selectedCountry!.name}</span>
                    </div>
                    <button onClick={() => setStep("country")} className="text-xs text-[#7C5CFC] font-semibold hover:underline">Change</button>
                  </div>
                </>
              )}

              {/* Mode badge */}
              <div className="flex items-center gap-2">
                {mode === "activation" ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3" /> One-Time (20 min)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full">
                    <Calendar className="h-3 w-3" /> Rental
                  </span>
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                {loadingPricing ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-[#7C5CFC]" />
                  </div>
                ) : !pricing ? (
                  <p className="text-sm text-red-500 text-center">Pricing unavailable for this combination.</p>
                ) : pricing.mode === "activation" ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Price</span>
                      <span className="text-2xl font-black text-[#7C5CFC]">${pricing.price.toFixed(2)}</span>
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
                ) : (
                  <>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select duration</p>
                    <div className="grid grid-cols-2 gap-2">
                      {pricing.options.map((opt) => {
                        const chosen = selectedRentalOption?.label === opt.label;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => setSelectedRentalOption(opt)}
                            className={cn(
                              "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                              chosen
                                ? "border-[#7C5CFC] bg-violet-50 dark:bg-violet-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-[#7C5CFC]/50"
                            )}
                          >
                            {chosen && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#7C5CFC] rounded-full flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{opt.label}</span>
                            <span className={cn("text-lg font-black", chosen ? "text-[#7C5CFC]" : "text-gray-900 dark:text-gray-100")}>
                              ${opt.price.toFixed(2)}
                            </span>
                            {opt.available !== null && opt.available !== undefined && (
                              <span className="text-[10px] text-gray-400">
                                {opt.available > 0 ? `${opt.available} avail.` : "Unavailable"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
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
                currentAvailable === 0 ||
                (mode === "rental" && !selectedRentalOption)
              }
              className="w-full bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white h-14 text-base font-bold shadow-lg shadow-violet-200 dark:shadow-none rounded-2xl"
            >
              {purchasing ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
              ) : currentPrice !== null ? (
                mode === "rental"
                  ? `Rent ${selectedService.name} Number — $${currentPrice.toFixed(2)}`
                  : `Buy ${selectedService.name} Number — $${currentPrice.toFixed(2)}`
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
