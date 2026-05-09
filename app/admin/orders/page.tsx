"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import {
  Loader2, Search, ShoppingBag, Phone, Wifi, Package,
  RefreshCw, KeyRound, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type SourceType = "social_boost" | "number" | "esim";

interface OrderRecord {
  id: string;
  source: SourceType;
  display_id: string;
  user_id: string;
  user_email: string | null;
  user_full_name: string | null;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  details: Record<string, any>;
}

interface OrdersPayload {
  allOrders: OrderRecord[];
  socialBoostOrders: OrderRecord[];
  numberOrders: OrderRecord[];
  esimOrders: OrderRecord[];
  totals: { all: number; socialBoost: number; number: number; esim: number };
}

const SOURCE_LABEL: Record<SourceType, string> = {
  social_boost: "Social",
  number: "Number",
  esim: "eSIM",
};

const SOURCE_COLOR: Record<SourceType, string> = {
  social_boost: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  number:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  esim:         "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (["completed", "success"].includes(s))
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (["pending", "processing", "in_progress"].includes(s))
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  if (["failed", "cancelled", "canceled", "refunded"].includes(s))
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300";
}

type TabValue = "all" | SourceType;

const TABS: { value: TabValue; label: string; icon: React.ElementType }[] = [
  { value: "all",          label: "All",     icon: Package     },
  { value: "social_boost", label: "Social",  icon: ShoppingBag },
  { value: "number",       label: "Numbers", icon: Phone       },
  { value: "esim",         label: "eSIM",    icon: Wifi        },
];

