"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Search, List, Loader2, ChevronRight, Clock, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Service {
  code: string;
  name: string;
  logo: string | null;
}

interface AreaCode {
  code: string;
  name: string;
  flag: string;
}

interface RentalOption {
  duration: string;
  label: string;
  days: number;
  price: number;
  rawPrice: number;
}

type Step = "service" | "area" | "duration" | "confirm";

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

export default function RentalsPage() {
  const { toast } = useToast();
  const { format: formatCurrency, convert, convertFromUSD } = useCurrency();
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [areas, setAreas] = useState<AreaCode[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaCode | null>(null);
  const [options, setOptions] = useState<RentalOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<RentalOption | null>(null);
  const [step, setStep] = useState<Step>("service");
  const [serviceSearch, setServiceSearch] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesTotalPages, setServicesTotalPages] = useState(1);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [renewable, setRenewable] = useState(true);

  useEffect(() => {
    fetchBalance();
    fetchServices(1, renewable);
  }, [renewable]);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/user/balance");
      if (res.ok) setBalance(parseFloat((await res.json()).balance || "0"));
    } catch {}
  };

  const fetchServices = async (page = 1, isRenewable = true) => {
    setLoadingServices(true);
    try {
      const reservationType = isRenewable ? "renewable" : "nonrenewable";
      const res = await fetch(`/api/grizzly/services?page=${page}&limit=24&reservationType=${reservationType}`);
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

  const fetchAreas = async () => {
    if (areas.length) return;
    setLoadingAreas(true);
    try {
      const res = await fetch("/api/grizzly/countries");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      setAreas(data);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load area codes", variant: "destructive" });
    } finally {
      setLoadingAreas(false);
    }
  };

  const selectService = (service: Service) => {
    setSelectedService(service);
    setSelectedArea(null);
    setSelectedOption(null);
    setOptions([]);
    setStep("area");
    fetchAreas();
  };

  const fetchOptions = async (service: Service, area: AreaCode) => {
    setLoadingOptions(true);
    try {
      const pricingParams = `mode=rental&service=${service.code}&country=${area.code}&isRenewable=${renewable}`;
      const res = await fetch(`/api/grizzly/pricing?${pricingParams}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      if (!data?.options) throw new Error("No pricing options returned");
      setOptions(data.options);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not load rental pricing", variant: "destructive" });
    } finally {
      setLoadingOptions(false);
    }
  };

  const selectArea = (area: AreaCode) => {
    if (!selectedService) return;
    setSelectedArea(area);
    setSelectedOption(null);
    setOptions([]);
    setStep("duration");
    fetchOptions(selectedService, area);
  };

  const handlePurchase = async () => {
    if (!selectedService || !selectedArea || !selectedOption) return;
    setPurchasing(true);
    try {
      const providerLabel = (provider?: string) => {
        if (!provider) return null;
        if (provider === "smspool") return "SMSPool";
        if (provider === "textverified") return "TextVerified";
        if (provider === "platfone") return "Platfone";
        return provider;
      };

      const body = {
        serviceName: selectedService.code,
        areaCode: selectedArea.code === "any" ? null : selectedArea.code,
        isRenewable: renewable,
        duration: selectedOption.duration,
      };

      const res = await fetch("/api/rentals/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        const label = providerLabel(data.provider || data.errorSource);
        const prefix = label ? `${label}: ` : "";
        throw new Error(`${prefix}${data.error || "Purchase failed"}`);
      }

      toast({
        title: "Rental Purchased!",
        description: `${data.number?.phone_number} is ready for ${selectedService.name}`,
      });

      setSelectedService(null);
      setSelectedArea(null);
      setSelectedOption(null);
      setOptions([]);
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
  const filteredAreas = areas.filter((c) =>
    c.name.toLowerCase().includes(areaSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Rental Numbers
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/numbers">
            <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs md:text-sm">
              <List className="h-3.5 w-3.5 mr-1.5" />
              One-Time
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
          <Calendar className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Long-Term Rental</span>
          <span className="text-xs text-gray-400">• renewable or fixed term</span>
        </div>
      </div>

      {/* Toggle */}
      <div className="px-4 md:px-6 pb-2">
        <div className="inline-flex rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
          {(["renewable", "nonrenewable"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setRenewable(mode === "renewable"); setStep("service"); }}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-xl transition-all",
                (renewable && mode === "renewable") || (!renewable && mode === "nonrenewable")
                  ? "bg-[#7C5CFC] text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              {mode === "renewable" ? "Renewable" : "Fixed Term"}
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumb + Back button */}
      <div className="px-4 md:px-6 pb-2 flex items-center gap-3 text-sm">
        {step !== "service" && (
          <button
            onClick={() => {
              if (step === "confirm") setStep("duration");
              else if (step === "duration") setStep("area");
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
          <button onClick={() => selectedService && setStep("area")} disabled={!selectedService} className={cn("font-semibold transition-colors", step === "area" ? "text-[#7C5CFC]" : "text-gray-400", selectedService ? "hover:text-gray-600" : "cursor-default")}>
            2. Area Code
          </button>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <button onClick={() => selectedArea && setStep("duration")} disabled={!selectedArea} className={cn("font-semibold transition-colors", step === "duration" ? "text-[#7C5CFC]" : "text-gray-400", selectedArea ? "hover:text-gray-600" : "cursor-default")}>
            3. Duration
          </button>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className={cn("font-semibold", step === "confirm" ? "text-[#7C5CFC]" : "text-gray-400")}>
            4. Confirm
          </span>
        </>
      </div>

      <div className="px-4 pb-32 md:pb-6 md:px-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredServices.map((service) => (
                    <button
                      key={service.code}
                      onClick={() => selectService(service)}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-left"
                    >
                      <ServiceLogo logo={service.logo} name={service.name} />
                      <div>
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{service.name}</div>
                        <div className="text-xs text-gray-400">Rental service</div>
                      </div>
                    </button>
                  ))}
                </div>
                {servicesTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => { const p = servicesPage - 1; setServicesPage(p); fetchServices(p, renewable); }}
                      disabled={servicesPage <= 1}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Page {servicesPage} of {servicesTotalPages}
                    </span>
                    <button
                      onClick={() => { const p = servicesPage + 1; setServicesPage(p); fetchServices(p, renewable); }}
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

        {step === "area" && selectedService && (
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
                Select an area code
              </h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search area code..."
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  className="pl-8 h-9 rounded-full text-xs border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              {loadingAreas ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredAreas.map((area) => (
                    <button
                      key={area.code}
                      onClick={() => selectArea(area)}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                    >
                      <span className="text-3xl">{area.flag}</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 text-center">{area.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === "duration" && selectedService && selectedArea && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Select a duration
              </h2>
              {loadingOptions ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {options.map((opt) => (
                    <button
                      key={opt.duration}
                      onClick={() => { setSelectedOption(opt); setStep("confirm"); }}
                      className="flex flex-col gap-1 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#7C5CFC] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-left"
                    >
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{opt.label}</div>
                      <div className="text-xs text-gray-400">{opt.days} days</div>
                      <div className="text-lg font-black text-[#7C5CFC]">{formatCurrency(convertFromUSD(opt.price))}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === "confirm" && selectedService && selectedArea && selectedOption && (
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
                    <span className="text-2xl">{selectedArea.flag}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{selectedArea.name}</span>
                  </div>
                  <button onClick={() => setStep("area")} className="text-xs text-[#7C5CFC] font-semibold hover:underline">Change</button>
                </div>
              </>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3" /> {renewable ? "Renewable" : "Fixed Term"} • {selectedOption.label}
                </span>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Price</span>
                  <span className="text-2xl font-black text-[#7C5CFC]">{formatCurrency(convertFromUSD(selectedOption.price))}</span>
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Your balance</span>
                  <span className="font-bold text-gray-700 dark:text-gray-200">
                    {balance !== null ? formatCurrency(balance) : "—"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={!selectedOption || purchasing}
              className="w-full rounded-2xl bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white h-12 text-sm font-bold shadow-lg shadow-violet-200"
            >
              {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Purchase Rental"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
