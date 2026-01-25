"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/Navbar"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Phone, ShoppingBag } from "lucide-react"
import { 
  FaFacebook, 
  FaInstagram, 
  FaTwitter, 
  FaTiktok, 
  FaYoutube, 
  FaTelegram,
  FaLinkedin,
  FaSpotify,
  FaApple,
  FaSnapchat,
  FaReddit
} from "react-icons/fa"

const reviews = [
  {
    name: "Sarah Johnson",
    role: "Content Creator",
    avatar: "SJ",
    text: "SocialBoost transformed my Instagram! I gained 10K real followers in just a week. The service is fast, reliable, and the results speak for themselves.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Business Owner",
    avatar: "MC",
    text: "Best investment I've made for my brand. The engagement rate increased dramatically and my posts are now reaching thousands more people.",
    rating: 5,
  },
  {
    name: "Emma Williams",
    role: "Influencer",
    avatar: "EW",
    text: "I've tried many services, but SocialBoost is by far the best. Real followers, fast delivery, and excellent customer support. Highly recommend!",
    rating: 5,
  },
  {
    name: "Alex Martinez",
    role: "Digital Marketer",
    avatar: "AM",
    text: "Numzaro helped me get reliable phone numbers for my business verification needs. The platform is intuitive and the service is excellent!",
    rating: 5,
  },
  {
    name: "Jessica Taylor",
    role: "Fashion Blogger",
    avatar: "JT",
    text: "I've been using Numzaro for 6 months now and I'm amazed by the quality. All phone numbers work perfectly for SMS verification. My business has never been smoother!",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Entrepreneur",
    avatar: "DK",
    text: "The best phone number service I've ever used. Fast, reliable, and affordable. Perfect for SMS verification and business communications.",
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
        <Button size="lg" variant={variant} className={`w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg ${variant === "default" ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" : "border-2 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"}`}>
          {children}
        </Button>
      </Link>
    );
  }

  return (
    <Button 
      size="lg" 
      variant={variant} 
      className={`w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg ${variant === "default" ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" : "border-2 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"}`}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950/20 dark:to-blue-950/20">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-purple-500/10 dark:from-primary/20 dark:via-secondary/20 dark:to-purple-500/20 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 blur-sm"
        >
          <source src="/grok-video-b75530d2-cbcb-43e4-aff5-d740aa64a994.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50 dark:bg-black/70 z-[1]"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10 z-[2]">
          <div className="absolute left-[10%] top-0 w-1 h-full bg-gradient-to-b from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800"></div>
          <div className="absolute right-[10%] top-0 w-1 h-full bg-gradient-to-b from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800"></div>
        </div>

        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-20 relative z-[3]">
          <div className="max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 mb-8 sm:mb-12">

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight px-2">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Connect Globally with
                </span>
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Powerful Services
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-purple-200 dark:text-primary/70 max-w-3xl mx-auto leading-relaxed px-4 font-light">
                Virtual phone numbers for SMS verification & social media boosting services to grow your online presence
              </p>
                
              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-8 px-4">
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
                      Boost your socials
                    </div>
                  </ServiceCTA>
                </div>
              </div>
            </div>
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto px-4">
              <Card className="text-center p-3 sm:p-4 border border-blue-200/50 dark:border-blue-500/30 bg-white/10 dark:bg-white/5 backdrop-blur-md hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-xl transition-all">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">827K+</div>
                <p className="text-xs sm:text-sm text-blue-100 dark:text-blue-300 font-medium">Active Users</p>
              </Card>
              <Card className="text-center p-3 sm:p-4 border border-purple-200/50 dark:border-purple-500/30 bg-white/10 dark:bg-white/5 backdrop-blur-md hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-xl transition-all">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">4M+</div>
                <p className="text-xs sm:text-sm text-purple-100 dark:text-purple-300 font-medium">Orders Delivered</p>
              </Card>
              <Card className="text-center p-3 sm:p-4 border border-green-200/50 dark:border-green-500/30 bg-white/10 dark:bg-white/5 backdrop-blur-md hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-xl transition-all">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">50K+</div>
                <p className="text-xs sm:text-sm text-green-100 dark:text-green-300 font-medium">Phone Numbers</p>
              </Card>
              <Card className="text-center p-3 sm:p-4 border border-orange-200/50 dark:border-orange-500/30 bg-white/10 dark:bg-white/5 backdrop-blur-md hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-xl transition-all">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-1">15+</div>
                <p className="text-xs sm:text-sm text-orange-100 dark:text-orange-300 font-medium">Platforms</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-purple-500/10 dark:from-primary/20 dark:via-secondary/20 dark:to-purple-500/20 rounded-2xl blur-xl"></div>
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
                Our Services
              </h2>
            </div>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-primary/80 dark:text-primary/70 max-w-2xl mx-auto px-4 font-medium">
            Two powerful solutions to help you grow your business and online presence
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto mb-12">
          {/* Virtual Numbers Service */}
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-md">
                <Phone className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl text-blue-900 dark:text-blue-100">Virtual Phone Numbers</CardTitle>
              <CardDescription className="text-sm sm:text-base text-blue-700 dark:text-blue-300">
                Get phone numbers from 100+ countries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 leading-relaxed mb-4">
                Purchase virtual phone numbers for SMS verification, OTP services, and business communications. Perfect for account verification, two-factor authentication, and receiving SMS messages from any platform.
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>SMS verification for any platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Instant activation within minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Real numbers from verified carriers</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Access messages and OTPs in real-time</span>
                </li>
              </ul>
              <div className="mt-6">
                <ServiceCTA destination="numbers" variant="default">
                  Get Virtual Numbers
                </ServiceCTA>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Boosting Service */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-md">
                <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl text-purple-900 dark:text-purple-100">Social Media Boosting</CardTitle>
              <CardDescription className="text-sm sm:text-base text-purple-700 dark:text-purple-300">
                Grow your social media presence across 15+ platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 leading-relaxed mb-4">
                Boost your social media accounts with followers, likes, views, comments, and more. Support for Instagram, Facebook, TikTok, YouTube, Twitter, LinkedIn, and many other platforms.
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-purple-800 dark:text-purple-200">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Followers, likes, views, and comments</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>15+ platforms supported</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Fast delivery and real engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Refill and cancel options available</span>
                </li>
              </ul>
              <div className="mt-6">
                <ServiceCTA destination="services" variant="outline">
                  Boost Your Socials
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
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-purple-500/10 dark:from-primary/20 dark:via-secondary/20 dark:to-purple-500/20 rounded-2xl blur-xl"></div>
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
                Why Choose Numzaro?
              </h2>
            </div>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-primary/80 dark:text-primary/70 max-w-2xl mx-auto px-4 font-medium">
            Everything you need for phone numbers and social media growth, all in one powerful platform
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-blue-900 dark:text-blue-100">Fast Delivery</CardTitle>
              <CardDescription className="text-sm sm:text-base text-blue-700 dark:text-blue-300">
                Services delivered quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 leading-relaxed">
                Get virtual phone numbers activated within minutes. Social media orders start processing immediately. Automated setup for instant access to all services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-green-900 dark:text-green-100">Social Media Growth</CardTitle>
              <CardDescription className="text-sm sm:text-base text-green-700 dark:text-green-300">
                Boost followers, likes, views & more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-green-800 dark:text-green-200 leading-relaxed">
                Grow your social media presence across 15+ platforms including Instagram, Facebook, TikTok, YouTube, and more. Get real followers, likes, views, and comments to boost your online presence.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-purple-900 dark:text-purple-100">Reliable Service</CardTitle>
              <CardDescription className="text-sm sm:text-base text-purple-700 dark:text-purple-300">
                Trusted by thousands of users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 leading-relaxed">
                We provide real, working phone numbers from verified carriers and authentic social media engagement from real accounts. Quality you can trust.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-orange-900 dark:text-orange-100">Secure & Safe</CardTitle>
              <CardDescription className="text-sm sm:text-base text-orange-700 dark:text-orange-300">
                Enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-orange-800 dark:text-orange-200 leading-relaxed">
                All transactions are secure and compliant. Industry-standard encryption keeps your data and accounts safe.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>


      {/* Reviews Section */}
      <section className="py-12 md:py-20 overflow-hidden">
        <div className="container mx-auto px-4 mb-8 md:mb-16">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 dark:from-pink-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 rounded-2xl blur-xl"></div>
              <div className="relative">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3 md:mb-4 px-4">
                  What Our Customers Say
                </h2>
              </div>
            </div>
            <p className="text-base md:text-xl text-primary/80 dark:text-primary/70 max-w-2xl mx-auto px-4 font-medium">
              Join thousands of satisfied customers who trust Numzaro for virtual numbers and social media growth
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
                <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl h-full dark:border-gray-800 dark:hover:border-[#1877F2] dark:bg-gray-800">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                        {review.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">{review.name}</h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate">{review.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3 md:mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
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
                <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl h-full dark:border-gray-800 dark:hover:border-[#1877F2] dark:bg-gray-800">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                        {review.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">{review.name}</h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate">{review.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3 md:mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
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

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl my-20 dark:from-blue-600 dark:to-purple-700">
        <h2 className="text-4xl font-bold mb-6 text-white">Ready to Boost Your Business?</h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of users who trust Numzaro for virtual phone numbers and social media growth services.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/dashboard/numbers">
            <Button size="lg" variant="outline" className="border-white hover:bg-white/10 hover:text-white">
              Get Virtual Numbers
            </Button>
          </Link>
          <Link href="/dashboard/services">
            <Button size="lg" variant="outline" className="border-white hover:bg-white/10 hover:text-white">
              Boost Your Socials
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
              <div className="text-2xl font-bold text-[#1877F2]">Numzaro</div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Virtual phone numbers and social media boosting services in one powerful platform. Grow your business and online presence.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-[#1877F2] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#1877F2] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#1877F2] transition-colors">
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
                  <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/numbers" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
                    Phone Numbers
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
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
                  <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#faq" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
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
                  <Link href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-gray-600 dark:text-gray-300 hover:text-[#1877F2] transition-colors">
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
                  className="text-[#1877F2] hover:underline transition-colors"
                >
                  Jabulani Usen
                </a>
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-300">
              <span>827K+ Active Users</span>
              <span className="hidden sm:inline">•</span>
              <span>50K+ Phone Numbers</span>
              <span className="hidden sm:inline">•</span>
              <span>4M+ Orders Delivered</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

