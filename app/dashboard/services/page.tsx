"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Loader2, Clock, ChevronDown, Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

function SearchableSelect({ options, value, onChange, placeholder = "Select...", disabled = false, id }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-full border px-4 text-sm transition-colors",
          "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-[#7C5CFC] ring-2 ring-[#7C5CFC]/20"
        )}
      >
        <span className={selectedOption ? "text-gray-800 dark:text-gray-100 font-medium" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:border-[#7C5CFC]"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Escape") { setIsOpen(false); setSearchQuery(""); } }}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">No results found</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onChange(option.value); setIsOpen(false); setSearchQuery(""); }}
                  className={cn(
                    "flex w-full items-center rounded-xl px-3 py-2 text-sm text-left transition-colors",
                    value === option.value
                      ? "bg-violet-50 dark:bg-violet-900/30 text-[#7C5CFC] font-semibold"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const { format } = useCurrency();

  useEffect(() => { fetchServices(); fetchBalance(); }, []);

  const fetchServices = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(data.services || []);
      setCategories(data.filters?.categories || []);
    } catch (err: any) {
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/balance");
      if (res.ok) { const data = await res.json(); setBalance(parseFloat(data.balance || "0")); }
    } catch {}
  };

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [services, selectedCategory]);

  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    return services.find((s) => s.id.toString() === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  const isCommentService = () => {
    if (!selectedService) return false;
    const n = (selectedService.name || "").toLowerCase();
    const t = (selectedService.type || "").toLowerCase();
    return n.includes("comment") || t.includes("comment");
  };

  const charge = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return 0;
    return (qty / 1000) * (selectedService.rate || 0);
  }, [selectedService, quantity]);

  useEffect(() => {
    setSelectedServiceId(""); setQuantity(""); setLink(""); setComments("");
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedService && !quantity) setQuantity(String(selectedService.min_quantity || 100));
  }, [selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return toast({ title: "Select a service", variant: "destructive" });
    if (!link.trim()) return toast({ title: "Link required", description: "Enter a valid link", variant: "destructive" });
    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty < selectedService.min_quantity || qty > selectedService.max_quantity) {
      return toast({ title: "Invalid quantity", description: `Between ${selectedService.min_quantity.toLocaleString()} and ${selectedService.max_quantity.toLocaleString()}`, variant: "destructive" });
    }
    if (charge > balance) return toast({ title: "Insufficient balance", description: `Need ${format(charge)}, have ${format(balance)}`, variant: "destructive" });

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: selectedService.id, link: link.trim(), quantity: Math.floor(qty), ...(comments.trim() && { comments: comments.trim() }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");
      toast({ title: "Order placed!", description: `${selectedService.name} order is being processed.` });
      window.dispatchEvent(new CustomEvent("balanceUpdated"));
      fetchBalance();
      setLink(""); setQuantity(""); setComments(""); setSelectedServiceId(""); setSelectedCategory("");
    } catch (err: any) {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getEstimatedTime = () => {
    if (!selectedService) return null;
    const t = (selectedService.type || "").toLowerCase();
    if (t.includes("followers") || t.includes("subscribers")) return "24–48 hours";
    if (t.includes("likes") || t.includes("views")) return "1–6 hours";
    if (t.includes("comments")) return "12–24 hours";
    return "12–48 hours";
  };

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Boost Socials
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Grow your social media presence
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
            {error}
            <button onClick={fetchServices} className="text-xs font-semibold underline">Retry</button>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-5">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Create New Order
          </h2>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-full" />
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</Label>
                <SearchableSelect
                  id="category"
                  options={categories.map((c) => ({ value: c, label: c }))}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="Select a category"
                />
              </div>

              {/* Service */}
              {selectedCategory && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</Label>
                  <SearchableSelect
                    id="service"
                    options={filteredServices.map((s) => ({ value: s.id.toString(), label: s.name }))}
                    value={selectedServiceId}
                    onChange={setSelectedServiceId}
                    placeholder={filteredServices.length === 0 ? "No services available" : "Select a service"}
                    disabled={filteredServices.length === 0}
                  />
                </div>
              )}

              {/* Service Info */}
              {selectedService && (
                <div className="rounded-xl border border-violet-100 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-900/20 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{selectedService.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{selectedService.category} · {selectedService.type}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {selectedService.refill_allowed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Refill</span>
                      )}
                      {selectedService.cancel_allowed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Cancel</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Per 1,000</p>
                      <p className="font-black text-[#7C5CFC]">{format(selectedService.rate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Quantity range</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-200">
                        {selectedService.min_quantity.toLocaleString()} – {selectedService.max_quantity.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Link */}
              {selectedService && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Link</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    required
                    disabled={submitting}
                    className="rounded-full border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
                  />
                </div>
              )}

              {/* Quantity */}
              {selectedService && (
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
                    onBlur={(e) => { if (!e.target.value || isNaN(parseInt(e.target.value))) setQuantity(String(selectedService.min_quantity)); }}
                    required
                    disabled={submitting}
                    className="rounded-full border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
                  />
                </div>
              )}

              {/* Comments */}
              {selectedService && isCommentService() && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom Comments</Label>
                  <Textarea
                    placeholder="One comment per line..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={5}
                    disabled={submitting}
                    className="rounded-2xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 resize-none focus-visible:ring-[#7C5CFC]"
                  />
                </div>
              )}

              {/* Order Summary */}
              {selectedService && quantity && (
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Order Summary</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="h-3.5 w-3.5" /> Estimated time
                    </span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{getEstimatedTime()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total charge</span>
                    <span className="text-xl font-black text-[#7C5CFC]">{format(charge)}</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>Your balance</span>
                    <span className={cn("font-semibold", charge > balance && "text-red-500")}>{format(balance)}</span>
                  </div>
                </div>
              )}

              {/* Submit */}
              {selectedService && (
                <Button
                  type="submit"
                  disabled={submitting || charge > balance || !link.trim() || !quantity}
                  className="w-full bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white h-12 text-sm font-bold rounded-2xl shadow-md shadow-violet-200 dark:shadow-none"
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Placing Order...</>
                  ) : (
                    <><ShoppingBag className="mr-2 h-4 w-4" />Place Order — {format(charge)}</>
                  )}
                </Button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
