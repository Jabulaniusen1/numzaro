"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F2FA] dark:bg-gray-950 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-[#7C5CFC]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Check your email</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            We sent a password reset link to{" "}
            <span className="font-semibold text-[#7C5CFC]">{email}</span>.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-[#7C5CFC] hover:underline font-medium"
            >
              try again
            </button>
            .
          </p>
          <Link
            href="/auth/login"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C5CFC] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
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
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Forgot password?</h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Enter your email and we&apos;ll send you a reset link.
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
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white text-sm font-bold shadow-lg shadow-violet-200 dark:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send reset link"}
          </button>
        </form>

        <Link
          href="/auth/login"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#7C5CFC] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
