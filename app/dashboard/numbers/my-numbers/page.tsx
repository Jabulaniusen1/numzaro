"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { Search, RefreshCw, Copy, Phone, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format as dateFormat, differenceInSeconds, parseISO } from "date-fns";
import { sanitizeProviderErrorMessage } from "@/lib/errors/sanitize-provider-error";
import {
  FaWhatsapp, FaInstagram, FaFacebook, FaTelegram, FaGoogle,
  FaTwitter, FaTiktok, FaYoutube, FaSpotify, FaDiscord,
  FaLinkedin, FaSnapchatGhost, FaPinterest, FaViber, FaWeixin,
  FaSkype, FaAmazon, FaApple, FaPaypal, FaReddit, FaSteam,
  FaLine, FaUber, FaEbay,
} from "react-icons/fa";
import type { IconType } from "react-icons";

const SERVICE_ICONS: Record<string, IconType> = {
  wa: FaWhatsapp, ig: FaInstagram, fb: FaFacebook, tg: FaTelegram,
  go: FaGoogle, tw: FaTwitter, tt: FaTiktok, yt: FaYoutube,
  sp: FaSpotify, dp: FaDiscord, li: FaLinkedin, sb: FaSnapchatGhost,
  pt: FaPinterest, vi: FaViber, wb: FaWeixin, sk: FaSkype,
  am: FaAmazon, ap: FaApple, pk: FaPaypal, rd: FaReddit,
  st: FaSteam, lt: FaLine, ub: FaUber, eb: FaEbay,
};

const SERVICE_COLORS: Record<string, string> = {
  wa: "#25D366", ig: "#E1306C", fb: "#1877F2", tg: "#0088cc",
  go: "#4285F4", tw: "#000000", tt: "#000000", yt: "#FF0000",
  sp: "#1DB954", dp: "#5865F2", li: "#0A66C2", sb: "#FFFC00",
  pt: "#E60023", vi: "#665CAC", wb: "#07C160", sk: "#00AFF0",
  am: "#FF9900", ap: "#555555", pk: "#003087", rd: "#FF4500",
  st: "#1B2838", lt: "#00C300", ub: "#000000", eb: "#E53238",
};

interface VirtualNumber {
  id: string;
  phone: string;
  product: string;
  product_code?: string;
  price: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  country_code: string;
  country_name: string;
  otp_code?: string;
  provider: string;
}

function ServiceBubble({ code, name }: { code?: string; name: string }) {
  const key = (code || "").toLowerCase();
  const Icon = SERVICE_ICONS[key];
  const bg = SERVICE_COLORS[key] || "#7C5CFC";
  const iconColor = bg === "#FFFC00" ? "#000" : "#fff";
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
      {Icon
        ? <Icon size={18} color={iconColor} />
        : <span className="font-black text-sm" style={{ color: iconColor }}>{name.charAt(0).toUpperCase()}</span>
      }
    </div>
  );
}

