"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import {
  Loader2, Clock, ChevronRight, ShoppingBag, X,
  Users, Heart, Eye, MessageCircle, Share2, Play, Star, Zap, Search,
  ArrowLeft, ChevronLeft, Timer, Gauge, ShieldCheck, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FaFacebook, FaInstagram, FaTiktok, FaTwitter, FaDiscord,
  FaTelegram, FaWhatsapp, FaYoutube, FaSpotify, FaLinkedin,
  FaPinterest, FaSnapchatGhost, FaTwitch, FaDeezer,
} from "react-icons/fa";
import {
  SiApplemusic, SiAudiomack, SiDribbble, SiKick, SiMedium, SiQuora, SiReddit, SiSoundcloud,
} from "react-icons/si";

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

const PLATFORMS = [
  { id: "instagram", name: "Instagram",   Icon: FaInstagram,     bg: "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]", color: "#e6683c", keywords: ["instagram"] },
  { id: "tiktok",   name: "TikTok",       Icon: FaTiktok,        bg: "bg-gradient-to-br from-[#010101] to-[#69C9D0]",               color: "#69C9D0", keywords: ["tiktok"] },
  { id: "facebook", name: "Facebook",     Icon: FaFacebook,      bg: "bg-gradient-to-br from-[#1877F2] to-[#0d5bc8]",               color: "#1877F2", keywords: ["facebook", "fb "] },
  { id: "youtube",  name: "YouTube",      Icon: FaYoutube,       bg: "bg-gradient-to-br from-[#FF0000] to-[#cc0000]",               color: "#FF0000", keywords: ["youtube", "yt "] },
  { id: "twitter",  name: "Twitter / X",  Icon: FaTwitter,       bg: "bg-gradient-to-br from-[#1DA1F2] to-[#0c85d0]",               color: "#1DA1F2", keywords: ["twitter", "tweet", " x "] },
  { id: "telegram", name: "Telegram",     Icon: FaTelegram,      bg: "bg-gradient-to-br from-[#0088cc] to-[#005b8c]",               color: "#0088cc", keywords: ["telegram"] },
  { id: "discord",  name: "Discord",      Icon: FaDiscord,       bg: "bg-gradient-to-br from-[#5865F2] to-[#3d4bc8]",               color: "#5865F2", keywords: ["discord"] },
  { id: "spotify",  name: "Spotify",      Icon: FaSpotify,       bg: "bg-gradient-to-br from-[#1DB954] to-[#157d3b]",               color: "#1DB954", keywords: ["spotify"] },
  { id: "whatsapp", name: "WhatsApp",     Icon: FaWhatsapp,      bg: "bg-gradient-to-br from-[#25D366] to-[#128C7E]",               color: "#25D366", keywords: ["whatsapp"] },
  { id: "linkedin", name: "LinkedIn",     Icon: FaLinkedin,      bg: "bg-gradient-to-br from-[#0A66C2] to-[#004182]",               color: "#0A66C2", keywords: ["linkedin"] },
  { id: "pinterest",name: "Pinterest",    Icon: FaPinterest,     bg: "bg-gradient-to-br from-[#E60023] to-[#a3001a]",               color: "#E60023", keywords: ["pinterest"] },
  { id: "snapchat", name: "Snapchat",     Icon: FaSnapchatGhost, bg: "bg-gradient-to-br from-[#FFFC00] to-[#f5d800]",               color: "#FFFC00", keywords: ["snapchat"] },
  { id: "twitch",      name: "Twitch",       Icon: FaTwitch,      bg: "bg-gradient-to-br from-[#9146FF] to-[#6c2cd6]",               color: "#9146FF",  keywords: ["twitch"] },
  { id: "applemusic",  name: "Apple Music",  Icon: SiApplemusic,  bg: "bg-gradient-to-br from-[#FA243C] to-[#b80027]",               color: "#FA243C",  keywords: ["apple music", "apple", "itunes", "podcast"] },
  { id: "soundcloud",  name: "SoundCloud",   Icon: SiSoundcloud,  bg: "bg-gradient-to-br from-[#FF5500] to-[#cc4400]",               color: "#FF5500",  keywords: ["soundcloud"] },
  { id: "audiomack",   name: "Audiomack",    Icon: SiAudiomack,   bg: "bg-gradient-to-br from-[#FFA500] to-[#cc8400]",               color: "#FFA500",  keywords: ["audiomack"] },
  { id: "deezer",      name: "Deezer",       Icon: FaDeezer,      bg: "bg-gradient-to-br from-[#A238FF] to-[#7a1fd6]",               color: "#A238FF",  keywords: ["deezer"] },
  { id: "dribbble",    name: "Dribbble",     Icon: SiDribbble,    bg: "bg-gradient-to-br from-[#EA4C89] to-[#c2306a]",               color: "#EA4C89",  keywords: ["dribbble", "dribble"] },
  { id: "kick",        name: "Kick",         Icon: SiKick,        bg: "bg-gradient-to-br from-[#53FC18] to-[#35a80f]",               color: "#53FC18",  keywords: ["kick"] },
  { id: "medium",      name: "Medium",       Icon: SiMedium,      bg: "bg-gradient-to-br from-[#000000] to-[#333333]",               color: "#000000",  keywords: ["medium"] },
  { id: "quora",       name: "Quora",        Icon: SiQuora,       bg: "bg-gradient-to-br from-[#B92B27] to-[#8a1f1c]",               color: "#B92B27",  keywords: ["quora"] },
  { id: "reddit",      name: "Reddit",       Icon: SiReddit,      bg: "bg-gradient-to-br from-[#FF4500] to-[#cc3700]",               color: "#FF4500",  keywords: ["reddit"] },
];

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

