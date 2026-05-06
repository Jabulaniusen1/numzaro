"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";

const COUNTRY_PHONE_OPTIONS = [
  { code: "US", name: "United States", dial: "+1" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "BD", name: "Bangladesh", dial: "+880" },
  { code: "TR", name: "Turkey", dial: "+90" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "ES", name: "Spain", dial: "+34" },
  { code: "NL", name: "Netherlands", dial: "+31" },
  { code: "PT", name: "Portugal", dial: "+351" },
  { code: "BE", name: "Belgium", dial: "+32" },
  { code: "SE", name: "Sweden", dial: "+46" },
  { code: "NO", name: "Norway", dial: "+47" },
  { code: "DK", name: "Denmark", dial: "+45" },
  { code: "IE", name: "Ireland", dial: "+353" },
  { code: "CH", name: "Switzerland", dial: "+41" },
  { code: "AT", name: "Austria", dial: "+43" },
  { code: "PL", name: "Poland", dial: "+48" },
  { code: "RU", name: "Russia", dial: "+7" },
  { code: "UA", name: "Ukraine", dial: "+380" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "MX", name: "Mexico", dial: "+52" },
  { code: "AR", name: "Argentina", dial: "+54" },
  { code: "CO", name: "Colombia", dial: "+57" },
  { code: "CL", name: "Chile", dial: "+56" },
  { code: "PE", name: "Peru", dial: "+51" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "TH", name: "Thailand", dial: "+66" },
  { code: "VN", name: "Vietnam", dial: "+84" },
  { code: "ID", name: "Indonesia", dial: "+62" },
  { code: "PH", name: "Philippines", dial: "+63" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "KR", name: "South Korea", dial: "+82" },
  { code: "CN", name: "China", dial: "+86" },
];

const reviews = [
  {
    name: "Alex Martinez",
    role: "Digital Marketer",
    initials: "AM",
    text: "SocialBoost helped me grow my client's social presence by 300% in 2 months. The platform is intuitive and the results are incredible!",
    rating: 5,
  },
  {
    name: "Jessica Taylor",
    role: "Fashion Blogger",
    initials: "JT",
    text: "I've been using SocialBoost for 6 months and I'm amazed by the quality. All followers are real and engaged. My brand has never looked better!",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Entrepreneur",
    initials: "DK",
    text: "The best social media growth service I've ever used. Fast, reliable, and affordable. My business profile now has the credibility it deserves.",
    rating: 5,
  },
];

const FEATURES = [
  "Followers, likes & views delivered fast",
  "Virtual numbers from 100+ countries",
  "Auto-renewing monthly numbers",
  "24/7 order tracking & support",
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentReview((p) => (p + 1) % reviews.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const selectedCountry = COUNTRY_PHONE_OPTIONS.find((c) => c.code === countryCode);
    if (!selectedCountry) {
      setError("Please select a valid country.");
      setLoading(false);
      return;
    }
    const sanitizedPhone = phoneNumber.replace(/[^\d]/g, "");
    if (sanitizedPhone.length < 6) {
      setError("Please enter a valid phone number.");
      setLoading(false);
      return;
    }
    const phoneE164 = `${selectedCountry.dial}${sanitizedPhone}`;

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          country_code: selectedCountry.code,
          country_name: selectedCountry.name,
          phone_country_code: selectedCountry.dial,
          phone_number: sanitizedPhone,
          phone_e164: phoneE164,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Use user directly from signUp response — more reliable than a follow-up getUser()
    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        country_code: selectedCountry.code,
        country_name: selectedCountry.name,
        phone_country_code: selectedCountry.dial,
        phone_number: sanitizedPhone,
        phone_e164: phoneE164,
      });
    }

    // session is null when email confirmation is required
    if (data.session) {
      const redirectPath = typeof window !== "undefined" ? localStorage.getItem("redirectAfterAuth") : null;
      if (redirectPath) localStorage.removeItem("redirectAfterAuth");
      router.push(redirectPath || "/dashboard");
      router.refresh();
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  // ── Email confirmation screen ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F2FA] dark:bg-gray-950 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-[#7C5CFC]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Check your email</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-[#7C5CFC]">{email}</span>.
            <br />Click it to activate your account.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSuccess(false)}
              className="text-[#7C5CFC] hover:underline font-medium"
            >
              try again
            </button>
            .
          </p>
          <Link
            href="/auth/login"
            className="mt-2 text-sm font-semibold text-[#7C5CFC] hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F0F2FA] dark:bg-gray-950">

      {/* ── Left: Form ──────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center px-8 py-12 bg-white dark:bg-gray-900 shadow-xl">
        <div className="w-full max-w-sm mx-auto space-y-7">

          {/* Logo */}
          <Link href="/" className="inline-flex items-center">
            <Image src="/logo%20c%26b.png" alt="Numzaro" width={156} height={48} className="dark:hidden" priority />
            <Image src="/logo%20w%26c.png" alt="Numzaro" width={156} height={48} className="hidden dark:block" priority />
          </Link>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Create your account</h1>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Already have one?{" "}
              <Link href="/auth/login" className="font-semibold text-[#7C5CFC] hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide" htmlFor="fullName">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
              />
            </div>

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
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide" htmlFor="country">
                Country
              </label>
              <Combobox
                options={COUNTRY_PHONE_OPTIONS.map((country) => ({
                  value: country.code,
                  label: `${country.name} (${country.dial})`,
                }))}
                value={countryCode}
                onValueChange={setCountryCode}
                placeholder="Select country"
                searchPlaceholder="Search country or code..."
                emptyMessage="No country found."
                className="h-11 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 justify-between"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide" htmlFor="phoneNumber">
                Phone Number
              </label>
              <div className="flex gap-2">
                <Input
                  value={COUNTRY_PHONE_OPTIONS.find((c) => c.code === countryCode)?.dial || ""}
                  readOnly
                  className="h-11 w-24 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <Input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel-national"
                  required
                  placeholder="8012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-11 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus-visible:ring-[#7C5CFC]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Create a strong password"
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
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : "Create account"}
            </button>

            <p className="text-center text-xs text-gray-400">
              By signing up you agree to our{" "}
              <Link href="/terms" className="text-[#7C5CFC] hover:underline">Terms</Link>{" "}and{" "}
              <Link href="/privacy" className="text-[#7C5CFC] hover:underline">Privacy Policy</Link>
            </p>
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
            <p className="text-sm font-bold uppercase tracking-widest text-violet-200 mb-3">Start growing today</p>
            <h2 className="text-4xl font-black leading-tight">
              Your all-in-one social growth platform
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
            <p className="text-sm text-white/85 leading-relaxed">&ldquo;{reviews[currentReview].text}&rdquo;</p>
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
