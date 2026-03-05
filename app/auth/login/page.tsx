"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";

const reviews = [
  {
    name: "Sarah Johnson",
    role: "Content Creator",
    initials: "SJ",
    text: "SocialBoost transformed my Instagram! I gained 10K real followers in just a week. Fast, reliable, and the results speak for themselves.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Business Owner",
    initials: "MC",
    text: "Best investment I've made for my brand. Engagement rate increased dramatically and my posts reach thousands more people.",
    rating: 5,
  },
  {
    name: "Emma Williams",
    role: "Influencer",
    initials: "EW",
    text: "I've tried many services, but this is by far the best. Real followers, fast delivery, and excellent support. Highly recommend!",
    rating: 5,
  },
];

const FEATURES = [
  "Boost followers, likes & views",
  "Virtual numbers from 100+ countries",
  "Real-time order tracking",
  "Secure & private",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentReview((p) => (p + 1) % reviews.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); setLoading(false); return; }
    const redirectPath = typeof window !== "undefined" ? localStorage.getItem("redirectAfterAuth") : null;
    if (redirectPath) { localStorage.removeItem("redirectAfterAuth"); router.push(redirectPath); }
    else router.push("/dashboard");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const redirectPath = typeof window !== "undefined" ? localStorage.getItem("redirectAfterAuth") : null;
    const callbackUrl = redirectPath
      ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`
      : `${window.location.origin}/auth/callback`;
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl } });
    if (signInError) { setError(signInError.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#F0F2FA] dark:bg-gray-950">

      {/* ── Left: Form ──────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center px-8 py-12 bg-white dark:bg-gray-900 shadow-xl">
        <div className="w-full max-w-sm mx-auto space-y-8">

          {/* Logo */}
          <Link href="/" className="inline-block">
            <Image src="/numzaro-logo.png" alt="Numzaro" width={140} height={40} className="h-9 w-auto" priority />
          </Link>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Welcome back</h1>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              No account?{" "}
              <Link href="/auth/signup" className="font-semibold text-[#7C5CFC] hover:underline">
                Sign up free
              </Link>
            </p>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-[#7C5CFC]/40 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all disabled:opacity-50"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 pr-11 focus-visible:ring-[#7C5CFC]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white text-sm font-bold shadow-lg shadow-violet-200 dark:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      {/* ── Right: Brand panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#7C5CFC] via-violet-600 to-indigo-700 relative overflow-hidden items-center justify-center p-12">
        {/* Orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md w-full space-y-10 text-white">
          {/* Heading */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-violet-200 mb-3">Trusted by 800K+ users</p>
            <h2 className="text-4xl font-black leading-tight">
              Everything you need to grow online
            </h2>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm font-medium text-violet-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {f}
              </li>
            ))}
          </ul>

          {/* Review card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {reviews[currentReview].initials}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{reviews[currentReview].name}</p>
                <p className="text-xs text-violet-200">{reviews[currentReview].role}</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-sm text-white/85 leading-relaxed">"{reviews[currentReview].text}"</p>
            {/* Dots */}
            <div className="flex gap-1.5 pt-1">
              {reviews.map((_, i) => (
                <button key={i} onClick={() => setCurrentReview(i)}
                  className={`h-1.5 rounded-full transition-all ${i === currentReview ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-black">827K+</p>
              <p className="text-xs text-violet-200 mt-0.5">Active Users</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-3xl font-black">4M+</p>
              <p className="text-xs text-violet-200 mt-0.5">Orders Delivered</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-3xl font-black">100+</p>
              <p className="text-xs text-violet-200 mt-0.5">Countries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
