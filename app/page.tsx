"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/Navbar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Phone, ShoppingBag } from "lucide-react"
import { FaApple, FaFacebookF, FaGooglePlay, FaInstagram, FaLinkedinIn, FaTiktok, FaYoutube } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"

const reviews = [
  {
    name: "Sarah Johnson",
    role: "Content Creator",
    avatar: "SJ",
    text: "Numzaro made it easy to get verified with SMS numbers and scale my Instagram growth campaigns. Fast setup and clear delivery updates.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Business Owner",
    avatar: "MC",
    text: "We use Numzaro for social media marketing packages and business verification. The dashboard is simple and the results are consistent.",
    rating: 5,
  },
  {
    name: "Emma Williams",
    role: "Influencer",
    avatar: "EW",
    text: "Clean UI, fast delivery, and responsive support. Great for creators who need SMS verification and growth tools in one place.",
    rating: 5,
  },
  {
    name: "Alex Martinez",
    role: "Digital Marketer",
    avatar: "AM",
    text: "Reliable virtual phone numbers for OTP and account verification. Perfect for agencies managing multiple client accounts.",
    rating: 5,
  },
  {
    name: "Jessica Taylor",
    role: "Fashion Blogger",
    avatar: "JT",
    text: "Smooth experience for SMS verification and social media boosts. Orders are clearly tracked and delivered on time.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Entrepreneur",
    avatar: "DK",
    text: "Great value for virtual numbers and social media growth services. We onboarded our team in minutes.",
    rating: 5,
  },
];

// CTA Button Component with redirect handling
function ServiceCTA({ destination, children, variant = "default" }: { destination: "numbers" | "services", children: React.ReactNode, variant?: "default" | "outline" }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const path = destination === "numbers" ? "/dashboard/numbers" : "/dashboard/services";
    
    if (isLoggedIn) {
      router.push(path);
    } else {
      // Store redirect destination in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectAfterAuth", path);
      }
      router.push("/auth/signup");
    }
  };

  if (isLoggedIn === null) {
    // Show loading state or default link
    return (
      <Link href={destination === "numbers" ? "/dashboard/numbers" : "/dashboard/services"} className="w-full sm:w-auto">
        <Button size="lg" variant={variant} className={`w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg ${variant === "default" ? "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" : "border-2 border-primary/40 text-primary hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/10 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"}`}>
          {children}
        </Button>
      </Link>
    );
  }

  return (
    <Button 
      size="lg" 
      variant={variant} 
      className={`w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg ${variant === "default" ? "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" : "border-2 border-primary/40 text-primary hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/10 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"}`}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}

