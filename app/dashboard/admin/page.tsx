"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Settings, Wifi, Phone, ShoppingBag, Save, RefreshCw, AlertCircle, CheckCircle2, Lock } from "lucide-react";

interface MarkupSetting {
  label: string;
  description: string;
  icon: React.ElementType;
  endpoint: string;
  color: string;
  value: number | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saved: boolean;
}

const SETTINGS_CONFIG = [
  {
    label: "Social Boosts Markup",
    description: "Applied to all social media boost service prices",
    icon: ShoppingBag,
    endpoint: "/api/admin/markup",
    color: "violet",
  },
  {
    label: "Virtual Numbers Markup",
    description: "Applied to one-time and rental virtual number prices",
    icon: Phone,
    endpoint: "/api/admin/numbers/markup",
    color: "indigo",
  },
  {
    label: "eSIM Plans Markup",
    description: "Applied to all eSIM data plan prices",
    icon: Wifi,
    endpoint: "/api/admin/esim/markup",
    color: "blue",
  },
];

function MarkupCard({
  label,
  description,
  icon: Icon,
  endpoint,
  color,
}: (typeof SETTINGS_CONFIG)[number]) {
  const [value, setValue] = useState<string>("");
  const [current, setCurrent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const colorMap: Record<string, { border: string; bg: string; text: string; icon: string; badge: string }> = {
    violet: {
      border: "border-violet-200 dark:border-violet-800",
      bg: "bg-violet-50 dark:bg-violet-900/20",
      text: "text-violet-700 dark:text-violet-300",
      icon: "text-violet-500",
      badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
    },
    indigo: {
      border: "border-indigo-200 dark:border-indigo-800",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      text: "text-indigo-700 dark:text-indigo-300",
      icon: "text-indigo-500",
      badge: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
    },
    blue: {
      border: "border-blue-200 dark:border-blue-800",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-300",
      icon: "text-blue-500",
      badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    },
  };

  const c = colorMap[color] ?? colorMap.violet;

  useEffect(() => {
    setLoading(true);
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => {
        const pct = d.markupPercentage ?? 30;
        setCurrent(pct);
        setValue(String(pct));
      })
      .catch(() => setError("Failed to load current value"))
      .finally(() => setLoading(false));
  }, [endpoint]);

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      setError("Enter a valid percentage (0 or above)");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markupPercentage: num }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setCurrent(num);
      setSaved(true);
      toast({ title: `${label} updated`, description: `Markup set to ${num}%` });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const multiplier = current !== null ? (1 + current / 100).toFixed(2) : "—";
  const exampleCost = 10;
  const examplePrice = current !== null ? (exampleCost * (1 + current / 100)).toFixed(2) : "—";

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-2xl border p-5 shadow-sm", c.border)}>
      <div className="flex items-start gap-3 mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", c.bg)}>
          <Icon className={cn("h-5 w-5", c.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
        {current !== null && (
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0", c.badge)}>
            {current}% now
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="10000"
                step="0.1"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(null); setSaved(false); }}
                className="w-full px-4 py-2.5 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/30"
                placeholder="e.g. 30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">%</span>
            </div>
            <Button
              className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl px-4"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 mb-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              Saved successfully
            </div>
          )}

          <div className={cn("rounded-xl px-3 py-2 text-xs", c.bg, c.text)}>
            Cost $10.00 → charged <span className="font-bold">${examplePrice}</span>
            <span className="text-gray-400 dark:text-gray-500 ml-1">({multiplier}x multiplier)</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    fetch("/api/admin/markup")
      .then((r) => {
        if (r.status === 403 || r.status === 401) {
          router.replace("/dashboard");
        } else {
          setAllowed(true);
        }
      })
      .catch(() => router.replace("/dashboard"))
      .finally(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#7C5CFC]" />
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-24 md:px-6 md:pt-6 max-w-2xl mx-auto">

        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7C5CFC] flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage pricing markup across all services</p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
          <Lock className="h-3.5 w-3.5 flex-shrink-0" />
          Changes take effect immediately on the next request — no restart needed.
        </div>

        <div className="space-y-4">
          {SETTINGS_CONFIG.map((s) => (
            <MarkupCard key={s.endpoint} {...s} />
          ))}
        </div>
      </div>
    </div>
  );
}
