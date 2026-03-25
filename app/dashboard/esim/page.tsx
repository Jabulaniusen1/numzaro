"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Search, Globe, RefreshCw, ChevronLeft, ChevronRight,
  Wifi, Clock, QrCode, BarChart3, X, AlertCircle,
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

          {/* QR Code */}
          {order.qr_code_url && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Scan QR Code</p>
              <img src={order.qr_code_url} alt="eSIM QR Code" className="mx-auto max-w-[180px] rounded-lg" />
            </div>
          )}

          {/* Installation details */}
          {(order.ac || order.smdp_address || order.iccid) && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Installation Details</p>
              {order.smdp_address && (
                <div
                  className="flex items-start justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                  onClick={() => copyToClipboard(order.smdp_address!, "SM-DP+ Address")}
                >
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SM-DP+ Address</p>
                    <p className="text-sm font-mono text-gray-800 dark:text-gray-100 break-all">{order.smdp_address}</p>
                  </div>
                </div>
              )}
              {order.ac && (
                <div
                  className="flex items-start justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                  onClick={() => copyToClipboard(order.ac!, "Activation Code")}
                >
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Activation Code</p>
                    <p className="text-sm font-mono text-gray-800 dark:text-gray-100 break-all">{order.ac}</p>
                  </div>
                </div>
              )}
              {order.iccid && (
                <div
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                  onClick={() => copyToClipboard(order.iccid!, "ICCID")}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">ICCID</p>
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-100">{order.iccid}</p>
                </div>
              )}
            </div>
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

export default function ESimPage() {
  const [tab, setTab] = useState<Tab>("browse");

  // Browse state
  const [packages, setPackages] = useState<ESimPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<ESimPackage | null>(null);
  const [pkgPage, setPkgPage] = useState(1);
  const PKG_PER_PAGE = 12;

  // Orders state
  const [orders, setOrders] = useState<ESimOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<ESimOrder | null>(null);

  const { toast } = useToast();

  const fetchPackages = useCallback(async () => {
    setLoadingPackages(true); setPkgError(null);
    try {
      const res = await fetch("/api/esim/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationCode: locationFilter || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load packages");
      setPackages(data.packages || []);
      setPkgPage(1);
    } catch (err: any) {
      setPkgError(err.message);
    } finally {
      setLoadingPackages(false);
    }
  }, [locationFilter]);

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

  useEffect(() => { if (tab === "browse") fetchPackages(); }, [tab, fetchPackages]);
  useEffect(() => { if (tab === "my-esims") fetchOrders(); }, [tab, fetchOrders]);

  const filteredPackages = packages.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase())
  );
  const pkgTotalPages = Math.max(1, Math.ceil(filteredPackages.length / PKG_PER_PAGE));
  const pagedPackages = filteredPackages.slice((pkgPage - 1) * PKG_PER_PAGE, pkgPage * PKG_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 max-w-5xl mx-auto">

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
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search plans..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPkgPage(1); }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/30"
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Country code (e.g. JP)"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && fetchPackages()}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/30 sm:w-44"
                />
              </div>
              <button
                onClick={fetchPackages}
                disabled={loadingPackages}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#7C5CFC] border border-[#7C5CFC]/30 px-4 py-2.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                <RefreshCw className={cn("h-4 w-4", loadingPackages && "animate-spin")} />
                Search
              </button>
            </div>

            {pkgError && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
                {pkgError}
                <button onClick={fetchPackages} className="text-xs font-semibold underline">Retry</button>
              </div>
            )}

            {/* Package Grid */}
            {loadingPackages ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                  <Wifi className="h-7 w-7 text-[#7C5CFC]" />
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {packages.length === 0 ? "No plans loaded. Click Search to load." : "No plans match your search."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedPackages.map((pkg) => (
                  <div
                    key={pkg.packageCode}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col hover:border-[#7C5CFC]/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">{pkg.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{pkg.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Wifi className="h-3.5 w-3.5 text-[#7C5CFC]" />
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{pkg.dataFormatted}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3.5 w-3.5 text-[#7C5CFC]" />
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{pkg.duration} {pkg.durationUnit}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-black text-[#7C5CFC]">${pkg.chargedUsd.toFixed(2)}</span>
                      <Button
                        size="sm"
                        className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl text-xs px-4"
                        onClick={() => setSelectedPkg(pkg)}
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Packages Pagination */}
            {pkgTotalPages > 1 && !loadingPackages && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  onClick={() => setPkgPage((p) => Math.max(1, p - 1))}
                  disabled={pkgPage === 1}
                  className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-xs text-gray-500 font-semibold">
                  Page {pkgPage} of {pkgTotalPages}
                  <span className="text-gray-400 font-normal ml-1">({filteredPackages.length} plans)</span>
                </span>
                <button
                  onClick={() => setPkgPage((p) => Math.min(pkgTotalPages, p + 1))}
                  disabled={pkgPage === pkgTotalPages}
                  className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
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
          onSuccess={() => { setSelectedPkg(null); setTab("my-esims"); fetchOrders(); }}
        />
      )}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