export default function HomePage() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const openWaitlist = () => {
    setIsWaitlistOpen(true);
    setWaitlistSubmitted(false);
  };
  const closeWaitlist = () => {
    setIsWaitlistOpen(false);
    setWaitlistEmail("");
    setWaitlistSubmitted(false);
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistSubmitted(true);
  };

  useEffect(() => {
    if (!isWaitlistOpen || !waitlistSubmitted) return;
    const timer = setTimeout(() => {
      closeWaitlist();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isWaitlistOpen, waitlistSubmitted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 dark:from-gray-950 dark:via-primary/10 dark:to-secondary/10">
      {/* Navigation */}
      <Navbar />

      {isWaitlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-white p-6 shadow-2xl dark:border-primary/30 dark:bg-gray-900">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-primary/60">Coming Soon</p>
              <h3 className="text-2xl font-semibold text-primary">Download App</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gray-900 px-3 py-2 text-white">
                <FaApple className="h-5 w-5" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-widest text-white/70">App Store</p>
                  <p className="text-sm font-semibold">Coming soon</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-secondary/20 bg-gray-900 px-3 py-2 text-white">
                <FaGooglePlay className="h-5 w-5" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-widest text-white/70">Google Play</p>
                  <p className="text-sm font-semibold">Coming soon</p>
                </div>
              </div>
            </div>
            <p className="text-sm sm:text-base text-primary/80 mb-6">
              The Numzaro mobile app is almost here. Join the wait list to get early access and launch updates.
            </p>
            {waitlistSubmitted ? (
              <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4 text-sm text-primary/80">
                Thanks! You’re on the wait list. We’ll email you when the app is ready.
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-xl border border-primary/20 bg-white/80 px-4 text-sm text-primary outline-none placeholder:text-primary/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-primary/30"
                  required
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="w-full">
                    Join wait list
                  </Button>
                  <Button variant="outline" className="w-full" type="button" onClick={closeWaitlist}>
                    Close
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute top-6 right-6 z-[2]">
          <div className="rounded-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-primary/20 dark:border-primary/30 shadow-sm p-1">
            <ThemeToggle />
          </div>
        </div>
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/20 dark:from-primary/25 dark:via-secondary/15 dark:to-primary/30"></div>
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"></div>
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24 relative z-[1]">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">
              {/* Left: Main Content */}
              <div className="text-center lg:text-left space-y-4 sm:space-y-6 md:space-y-8">
                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight px-2 lg:px-0">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Virtual Phone Numbers
                  </span>
                  <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    And Social Media Growth
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-primary/80 dark:text-primary/80 max-w-3xl mx-auto lg:mx-0 leading-relaxed px-4 lg:px-0 font-light">
                  Buy virtual phone numbers for SMS verification and scale your social media marketing with followers, likes, views, and engagement packages across top platforms.
                </p>
                  
                {/* Dual CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center mt-6 sm:mt-8 px-4 lg:px-0">
                  <div className="w-full sm:w-auto">
                    <ServiceCTA destination="numbers" variant="default">
                      <div className="flex items-center gap-2 justify-center">
                        <Phone className="w-5 h-5" />
                        Get Virtual Numbers
                      </div>
                    </ServiceCTA>
                  </div>
                  <div className="w-full sm:w-auto">
                    <ServiceCTA destination="services" variant="outline">
                      <div className="flex items-center gap-2 justify-center">
                        <ShoppingBag className="w-5 h-5" />
                        Grow Social Media
                      </div>
                    </ServiceCTA>
                  </div>
                </div>

                <div className="flex items-center justify-center lg:justify-start px-4 lg:px-0">
                  <button
                    type="button"
                    onClick={openWaitlist}
                    className="text-sm font-medium text-primary/80 hover:text-primary underline underline-offset-4 decoration-primary/40"
                  >
                    Download app (coming soon) — Join wait list
                  </button>
                </div>

                <div className="md:hidden mt-6 sm:mt-8 flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-primary/70">
                  <span>827K+ Active Users</span>
                  <span className="hidden sm:inline">•</span>
                  <span>50K+ Phone Numbers</span>
                  <span className="hidden sm:inline">•</span>
                  <span>4M+ Orders Delivered</span>
                </div>
              </div>

              {/* Right: App Preview */}
              <div className="space-y-6">
                <div className="relative hidden md:flex items-center justify-center min-h-[460px] sm:min-h-[520px]">
                  <div className="absolute -left-6 top-8 h-[360px] w-[200px] sm:h-[420px] sm:w-[230px] rounded-[2.2rem] bg-gradient-to-br from-secondary/20 to-primary/20 border border-secondary/30 shadow-2xl -rotate-6"></div>
                  <div className="relative h-[420px] w-[240px] sm:h-[500px] sm:w-[280px] rounded-[2.7rem] bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 shadow-2xl">
                    <div className="absolute top-3 left-1/2 h-6 w-20 -translate-x-1/2 rounded-full bg-primary/20"></div>
                    <div className="absolute inset-4 rounded-[2.2rem] bg-white/85 dark:bg-gray-900/70 border border-primary/10 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-secondary"></div>
                        <div className="h-3 w-20 rounded-full bg-primary/20"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="rounded-xl border border-primary/10 bg-white/80 dark:bg-gray-900/60 px-2 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-widest text-primary/60">Likes</p>
                          <p className="text-sm font-semibold text-primary">128k</p>
                        </div>
                        <div className="rounded-xl border border-primary/10 bg-white/80 dark:bg-gray-900/60 px-2 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-widest text-primary/60">Views</p>
                          <p className="text-sm font-semibold text-primary">3.2M</p>
                        </div>
                        <div className="rounded-xl border border-primary/10 bg-white/80 dark:bg-gray-900/60 px-2 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-widest text-primary/60">Follows</p>
                          <p className="text-sm font-semibold text-primary">41k</p>
                        </div>
                      </div>
                      <div className="h-28 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 border border-primary/10 mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-3 rounded-full bg-primary/15"></div>
                        <div className="h-3 rounded-full bg-primary/15 w-4/5"></div>
                        <div className="h-3 rounded-full bg-primary/15 w-3/5"></div>
                      </div>
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <div className="h-10 rounded-xl bg-secondary/20"></div>
                        <div className="h-10 rounded-xl bg-primary/20"></div>
                        <div className="h-10 rounded-xl bg-secondary/20"></div>
                      </div>
                      <div className="mt-4 h-11 rounded-xl bg-gradient-to-r from-primary/60 to-secondary/60"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social + Countries Strip */}
      <section className="relative -mt-8 sm:-mt-10 pb-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl rounded-2xl border border-primary/15 bg-white/80 dark:bg-white/5 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-primary/60">Platforms</span>
                <div className="flex items-center gap-2">
                  {[
                    { Icon: FaInstagram, color: "text-[#E1306C]" },
                    { Icon: FaTiktok, color: "text-[#010101]" },
                    { Icon: FaYoutube, color: "text-[#FF0000]" },
                    { Icon: FaFacebookF, color: "text-[#1877F2]" },
                    { Icon: FaXTwitter, color: "text-[#000000]" },
                    { Icon: FaLinkedinIn, color: "text-[#0A66C2]" },
                  ].map(({ Icon, color }, index) => (
                    <span
                      key={`social-strip-${index}`}
                      className="h-9 w-9 rounded-full border border-primary/15 bg-white/70 dark:bg-white/5 flex items-center justify-center"
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden md:block h-6 w-px bg-primary/20"></div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-primary/60">Countries</span>
                <div className="flex items-center gap-2 text-lg">
                  <span className="h-9 w-9 rounded-full border border-secondary/20 bg-white/70 dark:bg-white/5 flex items-center justify-center">🇺🇸</span>
                  <span className="h-9 w-9 rounded-full border border-secondary/20 bg-white/70 dark:bg-white/5 flex items-center justify-center">🇬🇧</span>
                  <span className="h-9 w-9 rounded-full border border-secondary/20 bg-white/70 dark:bg-white/5 flex items-center justify-center">🇨🇦</span>
                  <span className="h-9 w-9 rounded-full border border-secondary/20 bg-white/70 dark:bg-white/5 flex items-center justify-center">🇳🇬</span>
                  <span className="h-9 w-9 rounded-full border border-secondary/20 bg-white/70 dark:bg-white/5 flex items-center justify-center">🇦🇺</span>
                  <span className="h-9 w-9 rounded-full border border-secondary/20 bg-white/70 dark:bg-white/5 flex items-center justify-center">🇮🇳</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 dark:from-primary/20 dark:via-secondary/20 dark:to-primary/20 rounded-2xl blur-xl"></div>
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
                Virtual Numbers & Social Media Services
              </h2>
            </div>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-primary/80 dark:text-primary/70 max-w-2xl mx-auto px-4 font-medium">
            Two SEO‑ready solutions to help businesses and creators verify accounts and grow online.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto mb-12">
          {/* Virtual Numbers Service */}
          <Card className="border-2 border-secondary/30 dark:border-secondary/40 bg-gradient-to-br from-secondary/10 to-primary/10 dark:from-secondary/10 dark:to-primary/10 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-md">
                <Phone className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl text-primary dark:text-primary">Virtual Phone Numbers</CardTitle>
              <CardDescription className="text-sm sm:text-base text-primary/70 dark:text-primary/70">
                SMS verification numbers from 100+ countries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80 dark:text-primary/80 leading-relaxed mb-4">
                Buy virtual phone numbers for SMS verification, OTP codes, and business communication. Ideal for account signups, two‑factor authentication, and receiving messages from global platforms.
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-primary/80 dark:text-primary/80">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>SMS verification for popular apps and websites</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Instant activation with real‑time OTP delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Numbers from verified telecom carriers</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Secure dashboard for message history</span>
                </li>
              </ul>
              <div className="mt-6">
                <ServiceCTA destination="numbers" variant="default">
                  Buy Virtual Numbers
                </ServiceCTA>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Boosting Service */}
          <Card className="border-2 border-primary/30 dark:border-primary/40 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/10 dark:to-secondary/10 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-md">
                <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl text-primary dark:text-primary">Social Media Boosting</CardTitle>
              <CardDescription className="text-sm sm:text-base text-primary/70 dark:text-primary/70">
                Social media growth across 15+ platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80 dark:text-primary/80 leading-relaxed mb-4">
                Order followers, likes, views, comments, and engagement packages for Instagram, TikTok, YouTube, Facebook, X, LinkedIn, and more.
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-primary/80 dark:text-primary/80">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Followers, likes, views, and comments</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>15+ platforms supported</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Fast delivery with tracked order status</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Refill and cancellation options available</span>
                </li>
              </ul>
              <div className="mt-6">
                <ServiceCTA destination="services" variant="outline">
                  Explore Growth Packages
                </ServiceCTA>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 dark:from-primary/20 dark:via-secondary/20 dark:to-primary/20 rounded-2xl blur-xl"></div>
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
                Why Businesses Choose Numzaro
              </h2>
            </div>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-primary/80 dark:text-primary/70 max-w-2xl mx-auto px-4 font-medium">
            A trusted platform for SMS verification, virtual numbers, and social media marketing services.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
          <Card className="border-2 border-secondary/30 dark:border-secondary/40 bg-gradient-to-br from-secondary/10 to-primary/10 dark:from-secondary/10 dark:to-primary/10 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-primary dark:text-primary">Fast Delivery</CardTitle>
              <CardDescription className="text-sm sm:text-base text-primary/70 dark:text-primary/70">
                Fast order processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80 dark:text-primary/80 leading-relaxed">
                Virtual numbers activate in minutes and social media orders start processing quickly with clear status tracking.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/30 dark:border-primary/40 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/10 dark:to-secondary/10 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-primary dark:text-primary">Social Media Growth</CardTitle>
              <CardDescription className="text-sm sm:text-base text-primary/70 dark:text-primary/70">
                Growth tools for every platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80 dark:text-primary/80 leading-relaxed">
                Campaigns for Instagram, TikTok, YouTube, Facebook, X, and LinkedIn with flexible package sizes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/30 dark:border-secondary/40 bg-gradient-to-br from-secondary/10 to-primary/10 dark:from-secondary/10 dark:to-primary/10 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-primary dark:text-primary">Reliable Service</CardTitle>
              <CardDescription className="text-sm sm:text-base text-primary/70 dark:text-primary/70">
                Trusted by teams worldwide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80 dark:text-primary/80 leading-relaxed">
                Verified carrier numbers and transparent delivery updates help teams move fast with confidence.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/30 dark:border-primary/40 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/10 dark:to-secondary/10 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-primary dark:text-primary">Secure & Safe</CardTitle>
              <CardDescription className="text-sm sm:text-base text-primary/70 dark:text-primary/70">
                Secure payments and privacy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80 dark:text-primary/80 leading-relaxed">
                Secure checkout, encrypted data, and privacy controls designed for businesses and creators.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 dark:from-primary/20 dark:via-secondary/20 dark:to-primary/20 rounded-2xl blur-xl"></div>
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent px-4">
                  About Numzaro
                </h2>
              </div>
            </div>
            <p className="text-base sm:text-lg text-primary/80 dark:text-primary/70 leading-relaxed px-4">
              Numzaro is a growth platform for businesses, agencies, and creators who need reliable virtual phone numbers for SMS verification and scalable social media marketing services. We combine fast delivery, transparent order tracking, and secure checkout so teams can verify accounts and grow online without delays.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3 px-4 text-sm sm:text-base text-primary/80 dark:text-primary/80">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-secondary"></span>
                <span>Global SMS verification numbers</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-secondary"></span>
                <span>Social media growth packages</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-secondary"></span>
                <span>Real‑time order status</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-secondary"></span>
                <span>Secure payments and support</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-semibold text-primary mb-3">Built for speed and scale</h3>
            <p className="text-sm sm:text-base text-primary/80 leading-relaxed mb-4">
              From single creators to multi‑account agencies, Numzaro helps you verify, launch, and grow faster. Manage SMS numbers, place growth orders, and track delivery in one unified dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 text-xs sm:text-sm rounded-full bg-primary/10 text-primary">SMS Verification</span>
              <span className="px-3 py-1 text-xs sm:text-sm rounded-full bg-secondary/10 text-primary">Social Media Growth</span>
              <span className="px-3 py-1 text-xs sm:text-sm rounded-full bg-primary/10 text-primary">Order Tracking</span>
              <span className="px-3 py-1 text-xs sm:text-sm rounded-full bg-secondary/10 text-primary">Secure Checkout</span>
            </div>
          </div>
        </div>
      </section>


      {/* Reviews Section */}
      <section className="py-12 md:py-20 overflow-hidden">
        <div className="container mx-auto px-4 mb-8 md:mb-16">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 dark:from-primary/20 dark:via-secondary/20 dark:to-primary/20 rounded-2xl blur-xl"></div>
              <div className="relative">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 md:mb-4 px-4">
                  Customer Reviews
                </h2>
              </div>
            </div>
            <p className="text-base md:text-xl text-primary/80 dark:text-primary/70 max-w-2xl mx-auto px-4 font-medium">
              Trusted by marketers, creators, and businesses for SMS verification and social media marketing services.
            </p>
          </div>
        </div>
        
        {/* Infinite Scroll Container */}
        <div className="relative">
          {/* Left Fade Gradient - Responsive width */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white via-gray-50/80 to-transparent dark:from-gray-900 dark:via-gray-950/80 dark:to-transparent z-10 pointer-events-none"></div>
          
          {/* Right Fade Gradient - Responsive width */}
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white via-gray-50/80 to-transparent dark:from-gray-900 dark:via-gray-950/80 dark:to-transparent z-10 pointer-events-none"></div>
          
          {/* Scrolling Container */}
          <div className="flex gap-4 md:gap-6 animate-scroll-left">
            {/* First set of reviews */}
            {reviews.map((review, index) => (
              <div key={`first-${index}`} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[380px]">
                <Card className="border-2 hover:border-secondary transition-all duration-300 hover:shadow-xl h-full dark:border-gray-800 dark:hover:border-secondary dark:bg-gray-800">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                        {review.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">{review.name}</h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate">{review.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3 md:mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 md:w-5 md:h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-200 leading-relaxed italic">
                      "{review.text}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
            
            {/* Duplicate set for seamless loop */}
            {reviews.map((review, index) => (
              <div key={`second-${index}`} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[380px]">
                <Card className="border-2 hover:border-secondary transition-all duration-300 hover:shadow-xl h-full dark:border-gray-800 dark:hover:border-secondary dark:bg-gray-800">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                        {review.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">{review.name}</h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate">{review.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3 md:mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 md:w-5 md:h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-200 leading-relaxed italic">
                      "{review.text}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 dark:from-primary/20 dark:via-secondary/20 dark:to-primary/20 rounded-2xl blur-xl"></div>
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
                Frequently Asked Questions
              </h2>
            </div>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-primary/80 dark:text-primary/70 max-w-2xl mx-auto px-4 font-medium">
            Quick answers about virtual phone numbers, SMS verification, and social media growth services.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-6xl mx-auto">
          <Card className="border-2 border-secondary/30 dark:border-secondary/40 bg-white/70 dark:bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary">How fast is SMS verification?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80">
                Most SMS verification numbers activate in minutes. OTPs arrive in real time and are available in your dashboard.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary/30 dark:border-primary/40 bg-white/70 dark:bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary">Which platforms do you support?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80">
                We support 15+ platforms including Instagram, TikTok, YouTube, Facebook, X, LinkedIn, and more.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-secondary/30 dark:border-secondary/40 bg-white/70 dark:bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary">Are virtual numbers safe to use?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80">
                Yes. Numbers are sourced from verified carriers and delivered through a secure, encrypted dashboard.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary/30 dark:border-primary/40 bg-white/70 dark:bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary">Can I track order delivery?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80">
                Every order includes clear delivery status updates so you can monitor progress at any time.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-secondary/30 dark:border-secondary/40 bg-white/70 dark:bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary">Do you offer refunds?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80">
                Refunds are available based on the service and delivery status. See the refund policy for full details.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary/30 dark:border-primary/40 bg-white/70 dark:bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary">How do I get support?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-primary/80">
                Contact support anytime for help with SMS verification, orders, or account setup.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center bg-gradient-to-r from-primary to-secondary rounded-2xl my-20 dark:from-primary dark:to-secondary">
        <h2 className="text-4xl font-bold mb-6 text-white">Start SMS Verification and Social Growth Today</h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of customers who trust Numzaro for virtual phone numbers, OTP delivery, and social media marketing packages.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/dashboard/numbers">
            <Button size="lg" variant="outline" className="border-white hover:bg-white/10 hover:text-white">
              Buy SMS Numbers
            </Button>
          </Link>
          <Link href="/dashboard/services">
            <Button size="lg" variant="outline" className="border-white hover:bg-white/10 hover:text-white">
              View Growth Services
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="text-2xl font-bold text-primary">Numzaro</div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Virtual phone numbers for SMS verification and social media marketing services for businesses, agencies, and creators.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-secondary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-secondary transition-colors">
                  <FaXTwitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-secondary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/numbers" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    Phone Numbers
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#faq" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-gray-600 dark:text-gray-300 hover:text-secondary transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <p className="text-gray-600 dark:text-gray-300 text-sm text-center sm:text-left">
              &copy; 2024 Numzaro. All rights reserved.
            </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Built by{" "}
                <a 
                  href="https://jabulaniusen.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-secondary hover:underline transition-colors"
                >
                  Jabulani Usen
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
