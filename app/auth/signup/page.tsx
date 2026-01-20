"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const reviews = [
  {
    name: "Alex Martinez",
    role: "Digital Marketer",
    avatar: "AM",
    text: "SocialBoost helped me grow my client's social media presence by 300% in just 2 months. The platform is intuitive and the results are incredible!",
    rating: 5,
  },
  {
    name: "Jessica Taylor",
    role: "Fashion Blogger",
    avatar: "JT",
    text: "I've been using SocialBoost for 6 months now and I'm amazed by the quality. All followers are real and engaged. My brand has never looked better!",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Entrepreneur",
    avatar: "DK",
    text: "The best social media growth service I've ever used. Fast, reliable, and affordable. My business profile now has the credibility it deserves.",
    rating: 5,
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReview, setCurrentReview] = useState(0);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Create user profile in public.users table
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    // Check for redirect destination in localStorage
    const redirectPath = typeof window !== "undefined" ? localStorage.getItem("redirectAfterAuth") : null;
    if (redirectPath) {
      localStorage.removeItem("redirectAfterAuth");
      router.push(redirectPath);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);

    // Store redirect destination if it exists
    const redirectPath = typeof window !== "undefined" ? localStorage.getItem("redirectAfterAuth") : null;
    const callbackUrl = redirectPath 
      ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`
      : `${window.location.origin}/auth/callback`;

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  // Rotate reviews
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white dark:bg-gray-900 p-8 relative overflow-hidden">
        {/* Decorative background elements for dark mode */}
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-blue-900/20 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-900/20 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div>
            <Link href="/" className="mb-6 inline-block">
              <Image
                src="/numzaro-logo.png"
                alt="Numzaro"
                width={140}
                height={40}
                className="h-8 w-auto dark:brightness-0 dark:invert"
                priority
              />
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-[#1877F2] hover:text-[#166fe5] dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800/50">
                <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base"
              >
                {loading ? "Creating account..." : "Sign up"}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

            <div>
              <Button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                variant="outline"
                className="w-full h-11"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Design with Reviews */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1877F2] via-blue-600 to-purple-600 dark:from-blue-700 dark:via-blue-800 dark:to-purple-700 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-300 dark:bg-pink-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-md space-y-8">
            <div>
              <h3 className="text-4xl font-bold mb-4">Start your growth journey today</h3>
              <p className="text-blue-100 text-lg">
                Join thousands of creators and businesses growing with SocialBoost
              </p>
            </div>

            {/* Review Card */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                  {reviews[currentReview].avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{reviews[currentReview].name}</h4>
                  <p className="text-sm text-blue-100">{reviews[currentReview].role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(reviews[currentReview].rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/90 leading-relaxed italic">
                "{reviews[currentReview].text}"
              </p>
            </Card>

            {/* Review indicators */}
            <div className="flex justify-center gap-2">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentReview(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentReview
                      ? "w-8 bg-white"
                      : "w-2 bg-white/40"
                  }`}
                  aria-label={`View review ${index + 1}`}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">827K+</div>
                <div className="text-sm text-blue-100">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">4M+</div>
                <div className="text-sm text-blue-100">Orders Delivered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