const ALREADY_REFUNDED = ["refunded"];

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const { format, convert } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabValue>("all");
  const [orders, setOrders] = useState<OrdersPayload>({
    allOrders: [], socialBoostOrders: [], numberOrders: [], esimOrders: [],
    totals: { all: 0, socialBoost: 0, number: 0, esim: 0 },
  });

  const [refundTarget, setRefundTarget] = useState<OrderRecord | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders?limit=200");
      if (!response.ok) throw new Error("Failed to fetch orders");
      setOrders(await response.json());
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefundLoading(true);
    try {
      const res = await fetch("/api/admin/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: refundTarget.id, source: refundTarget.source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed");
      toast({
        title: "Refund issued",
        description: `${format(convert(refundTarget.amount))} refunded to ${refundTarget.user_email}.`,
      });
      setRefundTarget(null);
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRefundLoading(false);
    }
  };

  const selectedOrders = useMemo(() => {
    if (tab === "all")          return orders.allOrders;
    if (tab === "social_boost") return orders.socialBoostOrders;
    if (tab === "number")       return orders.numberOrders;
    return orders.esimOrders;
  }, [orders, tab]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return selectedOrders;
    return selectedOrders.filter((o) => {
      const details = JSON.stringify(o.details || {}).toLowerCase();
      return (
        String(o.display_id || "").toLowerCase().includes(q) ||
        String(o.status || "").toLowerCase().includes(q) ||
        String(o.user_email || "").toLowerCase().includes(q) ||
        String(o.user_full_name || "").toLowerCase().includes(q) ||
        SOURCE_LABEL[o.source].toLowerCase().includes(q) ||
        details.includes(q)
      );
    });
  }, [search, selectedOrders]);

  const getDetails = (o: OrderRecord) => {
    if (o.source === "social_boost") {
      const qty = o.details?.quantity ? `Qty ${o.details.quantity}` : null;
      return [o.details?.service_name || "Service", qty].filter(Boolean).join(" • ");
    }
    if (o.source === "number") {
      const country = o.details?.country_name ? ` (${o.details.country_name})` : "";
      return `${o.details?.phone_number || "Unknown"}${country}`;
    }
    const loc = o.details?.location ? ` • ${o.details.location}` : "";
    const data = o.details?.data_volume ? ` • ${o.details.data_volume}` : "";
    return `${o.details?.package_name || "eSIM Package"}${loc}${data}`;
  };

  const OTPBadges = ({ o }: { o: OrderRecord }) => {
    if (o.source !== "number") return null;
    const codes: { code: string; status: string }[] = o.details?.otp_codes || [];
    if (codes.length === 0)
      return <span className="text-[10px] text-gray-400 italic">No OTP yet</span>;
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {codes.map((otp, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs"
          >
            <KeyRound className="h-2.5 w-2.5" />
            {otp.code}
          </span>
        ))}
      </div>
    );
  };

  const RefundButton = ({ o }: { o: OrderRecord }) => {
    const alreadyRefunded = ALREADY_REFUNDED.includes(o.status.toLowerCase());
    if (alreadyRefunded) return null;
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2.5 text-xs rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20 whitespace-nowrap"
        onClick={() => setRefundTarget(o)}
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        Refund
      </Button>
    );
  };

  const tabCount = (v: TabValue) => {
    if (v === "all")          return orders.totals.all;
    if (v === "social_boost") return orders.totals.socialBoost;
    if (v === "number")       return orders.totals.number;
    return orders.totals.esim;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#7C5CFC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: "Total Orders", value: orders.totals.all,         icon: Package,     bg: "bg-violet-50 dark:bg-violet-900/20", ic: "text-violet-500" },
          { label: "Social Boost", value: orders.totals.socialBoost, icon: ShoppingBag, bg: "bg-blue-50 dark:bg-blue-900/20",     ic: "text-blue-500"   },
          { label: "Numbers",      value: orders.totals.number,       icon: Phone,       bg: "bg-amber-50 dark:bg-amber-900/20",   ic: "text-amber-500"  },
          { label: "eSIM",         value: orders.totals.esim,         icon: Wifi,        bg: "bg-green-50 dark:bg-green-900/20",   ic: "text-green-500"  },
        ] as const).map(({ label, value, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
                <Icon className={cn("h-4 w-4", ic)} />
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Orders list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  tab === value
                    ? "bg-[#7C5CFC] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                {label} <span className="opacity-60">({tabCount(value)})</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                className="pl-9 h-9 rounded-xl border-gray-200 dark:border-gray-700 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email, ID, status, service…"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchOrders} className="rounded-xl h-9 px-3 flex-shrink-0">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400">No orders found</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
              {filteredOrders.map((o) => (
                <div key={`${o.source}-${o.id}`} className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{o.user_email || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{o.user_full_name || "—"}</p>
                    </div>
                    <span className={cn("flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full", statusColor(o.status))}>
                      {o.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{getDetails(o)}</p>
                    <OTPBadges o={o} />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", SOURCE_COLOR[o.source])}>
                        {SOURCE_LABEL[o.source]}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{o.display_id}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{format(convert(o.amount))}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                    <RefundButton o={o} />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    {["Date", "Type", "Order ID", "User", "Details", "Status", "Amount", ""].map((h, i) => (
                      <th key={i} className={cn(
                        "px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide",
                        i === 6 ? "text-right" : "text-left"
                      )}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {filteredOrders.map((o) => (
                    <tr key={`${o.source}-${o.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", SOURCE_COLOR[o.source])}>
                          {SOURCE_LABEL[o.source]}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{o.display_id}</td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{o.user_email || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{o.user_full_name || "—"}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300 max-w-[220px]">
                        <span className="truncate block">{getDetails(o)}</span>
                        <OTPBadges o={o} />
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", statusColor(o.status))}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                        {format(convert(o.amount))}
                        {o.currency && o.currency !== "USD" && (
                          <span className="ml-1 text-[10px] text-gray-400">({o.currency})</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <RefundButton o={o} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Refund confirmation dialog */}
      <Dialog open={!!refundTarget} onOpenChange={(open) => { if (!open) setRefundTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-orange-500" />
              Confirm Refund
            </DialogTitle>
            <DialogDescription>
              This will credit{" "}
              <span className="font-semibold">{refundTarget ? format(convert(refundTarget.amount)) : ""}</span>{" "}
              back to{" "}
              <span className="font-semibold">{refundTarget?.user_email}</span>&apos;s wallet and mark the order as refunded.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRefundTarget(null)}
              disabled={refundLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleRefund}
              disabled={refundLoading}
            >
              {refundLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Issue Refund"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
