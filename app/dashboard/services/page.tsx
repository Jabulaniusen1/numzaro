"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import {
  Loader2, Clock, ChevronRight, ShoppingBag, X,
  Users, Heart, Eye, MessageCircle, Share2, Play, Star, Zap, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FaFacebook, FaInstagram, FaTiktok, FaTwitter, FaDiscord,
  FaTelegram, FaWhatsapp, FaYoutube, FaSpotify, FaLinkedin,
  FaPinterest, FaSnapchatGhost, FaTwitch,
} from "react-icons/fa";

interface Service {
  id: number;
  service_id: number;
  name: string;
  category: string;
  type: string;
  rate: number;
  min_quantity: number;
  max_quantity: number;
  refill_allowed: boolean;
  cancel_allowed: boolean;
}

// ─── Platforms ───────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "instagram", name: "Instagram",  Icon: FaInstagram,    bg: "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]", color: "#e6683c", keywords: ["instagram"] },
  { id: "tiktok",    name: "TikTok",     Icon: FaTiktok,       bg: "bg-gradient-to-br from-[#010101] to-[#69C9D0]",               color: "#69C9D0", keywords: ["tiktok"] },
  { id: "facebook",  name: "Facebook",   Icon: FaFacebook,     bg: "bg-gradient-to-br from-[#1877F2] to-[#0d5bc8]",               color: "#1877F2", keywords: ["facebook", "fb "] },
  { id: "youtube",   name: "YouTube",    Icon: FaYoutube,      bg: "bg-gradient-to-br from-[#FF0000] to-[#cc0000]",               color: "#FF0000", keywords: ["youtube", "yt "] },
  { id: "twitter",   name: "Twitter / X",Icon: FaTwitter,      bg: "bg-gradient-to-br from-[#1DA1F2] to-[#0c85d0]",               color: "#1DA1F2", keywords: ["twitter", "tweet", " x "] },
  { id: "telegram",  name: "Telegram",   Icon: FaTelegram,     bg: "bg-gradient-to-br from-[#0088cc] to-[#005b8c]",               color: "#0088cc", keywords: ["telegram"] },
  { id: "discord",   name: "Discord",    Icon: FaDiscord,      bg: "bg-gradient-to-br from-[#5865F2] to-[#3d4bc8]",               color: "#5865F2", keywords: ["discord"] },
  { id: "spotify",   name: "Spotify",    Icon: FaSpotify,      bg: "bg-gradient-to-br from-[#1DB954] to-[#157d3b]",               color: "#1DB954", keywords: ["spotify"] },
  { id: "whatsapp",  name: "WhatsApp",   Icon: FaWhatsapp,     bg: "bg-gradient-to-br from-[#25D366] to-[#128C7E]",               color: "#25D366", keywords: ["whatsapp"] },
  { id: "linkedin",  name: "LinkedIn",   Icon: FaLinkedin,     bg: "bg-gradient-to-br from-[#0A66C2] to-[#004182]",               color: "#0A66C2", keywords: ["linkedin"] },
  { id: "pinterest", name: "Pinterest",  Icon: FaPinterest,    bg: "bg-gradient-to-br from-[#E60023] to-[#a3001a]",               color: "#E60023", keywords: ["pinterest"] },
  { id: "snapchat",  name: "Snapchat",   Icon: FaSnapchatGhost,bg: "bg-gradient-to-br from-[#FFFC00] to-[#f5d800]",               color: "#FFFC00", keywords: ["snapchat"] },
  { id: "twitch",    name: "Twitch",     Icon: FaTwitch,       bg: "bg-gradient-to-br from-[#9146FF] to-[#6c2cd6]",               color: "#9146FF", keywords: ["twitch"] },
];

