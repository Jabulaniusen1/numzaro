"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  Wifi, Clock, QrCode, BarChart3, X, AlertCircle, Smartphone, Apple, Copy, Check,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ESimPackage {
  packageCode: string;
  slug: string;
  name: string;
  price: number;
  currencyCode: string;
  volume: number;
  duration: number;
  durationUnit: string;
  location: string;
  priceUsd: number;
  chargedUsd: number;
  dataFormatted: string;
}

interface ESimCountry {
  code: string;
  name: string;
  flag: string;
  startingChargedUsd: number;
}

interface ESimOrder {
  id: string;
  package_name: string;
  location: string;
  duration: string;
  data_volume: string;
  order_no: string | null;
  esim_tran_no: string | null;
  iccid: string | null;
  qr_code_url: string | null;
  ac: string | null;
  smdp_address: string | null;
  status: string;
  esim_status: string | null;
  charged_amount: number;
  created_at: string;
}

interface UsageData {
  dataUsedFormatted: string;
  totalDataFormatted: string;
  remainingFormatted: string;
  percentUsed: number;
  lastUpdateTime: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusStyle(status: string) {
  switch (status) {
    case "got_resource": return "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";
    case "in_use":       return "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300";
    case "used_up":      return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300";
    case "used_expired":
    case "unused_expired": return "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300";
    case "cancelled":    return "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
    case "pending":      return "text-violet-700 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300";
    default:             return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300";
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending:        "Pending",
    got_resource:   "Ready",
    in_use:         "Active",
    used_up:        "Used Up",
    used_expired:   "Expired",
    unused_expired: "Expired",
    cancelled:      "Cancelled",
    failed:         "Failed",
  };
  return map[status] ?? status;
}

function flagFromIso2(iso2?: string) {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const code = iso2.toUpperCase();
  const base = 0x1f1e6;
  const cp1 = base + (code.charCodeAt(0) - 65);
  const cp2 = base + (code.charCodeAt(1) - 65);
  if (cp1 < base || cp2 < base) return "🌍";
  return String.fromCodePoint(cp1, cp2);
}

// ─── Buy Modal ────────────────────────────────────────────────────────────────

function BuyModal({ pkg, onClose, onSuccess }: { pkg: ESimPackage; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBuy = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/esim/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageCode: pkg.packageCode,
          packageName: pkg.name,
          location: pkg.location,
          duration: `${pkg.duration} ${pkg.durationUnit}`,
          dataVolume: pkg.dataFormatted,
          providerPrice: pkg.price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");
      toast({ title: "eSIM Purchased!", description: `${pkg.name} is ready.` });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Confirm Purchase</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{pkg.name}</p>

        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Location</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">{pkg.location}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Data</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">{pkg.dataFormatted}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Validity</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">{pkg.duration} {pkg.durationUnit}</span>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between text-base font-bold">
            <span className="text-gray-700 dark:text-gray-200">Total</span>
            <span className="text-[#7C5CFC]">${pkg.chargedUsd.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl"
            onClick={handleBuy}
            disabled={loading}
          >
            {loading ? "Processing..." : "Buy Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── eSIM Connect Card ────────────────────────────────────────────────────────

function ESimConnectCard({
  order,
  copyToClipboard,
}: {
  order: ESimOrder;
  copyToClipboard: (text: string, label: string) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text, label);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const lpaString = order.smdp_address && order.ac
    ? `LPA:1$${order.smdp_address}$${order.ac}`
    : null;

  const iosDeepLink = lpaString
    ? `https://esim.apple.com/subscribe?address=${encodeURIComponent(order.smdp_address ?? "")}&iccid=${encodeURIComponent(order.iccid ?? "")}`
    : null;

  const androidDeepLink = lpaString
    ? `https://esimsetup.android.com/esim_qr_code?qrCode=${encodeURIComponent(lpaString)}`
    : null;

  return (
    <div className="rounded-2xl border border-[#7C5CFC]/20 bg-gradient-to-br from-[#7C5CFC]/5 to-purple-50 dark:from-[#7C5CFC]/10 dark:to-gray-800/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#7C5CFC]/10 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="h-4 w-4 text-[#7C5CFC]" />
          <p className="text-sm font-bold text-gray-800 dark:text-white">Install Your eSIM</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Scan the QR code or tap a button below to activate on your device.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* QR Code */}
        {order.qr_code_url && (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-inner border border-gray-100 dark:border-gray-700">
              <img
                src={order.qr_code_url}
                alt="eSIM QR Code"
                className="w-[200px] h-[200px] object-contain rounded-md"
              />
            </div>
            <p className="text-[11px] text-gray-400 text-center">
              Point your camera at this code in your phone's eSIM settings.
            </p>
          </div>
        )}

        {/* Installation Details */}
        {(order.smdp_address || order.ac || order.iccid) && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Installation Details</p>
            {order.smdp_address && (
              <div
                className="flex items-start justify-between gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
                onClick={() => handleCopy(order.smdp_address!, "SM-DP+ Address")}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">SM-DP+ Address</p>
                  <p className="text-xs font-mono text-gray-800 dark:text-gray-100 break-all">{order.smdp_address}</p>
                </div>
                {copied === "SM-DP+ Address"
                  ? <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  : <Copy className="h-4 w-4 text-gray-400 group-hover:text-[#7C5CFC] flex-shrink-0 mt-0.5 transition-colors" />
                }
              </div>
            )}
            {order.ac && (
              <div
                className="flex items-start justify-between gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
                onClick={() => handleCopy(order.ac!, "Activation Code")}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Activation Code</p>
                  <p className="text-xs font-mono text-gray-800 dark:text-gray-100 break-all">{order.ac}</p>
                </div>
                {copied === "Activation Code"
                  ? <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  : <Copy className="h-4 w-4 text-gray-400 group-hover:text-[#7C5CFC] flex-shrink-0 mt-0.5 transition-colors" />
                }
              </div>
            )}
            {order.iccid && (
              <div
                className="flex items-start justify-between gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
                onClick={() => handleCopy(order.iccid!, "ICCID")}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">ICCID</p>
                  <p className="text-xs font-mono text-gray-800 dark:text-gray-100">{order.iccid}</p>
                </div>
                {copied === "ICCID"
                  ? <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  : <Copy className="h-4 w-4 text-gray-400 group-hover:text-[#7C5CFC] flex-shrink-0 mt-0.5 transition-colors" />
                }
              </div>
            )}
          </div>
        )}

        {/* Connect buttons */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Connect Your Device</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={iosDeepLink ?? "https://support.apple.com/en-us/111900"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-gray-900 transition-colors shadow-sm"
            >
              <Apple className="h-4 w-4" />
              Connect on iOS
            </a>
            <a
              href={androidDeepLink ?? "https://support.google.com/android/answer/9449946"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#3DDC84] text-black text-xs font-semibold hover:bg-[#34c778] transition-colors shadow-sm"
            >
              <Smartphone className="h-4 w-4" />
              Connect on Android
            </a>
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            Opens your device's eSIM setup screen directly.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: ESimOrder; onClose: () => void }) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const { toast } = useToast();

  const fetchUsage = async () => {
    if (!order.esim_tran_no) return;
    setLoadingUsage(true);
    try {
      const res = await fetch("/api/esim/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (res.ok) setUsage(data.usage);
    } catch {}
    finally { setLoadingUsage(false); }
  };

  useEffect(() => {
    if (["in_use", "used_up"].includes(order.status)) fetchUsage();
  }, [order.id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${label} copied` });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{order.package_name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{order.location} · {order.data_volume} · {order.duration}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-4">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-bold px-3 py-1 rounded-full", statusStyle(order.status))}>
              {statusLabel(order.status)}
            </span>
            <span className="text-xs text-gray-400">${order.charged_amount.toFixed(2)}</span>
          </div>

          {/* QR Code + Installation Details + Connect Buttons */}
          {(order.qr_code_url || order.ac || order.smdp_address || order.iccid) && (
            <ESimConnectCard order={order} copyToClipboard={copyToClipboard} />
          )}

          {/* Usage */}
          {order.esim_tran_no && ["in_use", "used_up", "got_resource"].includes(order.status) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Data Usage</p>
                <button
                  onClick={fetchUsage}
                  disabled={loadingUsage}
                  className="text-xs text-[#7C5CFC] flex items-center gap-1"
                >
                  <RefreshCw className={cn("h-3 w-3", loadingUsage && "animate-spin")} />
                  Refresh
                </button>
              </div>
              {loadingUsage ? (
                <Skeleton className="h-14 rounded-xl" />
              ) : usage ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Used</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{usage.dataUsedFormatted} / {usage.totalDataFormatted}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-[#7C5CFC] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, usage.percentUsed)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{usage.percentUsed}% used</span>
                    <span>{usage.remainingFormatted} remaining</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Usage data unavailable. Updated every 2-3 hours.</p>
              )}
            </div>
          )}

          <div className="text-xs text-gray-400 pt-1">
            Purchased {new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "browse" | "my-esims";
type BrowseStep = "country" | "plans";

export default function ESimPage() {
  const [tab, setTab] = useState<Tab>("browse");

  // Browse state
  const [browseStep, setBrowseStep] = useState<BrowseStep>("country");
  const [countries, setCountries] = useState<ESimCountry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<ESimCountry | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [packages, setPackages] = useState<ESimPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const [dropdownPkg, setDropdownPkg] = useState<ESimPackage | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<ESimPackage | null>(null);

  // Orders state
  const [orders, setOrders] = useState<ESimOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<ESimOrder | null>(null);

  const { toast } = useToast();

  const fetchCountries = useCallback(async () => {
    setLoadingCountries(true);
    setPkgError(null);
    try {
      const res = await fetch("/api/esim/countries");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load countries");
      setCountries(
        (data.countries || []).map((c: any) => ({
          code: String(c.code || "").toUpperCase(),
          name: String(c.name || c.code || "Country"),
          flag: c.flag || flagFromIso2(String(c.code || "").toUpperCase()),
          startingChargedUsd: Number(c.startingChargedUsd || 0),
        }))
      );
    } catch (err: any) {
      setPkgError(err.message);
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  const fetchPackages = useCallback(async (countryCode?: string) => {
    const code = String(countryCode || selectedCountry?.code || "").trim().toUpperCase();
    if (!code) return;
    setLoadingPackages(true); setPkgError(null);
    try {
      const res = await fetch("/api/esim/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load packages");
      setPackages(data.packages || []);
      setDropdownPkg(null);
      setBrowseStep("plans");
    } catch (err: any) {
      setPkgError(err.message);
    } finally {
      setLoadingPackages(false);
    }
  }, [selectedCountry?.code]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/esim/orders?page=${ordersPage}&limit=20`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load eSIMs");
      setOrders(data.orders || []);
      setOrdersTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingOrders(false);
    }
  }, [ordersPage]);

  useEffect(() => {
    if (tab !== "browse") return;
    setBrowseStep("country");
    setSelectedCountry(null);
    setPackages([]);
    setDropdownPkg(null);
    fetchCountries();
  }, [tab, fetchCountries]);
  useEffect(() => { if (tab === "my-esims") fetchOrders(); }, [tab, fetchOrders]);

  const filteredCountries = countries.filter((c) => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-24 md:pb-6 md:px-6 md:pt-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            eSIM Data Plans
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Buy data plans for your eSIM-compatible device
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["browse", "my-esims"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                tab === t
                  ? "bg-[#7C5CFC] text-white shadow-md shadow-violet-200 dark:shadow-none"
                  : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#7C5CFC] hover:text-[#7C5CFC]"
              )}
            >
              {t === "browse" ? "Browse Plans" : "My eSIMs"}
            </button>
          ))}
        </div>

        {/* ── Browse Tab ── */}
        {tab === "browse" && (
          <>
            {pkgError && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
                {pkgError}
                <button
                  onClick={() => (browseStep === "country" ? fetchCountries() : fetchPackages())}
                  className="text-xs font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {browseStep === "country" ? (
              <>
                <div className="relative mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/30"
                  />
                </div>

                {loadingCountries ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                  </div>
                ) : filteredCountries.length === 0 ? (
                  <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      No countries found.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          setSelectedCountry(country);
                          setDropdownPkg(null);
                          fetchPackages(country.code);
                        }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:border-[#7C5CFC]/60 hover:shadow-md transition-all"
                      >
                        <div className="text-3xl mb-2">{country.flag}</div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{country.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{country.code}</p>
                        <p className="text-xs text-[#7C5CFC] font-semibold mt-2">
                          From ${country.startingChargedUsd.toFixed(2)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setBrowseStep("country");
                      setPackages([]);
                      setDropdownPkg(null);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Change Country
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedCountry?.flag || "🌍"}</span>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Selected Country</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {selectedCountry?.name || selectedCountry?.code || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20 p-4 space-y-2">
                  <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
                    {selectedCountry?.name}
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    You are purchasing an eSIM, please make sure that eSIMs are supported on your device and that the eSIM is activated within 180 days. After purchase, you will be redirected to your eSIMs page and you can activate it instantly.
                  </p>
                  <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">Important:</p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    eSIMs are non-refundable and non-transferable, please keep in mind that these are data-only SIMs. The eSIM can only be redeemed in the country of the eSIM, as we require roaming the eSIM IP might not always match the country.
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    We cannot refund your eSIM in case your device does not support eSIM, please make sure to check if your device supports it before purchasing.
                  </p>
                </div>

                <div className="flex items-center justify-end mb-4">
                  <button
                    onClick={() => fetchPackages()}
                    disabled={loadingPackages}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#7C5CFC] border border-[#7C5CFC]/30 px-4 py-2.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    <RefreshCw className={cn("h-4 w-4", loadingPackages && "animate-spin")} />
                    Refresh Plans
                  </button>
                </div>

                {loadingPackages ? (
                  <Skeleton className="h-12 rounded-xl w-full mb-4" />
                ) : packages.length === 0 ? (
                  <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                      <Wifi className="h-7 w-7 text-[#7C5CFC]" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      No plans found for this country.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                        Select a Plan
                      </label>
                      <select
                        value={dropdownPkg?.packageCode ?? ""}
                        onChange={(e) => {
                          const pkg = packages.find((p) => p.packageCode === e.target.value) ?? null;
                          setDropdownPkg(pkg);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/30 appearance-none cursor-pointer"
                      >
                        <option value="">— Choose a plan —</option>
                        {packages.map((pkg) => (
                          <option key={pkg.packageCode} value={pkg.packageCode}>
                            {pkg.dataFormatted} · {pkg.duration} {pkg.durationUnit} — ${pkg.chargedUsd.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {dropdownPkg && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#7C5CFC]/40 p-5 shadow-sm">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">{dropdownPkg.name}</p>
                        <p className="text-xs text-gray-400 mb-4">{dropdownPkg.location}</p>
                        <div className="grid grid-cols-3 gap-3 mb-5">
                          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                            <Wifi className="h-4 w-4 text-[#7C5CFC] mb-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Data</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">{dropdownPkg.dataFormatted}</span>
                          </div>
                          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                            <Clock className="h-4 w-4 text-[#7C5CFC] mb-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Validity</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">{dropdownPkg.duration} {dropdownPkg.durationUnit}</span>
                          </div>
                          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                            <BarChart3 className="h-4 w-4 text-[#7C5CFC] mb-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Price</span>
                            <span className="text-sm font-bold text-[#7C5CFC] mt-0.5">${dropdownPkg.chargedUsd.toFixed(2)}</span>
                          </div>
                        </div>
                        <Button
                          className="w-full bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl"
                          onClick={() => setSelectedPkg(dropdownPkg)}
                        >
                          Buy This Plan
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── My eSIMs Tab ── */}
        {tab === "my-esims" && (
          <>
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#7C5CFC] border border-[#7C5CFC]/30 px-3 py-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingOrders && "animate-spin")} />
                Refresh
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              {loadingOrders ? (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                    <QrCode className="h-7 w-7 text-[#7C5CFC]" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">No eSIMs yet</p>
                  <Button size="sm" className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl" onClick={() => setTab("browse")}>
                    Browse Plans
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{order.package_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.location} · {order.data_volume} · {order.duration}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", statusStyle(order.status))}>
                          {statusLabel(order.status)}
                        </span>
                        <span className="text-xs text-gray-400">${order.charged_amount.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {ordersTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                  disabled={ordersPage === 1 || loadingOrders}
                  className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-xs text-gray-500 font-semibold">Page {ordersPage} of {ordersTotalPages}</span>
                <button
                  onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                  disabled={ordersPage === ordersTotalPages || loadingOrders}
                  className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedPkg && (
        <BuyModal
          pkg={selectedPkg}
          onClose={() => setSelectedPkg(null)}
          onSuccess={() => { setSelectedPkg(null); setDropdownPkg(null); setTab("my-esims"); fetchOrders(); }}
        />
      )}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