function Countdown({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    function tick() {
      const diff = differenceInSeconds(parseISO(expiresAt!), new Date());
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setTimeLeft(m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `0:${s.toString().padStart(2, "0")}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  return (
    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-sm">
      <Clock className="h-3.5 w-3.5" />{timeLeft}
    </span>
  );
}

function CopyBtn({ value }: { value: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(value); toast({ title: "Copied!" }); }}
      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "active" || s === "pending" || s === "waiting") {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 uppercase tracking-wide">Active</span>;
  }
  if (s === "completed" || s === "finished" || s === "received") {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase tracking-wide"><CheckCircle2 className="h-2.5 w-2.5" />Done</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wide"><XCircle className="h-2.5 w-2.5" />{status}</span>;
}

const ACTIVE_STATUSES  = ["active", "pending", "waiting", "received"];
const HISTORY_STATUSES = ["completed", "finished", "cancelled", "canceled", "suspended", "timeout", "banned"];

export default function MyNumbersPage() {
  const { toast } = useToast();
  const { format: formatCurrency, convert } = useCurrency();

  const [numbers, setNumbers]     = useState<VirtualNumber[]>([]);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [search, setSearch]       = useState("");

  const fetchNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/numbers");
      if (!res.ok) throw new Error("Failed to fetch numbers");
      const data = await res.json();
      setNumbers(
        (data.numbers || []).map((n: any) => ({
          id:           n.id,
          phone:        n.phone_number,
          product:      n.product || "Activation",
          product_code: n.product_code,
          price:        n.monthly_cost || 0,
          status:       n.status || "active",
          expires_at:   n.expires_at,
          created_at:   n.created_at,
          country_code: n.country_code || "",
          country_name: n.country_name || "",
          otp_code:     n.otp_code,
          provider:     n.provider || "smspool",
        }))
      );
    } catch (err: any) {
      toast({
        title: "Error",
        description: sanitizeProviderErrorMessage(err?.message, "Failed to fetch numbers"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchNumbers(); }, [fetchNumbers]);

  async function handleSync(id: string) {
    setSyncing(id);
    try {
      const res  = await fetch(`/api/numbers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      toast({ title: data.otp_code ? `OTP: ${data.otp_code}` : "No code yet", description: data.otp_code ? "Code copied to clipboard" : "Check back in a moment" });
      if (data.otp_code) navigator.clipboard.writeText(data.otp_code).catch(() => {});
      await fetchNumbers();
    } catch (err: any) {
      toast({
        title: "Sync failed",
        description: sanitizeProviderErrorMessage(err?.message, "Sync failed"),
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  }

  async function handleCancel(id: string) {
    setCancelling(id);
    try {
      const res  = await fetch(`/api/numbers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      toast({ title: "Number cancelled" });
      await fetchNumbers();
    } catch (err: any) {
      toast({
        title: "Cancel failed",
        description: sanitizeProviderErrorMessage(err?.message, "Cancel failed"),
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  }

  const filtered = numbers.filter((n) => {
    const s = n.status.toLowerCase();
    const inTab = activeTab === "active"
      ? ACTIVE_STATUSES.some(a => s.startsWith(a))
      : HISTORY_STATUSES.some(h => s.startsWith(h));
    const matchSearch = !search || n.phone.includes(search) || n.product.toLowerCase().includes(search.toLowerCase());
    return inTab && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-10 md:px-6 md:pt-6 max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            My Numbers
          </h1>
          <Link href="/dashboard/numbers">
            <Button size="sm" className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Buy Number
            </Button>
          </Link>
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            {(["active", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-all capitalize",
                  activeTab === tab
                    ? "bg-[#7C5CFC] text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                {tab === "active" ? "Active" : "History"}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 rounded-full text-sm border-gray-200 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          <button
            onClick={fetchNumbers}
            className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-[#7C5CFC] transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 py-16 text-center">
              <Phone className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">
                {activeTab === "active" ? "No active numbers" : "No history yet"}
              </p>
              {activeTab === "active" && (
                <Link href="/dashboard/numbers">
                  <Button size="sm" className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl">
                    Buy a number
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filtered.map((n) => {
              const isActive = ACTIVE_STATUSES.some(a => n.status.toLowerCase().startsWith(a));
              return (
                <div key={n.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-center gap-3">
                    <ServiceBubble code={n.product_code} name={n.product} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{n.product}</span>
                        <StatusBadge status={n.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span>{n.country_name || n.country_code}</span>
                        <span>·</span>
                        <span>{dateFormat(parseISO(n.created_at), "dd MMM, HH:mm")}</span>
                        {isActive && n.expires_at && (
                          <>
                            <span>·</span>
                            <Countdown expiresAt={n.expires_at} />
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {formatCurrency(convert(n.price))}
                    </span>
                  </div>

                  {/* Phone number */}
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-100 text-sm tracking-wide flex-1">
                      {n.phone}
                    </span>
                    <CopyBtn value={n.phone} />
                  </div>

                  {/* OTP code */}
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold text-gray-400 w-8">OTP</span>
                    <span className={cn("font-mono font-bold text-lg tracking-[0.3em] flex-1", n.otp_code ? "text-[#7C5CFC]" : "text-gray-300 dark:text-gray-600")}>
                      {n.otp_code || "———"}
                    </span>
                    {n.otp_code && <CopyBtn value={n.otp_code} />}
                  </div>

                  {/* Actions (active only) */}
                  {isActive && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSync(n.id)}
                        disabled={syncing === n.id}
                        className="flex-1 h-9 rounded-xl bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                      >
                        {syncing === n.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5" />}
                        Check for OTP
                      </button>
                      <button
                        onClick={() => handleCancel(n.id)}
                        disabled={cancelling === n.id}
                        className="h-9 px-4 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
                      >
                        {cancelling === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancel"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