// ─── Service type metadata ────────────────────────────────────────────────────
const TYPE_META: Record<string, { Icon: React.ElementType; label: string }> = {
  followers:   { Icon: Users,         label: "Followers"   },
  subscribers: { Icon: Users,         label: "Subscribers" },
  likes:       { Icon: Heart,         label: "Likes"       },
  views:       { Icon: Eye,           label: "Views"       },
  comments:    { Icon: MessageCircle, label: "Comments"    },
  shares:      { Icon: Share2,        label: "Shares"      },
  plays:       { Icon: Play,          label: "Plays"       },
  members:     { Icon: Users,         label: "Members"     },
  saves:       { Icon: Star,          label: "Saves"       },
};

function detectPlatform(category: string) {
  const c = category.toLowerCase();
  for (const p of PLATFORMS) {
    if (p.keywords.some((k) => c.includes(k))) return p.id;
  }
  return "other";
}

function detectType(name: string, type: string) {
  const n = (name + " " + type).toLowerCase();
  if (n.includes("follower"))                          return "followers";
  if (n.includes("subscriber"))                        return "subscribers";
  if (n.includes("like"))                              return "likes";
  if (n.includes("view") || n.includes("watch"))       return "views";
  if (n.includes("comment"))                           return "comments";
  if (n.includes("share") || n.includes("retweet"))    return "shares";
  if (n.includes("play") || n.includes("stream"))      return "plays";
  if (n.includes("member"))                            return "members";
  if (n.includes("save"))                              return "saves";
  return "other";
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services, setServices]     = useState<Service[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink]             = useState("");
  const [quantity, setQuantity]     = useState("");
  const [comments, setComments]     = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance]       = useState(0);
  const filterRef                   = useRef<HTMLDivElement>(null);
  const { toast }  = useToast();
  const { format } = useCurrency();

  useEffect(() => { fetchServices(); fetchBalance(); }, []);

  async function fetchServices() {
    try {
      setLoading(true); setError(null);
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(data.services || []);
    } catch (err: any) {
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBalance() {
    try {
      const res = await fetch("/api/balance");
      if (res.ok) {
        const data = await res.json();
        setBalance(parseFloat(data.balance || "0"));
      }
    } catch {}
  }

  // Group services by platform
  const byPlatform = useMemo(() => {
    const map: Record<string, Service[]> = {};
    for (const s of services) {
      const pid = detectPlatform(s.category);
      (map[pid] ??= []).push(s);
    }
    return map;
  }, [services]);

  const availablePlatforms = useMemo(
    () => PLATFORMS.filter((p) => (byPlatform[p.id]?.length ?? 0) > 0),
    [byPlatform]
  );

  // Services visible under the active platform filter
  const visibleServices = useMemo(() => {
    if (activePlatform === "all") return services;
    return byPlatform[activePlatform] ?? [];
  }, [services, byPlatform, activePlatform]);

  const filteredServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return visibleServices;
    return visibleServices.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
      );
    });
  }, [visibleServices, searchTerm]);

  // Group visible services by their category string (for section headers)
  const groupedByCategory = useMemo(() => {
    const map: Record<string, Service[]> = {};
    for (const s of filteredServices) {
      (map[s.category] ??= []).push(s);
    }
    return map;
  }, [filteredServices]);

  const currentPlatformDef = PLATFORMS.find((p) => p.id === activePlatform);

  const charge = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity, 10);
    return isNaN(qty) || qty <= 0 ? 0 : (qty / 1000) * selectedService.rate;
  }, [selectedService, quantity]);

  const isComment = () =>
    selectedService ? detectType(selectedService.name, selectedService.type) === "comments" : false;

  function openService(s: Service) {
    setSelectedService(s);
    setQuantity(String(s.min_quantity));
    setLink("");
    setComments("");
  }

  function closeOrder() {
    setSelectedService(null);
    setLink(""); setQuantity(""); setComments("");
  }

  function toggleCategory(category: string) {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService) return;
    if (!link.trim()) return toast({ title: "Link required", variant: "destructive" });
    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty < selectedService.min_quantity || qty > selectedService.max_quantity) {
      return toast({
        title: "Invalid quantity",
        description: `Between ${selectedService.min_quantity.toLocaleString()} and ${selectedService.max_quantity.toLocaleString()}`,
        variant: "destructive",
      });
    }
    if (charge > balance) {
      return toast({
        title: "Insufficient balance",
        description: `Need ${format(charge)}, have ${format(balance)}`,
        variant: "destructive",
      });
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedService.id,
          link: link.trim(),
          quantity: Math.floor(qty),
          ...(comments.trim() && { comments: comments.trim() }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");
      toast({ title: "Order placed!", description: `${selectedService.name} is being processed.` });
      window.dispatchEvent(new CustomEvent("balanceUpdated"));
      fetchBalance();
      closeOrder();
    } catch (err: any) {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-32 md:px-6 md:pt-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent leading-tight">
            Boost Socials
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Select a platform then choose your service
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services..."
              className="h-11 rounded-full pl-9 pr-10 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
            {error}
            <button onClick={fetchServices} className="text-xs font-semibold underline">Retry</button>
          </div>
        )}

        {/* ── Platform filter bar ──────────────────────────────────────────────── */}
        <div
          ref={filterRef}
          className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide -mx-4 px-4 md:-mx-6 md:px-6"
          style={{ scrollbarWidth: "none" }}
        >
          {/* All tab */}
          <button
            onClick={() => setActivePlatform("all")}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all",
              activePlatform === "all"
                ? "bg-[#7C5CFC] text-white shadow-md shadow-violet-300/40"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
            )}
          >
            <Zap className="h-3 w-3" />
            All
          </button>

          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="flex-shrink-0 h-8 w-24 rounded-full" />
              ))
            : availablePlatforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all",
                    activePlatform === p.id
                      ? "text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  )}
                  style={
                    activePlatform === p.id
                      ? { background: `linear-gradient(135deg, ${p.color}cc, ${p.color})` }
                      : {}
                  }
                >
                  <p.Icon className="h-3 w-3" />
                  {p.name}
                </button>
              ))
          }
        </div>

        {/* ── Services list ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-lg" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-4 w-6 rounded-full" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <Skeleton key={j} className="h-16 rounded-2xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {searchTerm.trim() ? "No services match your search." : "No services available for this platform."}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByCategory).map(([category, items]) => {
              const platId = detectPlatform(category);
              const platDef = PLATFORMS.find((p) => p.id === platId);

              return (
                <div key={category}>
                  {/* Category section header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 mb-2 text-left group"
                    aria-expanded={!collapsedCategories[category]}
                  >
                    {platDef && (
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0", platDef.bg)}>
                        <platDef.Icon className="h-3 w-3" />
                      </div>
                    )}
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
                      {category}
                    </p>
                    <span className="text-[10px] font-semibold px-1.5 py-px rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {items.length}
                    </span>
                    <ChevronRight
                      className={cn(
                        "ml-auto h-4 w-4 text-gray-300 transition-transform group-hover:text-gray-400",
                        collapsedCategories[category] ? "" : "rotate-90"
                      )}
                    />
                  </button>

                  {/* Service cards */}
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      collapsedCategories[category] ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-2">
                        {items.map((s) => {
                          const t    = detectType(s.name, s.type);
                          const meta = TYPE_META[t];
                          const isSelected = selectedService?.id === s.id;

                          return (
                            <button
                              key={s.id}
                              onClick={() => isSelected ? closeOrder() : openService(s)}
                              className={cn(
                                "w-full group bg-white dark:bg-gray-800 rounded-2xl border p-4 flex items-center gap-3 text-left transition-all",
                                isSelected
                                  ? "border-[#7C5CFC] shadow-md shadow-violet-100 dark:shadow-none"
                                  : "border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm"
                              )}
                            >
                              {/* Icon bubble */}
                              <div className={cn(
                                "w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-white shadow-sm",
                                platDef ? platDef.bg : "bg-[#7C5CFC]"
                              )}>
                                {meta ? <meta.Icon className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{s.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs text-gray-400">{format(s.rate)} / 1k</span>
                                  {s.refill_allowed && (
                                    <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                                      Refill
                                    </span>
                                  )}
                                  {s.cancel_allowed && (
                                    <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                                      Cancel
                                    </span>
                                  )}
                                </div>
                              </div>

                              <ChevronRight className={cn(
                                "h-4 w-4 flex-shrink-0 transition-all",
                                isSelected ? "text-[#7C5CFC] rotate-90" : "text-gray-300 group-hover:text-[#7C5CFC]"
                              )} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Order form — bottom sheet ──────────────────────────────────────────── */}
      {selectedService && (() => {
        const platId  = detectPlatform(selectedService.category);
        const platDef = PLATFORMS.find((p) => p.id === platId);
        return (
          <div className="fixed inset-0 z-40 flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
              onClick={closeOrder}
            />

            {/* Sheet */}
            <div className="relative pointer-events-auto bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>

              <div className="px-5 pb-8 pt-2 space-y-5 max-w-2xl mx-auto w-full">
                {/* Service banner */}
                <div className={cn("rounded-2xl p-4 text-white relative overflow-hidden", platDef?.bg ?? "bg-[#7C5CFC]")}>
                  {platDef && (
                    <platDef.Icon className="absolute -right-3 -bottom-3 h-20 w-20 opacity-10" />
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      {platDef && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <platDef.Icon className="h-3.5 w-3.5 opacity-75" />
                          <p className="text-[11px] font-semibold opacity-75 uppercase tracking-wide">{platDef.name}</p>
                        </div>
                      )}
                      <p className="font-bold text-sm leading-snug pr-8">{selectedService.name}</p>
                    </div>
                    <button
                      onClick={closeOrder}
                      className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-5 mt-3">
                    <div>
                      <p className="text-[11px] opacity-60">Per 1,000</p>
                      <p className="font-black text-base">{format(selectedService.rate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] opacity-60">Range</p>
                      <p className="font-semibold text-sm">
                        {selectedService.min_quantity.toLocaleString()} – {selectedService.max_quantity.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Link */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Link</Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      required
                      disabled={submitting}
                      className="rounded-full border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Quantity ({selectedService.min_quantity.toLocaleString()} – {selectedService.max_quantity.toLocaleString()})
                    </Label>
                    <Input
                      type="number"
                      min={selectedService.min_quantity}
                      max={selectedService.max_quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      onBlur={(e) => {
                        if (!e.target.value || isNaN(parseInt(e.target.value)))
                          setQuantity(String(selectedService.min_quantity));
                      }}
                      required
                      disabled={submitting}
                      className="rounded-full border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
                    />
                  </div>

                  {/* Comments */}
                  {isComment() && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom Comments</Label>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Enter one comment per line. The service sends comments as newline-separated values.
                      </p>
                      <Textarea
                        placeholder="One comment per line..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={4}
                        disabled={submitting}
                        className="rounded-2xl border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 resize-none focus-visible:ring-[#7C5CFC]"
                      />
                    </div>
                  )}

                  {/* Summary */}
                  {quantity && (
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Clock className="h-3.5 w-3.5" /> Est. delivery
                        </span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {(() => {
                            const t = detectType(selectedService.name, selectedService.type);
                            if (t === "followers" || t === "subscribers") return "24–48 hours";
                            if (t === "likes" || t === "views") return "1–6 hours";
                            if (t === "comments") return "12–24 hours";
                            return "12–48 hours";
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total charge</span>
                        <span className="text-xl font-black text-[#7C5CFC]">{format(charge)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Your balance</span>
                        <span className={cn("font-semibold", charge > balance ? "text-red-500" : "text-gray-500 dark:text-gray-400")}>
                          {format(balance)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting || charge > balance || !link.trim() || !quantity}
                    className="w-full bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white h-12 text-sm font-bold rounded-2xl shadow-md shadow-violet-200 dark:shadow-none"
                  >
                    {submitting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Placing Order…</>
                      : <><ShoppingBag className="mr-2 h-4 w-4" />Place Order — {format(charge)}</>
                    }
                  </Button>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