// ─── Parse JAP metadata embedded in service names ────────────────────────────
function parseServiceMeta(rawName: string) {
  const get = (pattern: RegExp) => rawName.match(pattern)?.[1]?.trim() ?? null;

  const startTime  = get(/\[Start\s*Time:\s*([^\]]+)\]/i);
  const speed      = get(/\[Speed:\s*([^\]]+)\]/i);
  const refill     = get(/\[Refill:\s*([^\]]+)\]/i);
  const averageTime = get(/\[Average\s*Time:\s*([^\]]+)\]/i);

  // Guaranteed = any non-negative refill value
  const noRefill = !refill || /^(no|none|nop)$/i.test(refill.trim());
  const guaranteed = noRefill ? null : refill;

  // Description = name with all bracket groups stripped
  const description = rawName.replace(/\s*\[[^\]]*\]/g, "").trim();

  return { startTime, speed, guaranteed, averageTime, description };
}

function detectType(name: string, type: string) {
  const n = (name + " " + type).toLowerCase();
  if (n.includes("follower"))                         return "followers";
  if (n.includes("subscriber"))                       return "subscribers";
  if (n.includes("like"))                             return "likes";
  if (n.includes("view") || n.includes("watch"))      return "views";
  if (n.includes("comment"))                          return "comments";
  if (n.includes("share") || n.includes("retweet"))   return "shares";
  if (n.includes("play") || n.includes("stream"))     return "plays";
  if (n.includes("member"))                           return "members";
  if (n.includes("save"))                             return "saves";
  return "other";
}

const SERVICES_PER_PAGE = 20;

// ─── Skeleton components ──────────────────────────────────────────────────────
function PlatformGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function CategoryListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="w-4 h-4 rounded" />
        </div>
      ))}
    </div>
  );
}

function ServiceListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="w-4 h-4 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services, setServices]           = useState<Service[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  // Navigation state
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [servicePage, setServicePage]       = useState(1);
  const [searchTerm, setSearchTerm]         = useState("");

  // Order state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink]       = useState("");
  const [quantity, setQuantity] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);

  const { toast } = useToast();
  const ngn = (n: number) =>
    `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    console.log("Boost Socials page loaded");
    fetchServices();
    fetchBalance();
  }, []);

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
      const res = await fetch("/api/user/balance");
      if (res.ok) {
        const data = await res.json();
        setBalance(parseFloat(data.balance || "0"));
      }
    } catch {}
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  // Group all services by platform
  const byPlatform = useMemo(() => {
    const map: Record<string, Service[]> = {};
    for (const s of services) {
      const pid = detectPlatform(s.category);
      (map[pid] ??= []).push(s);
    }
    return map;
  }, [services]);

  // Platforms that have at least one service
  const availablePlatforms = useMemo(
    () => PLATFORMS.filter((p) => (byPlatform[p.id]?.length ?? 0) > 0),
    [byPlatform]
  );

  // Categories for the active platform, grouped
  const categoriesForPlatform = useMemo(() => {
    if (!activePlatform) return {};
    const map: Record<string, Service[]> = {};
    for (const s of byPlatform[activePlatform] ?? []) {
      (map[s.category] ??= []).push(s);
    }
    return map;
  }, [byPlatform, activePlatform]);

  // Filtered category entries (search within category names)
  const filteredCategories = useMemo(() => {
    const entries = Object.entries(categoriesForPlatform);
    const q = searchTerm.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(([cat]) => cat.toLowerCase().includes(q));
  }, [categoriesForPlatform, searchTerm]);

  // Services in the active category, with search + pagination
  const servicesInCategory = useMemo(() => {
    if (!activeCategory) return [];
    const all = categoriesForPlatform[activeCategory] ?? [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
    );
  }, [categoriesForPlatform, activeCategory, searchTerm]);

  const totalPages   = Math.max(1, Math.ceil(servicesInCategory.length / SERVICES_PER_PAGE));
  const pagedServices = servicesInCategory.slice(
    (servicePage - 1) * SERVICES_PER_PAGE,
    servicePage * SERVICES_PER_PAGE
  );

  const activePlatformDef = PLATFORMS.find((p) => p.id === activePlatform);

  // ── Charge calc ─────────────────────────────────────────────────────────────
  const charge = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity, 10);
    return isNaN(qty) || qty <= 0 ? 0 : (qty / 1000) * selectedService.rate;
  }, [selectedService, quantity]);

  const isComment = () =>
    selectedService
      ? detectType(selectedService.name, selectedService.type) === "comments"
      : false;

  // ── Navigation helpers ───────────────────────────────────────────────────────
  function selectPlatform(id: string) {
    setActivePlatform(id);
    setActiveCategory(null);
    setServicePage(1);
    setSearchTerm("");
    closeOrder();
  }

  function selectCategory(cat: string) {
    setActiveCategory(cat);
    setServicePage(1);
    setSearchTerm("");
    closeOrder();
  }

  function goBackToPlatforms() {
    setActivePlatform(null);
    setActiveCategory(null);
    setServicePage(1);
    setSearchTerm("");
    closeOrder();
  }

  function goBackToCategories() {
    setActiveCategory(null);
    setServicePage(1);
    setSearchTerm("");
    closeOrder();
  }

  // ── Order helpers ────────────────────────────────────────────────────────────
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
        description: `Need ${ngn(charge)}, have ${ngn(balance)}`,
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-32 md:px-6 md:pt-6 max-w-2xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="mb-5">
          {/* Breadcrumb back button */}
          {activePlatform && (
            <button
              type="button"
              onClick={activeCategory ? goBackToCategories : goBackToPlatforms}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#7C5CFC] mb-3 hover:opacity-75 transition-opacity"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {activeCategory ? activePlatformDef?.name ?? "Back" : "All Platforms"}
            </button>
          )}

          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent leading-tight">
            {activeCategory
              ? activeCategory
              : activePlatformDef
              ? activePlatformDef.name
              : "Boost Socials"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {activeCategory
              ? `${servicesInCategory.length} service${servicesInCategory.length !== 1 ? "s" : ""}`
              : activePlatformDef
              ? `${Object.keys(categoriesForPlatform).length} categories`
              : "Select a platform then choose your service"}
          </p>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
            {error}
            <button onClick={fetchServices} className="text-xs font-semibold underline">Retry</button>
          </div>
        )}

        {/* ── Search (shown on category & service levels) ────────────────────── */}
        {activePlatform && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setServicePage(1);
                }}
                placeholder={activeCategory ? "Search services…" : "Search categories…"}
                className="h-11 rounded-full pl-9 pr-10 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(""); setServicePage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* LEVEL 0 — Platform grid                                            */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {!activePlatform && (
          loading ? (
            <PlatformGridSkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availablePlatforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPlatform(p.id)}
                  className="group rounded-2xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center"
                >
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform", p.bg)}>
                    <p.Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {(byPlatform[p.id]?.length ?? 0).toLocaleString()} services
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#7C5CFC] transition-colors" />
                </button>
              ))}
            </div>
          )
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* LEVEL 1 — Category list                                            */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activePlatform && !activeCategory && (
          loading ? (
            <CategoryListSkeleton />
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {searchTerm.trim() ? "No categories match your search." : "No categories available."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCategories.map(([cat, items]) => (
                <button
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  className="w-full group rounded-2xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all flex items-center gap-3 text-left"
                >
                  {activePlatformDef && (
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0", activePlatformDef.bg)}>
                      <activePlatformDef.Icon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{cat}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{items.length} service{items.length !== 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#7C5CFC] flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* LEVEL 2 — Service list (paginated)                                 */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activePlatform && activeCategory && (
          loading ? (
            <ServiceListSkeleton />
          ) : servicesInCategory.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {searchTerm.trim() ? "No services match your search." : "No services available."}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {pagedServices.map((s) => {
                  const t          = detectType(s.name, s.type);
                  const meta       = TYPE_META[t];
                  const isSelected = selectedService?.id === s.id;
                  const sm         = parseServiceMeta(s.name);

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
                      <div className={cn(
                        "w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-white shadow-sm",
                        activePlatformDef ? activePlatformDef.bg : "bg-[#7C5CFC]"
                      )}>
                        {meta ? <meta.Icon className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                          {sm.description || s.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-400 font-medium">{ngn(s.rate)} / 1k</span>
                          {sm.startTime && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-px rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-800">
                              <Timer className="h-2.5 w-2.5" />{sm.startTime}
                            </span>
                          )}
                          {sm.speed && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-px rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                              <Gauge className="h-2.5 w-2.5" />{sm.speed}
                            </span>
                          )}
                          {sm.guaranteed && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-px rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 border border-green-100 dark:border-green-800">
                              <ShieldCheck className="h-2.5 w-2.5" />{sm.guaranteed}
                            </span>
                          )}
                          {s.cancel_allowed && (
                            <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 border border-orange-100 dark:border-orange-800">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={servicePage <= 1}
                    onClick={() => { setServicePage((p) => p - 1); closeOrder(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="rounded-xl gap-1.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Page {servicePage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={servicePage >= totalPages}
                    onClick={() => { setServicePage((p) => p + 1); closeOrder(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="rounded-xl gap-1.5"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* ── Order form — bottom sheet ──────────────────────────────────────────── */}
      {selectedService && (() => {
        const platDef = activePlatformDef;
        const sm = parseServiceMeta(selectedService.name);
        return (
          <div className="fixed inset-0 z-40 flex flex-col justify-end pointer-events-none">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
              onClick={closeOrder}
            />
            <div className="relative pointer-events-auto bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
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
                    <div className="flex-1 min-w-0 pr-8">
                      {platDef && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <platDef.Icon className="h-3.5 w-3.5 opacity-75" />
                          <p className="text-[11px] font-semibold opacity-75 uppercase tracking-wide">{platDef.name}</p>
                        </div>
                      )}
                      <p className="font-bold text-sm leading-snug">{sm.description || selectedService.name}</p>
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
                      <p className="font-black text-base">{ngn(selectedService.rate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] opacity-60">Range</p>
                      <p className="font-semibold text-sm">
                        {selectedService.min_quantity.toLocaleString()} – {selectedService.max_quantity.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service metadata grid */}
                {(sm.startTime || sm.speed) && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Timer, label: "Start Time", value: sm.startTime },
                      { icon: Gauge, label: "Speed",      value: sm.speed     },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="h-3 w-3 text-[#7C5CFC]" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{label}</p>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-snug">
                          {value ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Description */}
                {sm.description && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="h-3 w-3 text-[#7C5CFC]" />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Description</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{sm.description}</p>
                  </div>
                )}

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
                        Enter one comment per line.
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
                          <Clock className="h-3.5 w-3.5" /> Start time
                        </span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {sm.startTime ?? (() => {
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
                        <span className="text-xl font-black text-[#7C5CFC]">{ngn(charge)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Your balance</span>
                        <span className={cn("font-semibold", charge > balance ? "text-red-500" : "text-gray-500 dark:text-gray-400")}>
                          {ngn(balance)}
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
                      : <><ShoppingBag className="mr-2 h-4 w-4" />Place Order — {ngn(charge)}</>
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
