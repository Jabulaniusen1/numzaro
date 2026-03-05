"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { Search, RefreshCw, Info, Copy, Plus, Hourglass, Clock, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderTableRow } from "@/components/dashboard/OrderTableRow";
import { cn, getFlag } from "@/lib/utils";
import { format as dateFormat, differenceInSeconds, parseISO } from "date-fns";
import { ServiceIcon, getServicePrettyName } from "@/components/dashboard/ServiceIcon";

function Countdown({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = differenceInSeconds(parseISO(expiresAt), new Date());
      if (diff <= 0) { setTimeLeft("Expired"); clearInterval(interval); return; }
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;
  return (
    <div className="flex items-center gap-1.5 text-[#7C5CFC] font-bold text-sm">
      <Clock className="h-4 w-4" />
      <span>{timeLeft}</span>
    </div>
  );
}

const CopyButton = ({ value, label }: { value: string; label?: string }) => {
  const { toast } = useToast();
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(value); toast({ title: "Copied!", description: `${label || "Value"} copied` }); }}
      className="flex items-center justify-center hover:opacity-70 transition-opacity"
    >
      <Copy className="h-4 w-4" />
    </button>
  );
};

interface VirtualNumber {
  id: string;
  phone: string;
  operator: string;
  product: string;
  price: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  country_code: string;
  country_name: string;
  otp_code?: string;
  provider: string;
  message_count: number;
}

const STATUS_TABS = {
  active: ["PENDING", "RECEIVED", "ACTIVE"],
  history: ["FINISHED", "CANCELED", "TIMEOUT", "BANNED", "CANCELLED", "SUSPENDED"],
};

export default function MyNumbersPage() {
  const { toast } = useToast();
  const { format: formatCurrency } = useCurrency();
  const [numbers, setNumbers] = useState<VirtualNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { fetchNumbers(); }, []);

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/numbers");
      if (!res.ok) throw new Error("Failed to fetch numbers");
      const data = await res.json();
      setNumbers(
        (data.numbers || []).map((n: any) => ({
          id: n.id,
          phone: n.phone_number,
          operator: n.operator || "virtual",
          product: n.product || "activation",
          price: n.monthly_cost || 0,
          status: n.status || "PENDING",
          expires_at: n.expires_at,
          created_at: n.created_at,
          country_code: n.country_code || "US",
          country_name: n.country_name || "",
          otp_code: n.otp_code,
          provider: n.provider,
          message_count: n.message_count || 0,
        }))
      );
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (numberId: string, action: string) => {
    try {
      const res = await fetch(`/api/numbers/${numberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast({ title: "Done", description: `Number ${action}ed` });
      fetchNumbers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filtered = numbers.filter((n) => {
    const matchSearch = !searchQuery || n.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = STATUS_TABS[activeTab].includes(n.status.toUpperCase());
    return matchSearch && matchTab;
  });

  const activeNumber = activeTab === "active" ? filtered[0] : null;

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              My Numbers
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Virtual numbers you've purchased</p>
          </div>
          <Link href="/dashboard/numbers">
            <Button size="sm" className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Buy Number
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1 w-fit shadow-sm">
          {(["active", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize",
                activeTab === tab
                  ? "bg-[#7C5CFC] text-white shadow-md shadow-violet-200 dark:shadow-none"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {tab === "active" ? "Active" : "History"}
            </button>
          ))}
        </div>

        {activeTab === "history" && (
          <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl p-4 flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-[#7C5CFC] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">
              Activation history may be periodically cleared. Save any numbers you need to keep track of.
            </p>
          </div>
        )}

        {/* Search + Refresh */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
            />
          </div>
          <button
            onClick={fetchNumbers}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-[#7C5CFC] hover:border-[#7C5CFC]/40 transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* Active Number Card */}
        {activeNumber && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            {/* Top row */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">#{activeNumber.id.slice(0, 8)}</span>
              <div className="flex items-center gap-4">
                <Countdown expiresAt={activeNumber.expires_at} />
                <span className="text-xs text-gray-400">{dateFormat(parseISO(activeNumber.created_at), "HH:mm")}</span>
                <div className="w-2.5 h-2.5 rounded-full bg-[#7C5CFC] shadow-[0_0_8px_#7C5CFC]" />
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-wrap items-center gap-5 mb-5">
              <div className="flex items-center gap-2">
                <ServiceIcon name={activeNumber.product} size="md" />
                <span className="font-bold text-gray-800 dark:text-gray-100">{getServicePrettyName(activeNumber.product)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl">{getFlag(activeNumber.country_code)}</span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{activeNumber.country_name}</span>
              </div>
              <span className="font-bold text-gray-700 dark:text-gray-200">{formatCurrency(activeNumber.price)}</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-[#7C5CFC]">
                &gt;1 SMS
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <button
                onClick={() => handleAction(activeNumber.id, "finish")}
                className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center gap-1.5 transition-colors"
              >
                <Hourglass className="h-4 w-4" /> Finish
              </button>
              <button
                onClick={() => handleAction(activeNumber.id, "ban")}
                className="h-10 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-bold hover:border-red-400 hover:text-red-500 transition-colors"
              >
                Ban
              </button>
              <button
                onClick={() => handleAction(activeNumber.id, "cancel")}
                className="h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(activeNumber.id, "sync")}
                className="h-10 w-10 rounded-xl bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white flex items-center justify-center transition-colors"
                title="Sync Messages"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Number + OTP */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden h-14">
                <div className="w-14 h-full bg-[#7C5CFC] flex items-center justify-center flex-shrink-0">
                  <div className="relative">
                    <Plus className="h-3.5 w-3.5 text-white absolute -top-1 -left-1" />
                    <Copy className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center font-bold text-lg text-gray-700 dark:text-gray-200 tracking-wider">
                  {activeNumber.phone}
                </div>
                <div className="w-14 h-full bg-[#7C5CFC] flex items-center justify-center text-white">
                  <CopyButton value={activeNumber.phone} label="Phone number" />
                </div>
              </div>

              <div className="flex-1 flex items-center gap-3">
                <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Code</span>
                <div className="flex-1 flex items-center rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden h-14">
                  <div className="flex-1 text-center font-bold text-xl tracking-[0.5em] pl-[0.5em] text-gray-700 dark:text-gray-200">
                    {activeNumber.otp_code || "—"}
                  </div>
                  <div className="w-14 h-full bg-[#7C5CFC] flex items-center justify-center text-white">
                    <CopyButton value={activeNumber.otp_code || ""} label="OTP code" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                <Phone className="h-7 w-7 text-[#7C5CFC]" />
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">No numbers found</p>
              <Link href="/dashboard/numbers">
                <Button size="sm" className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl">
                  Buy a Number
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {["ID", "Date", "Service", "Country", "Price / Operator", "Number / Code", "Status"].map((h, i) => (
                      <th key={h} className={cn("py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide", i === 6 ? "text-right pr-5" : "text-left")}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
                  {filtered.map((order) => (
                    <OrderTableRow key={order.id} order={order} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
