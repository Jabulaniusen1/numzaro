"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F2FA] dark:bg-gray-950 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#7C5CFC]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Password updated</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <button
            onClick={() => router.replace("/auth/login")}
            className="mt-2 w-full h-12 rounded-2xl bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white text-sm font-bold shadow-lg shadow-violet-200 dark:shadow-none transition-all"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2FA] dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl px-8 py-10 space-y-7">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center">
          <Image src="/logo%20c%26b.png" alt="Numzaro" width={140} height={44} className="dark:hidden" priority />
          <Image src="/logo%20w%26c.png" alt="Numzaro" width={140} height={44} className="hidden dark:block" priority />
        </Link>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Set new password</h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Choose a strong password for your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide" htmlFor="password">
              New Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 pr-11 focus-visible:ring-[#7C5CFC]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide" htmlFor="confirm">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 pr-11 focus-visible:ring-[#7C5CFC]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white text-sm font-bold shadow-lg shadow-violet-200 dark:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
