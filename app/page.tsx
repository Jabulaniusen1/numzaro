import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/Navbar"

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-yellow-50 to-blue-100 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-purple-200 dark:from-purple-900 dark:via-pink-900 dark:to-blue-900 overflow-hidden">
        {/* Animated cartoon background elements */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute left-[10%] top-0 w-2 h-full bg-gradient-to-b from-pink-400 via-purple-400 to-blue-400 animate-pulse"></div>
          <div className="absolute right-[10%] top-0 w-2 h-full bg-gradient-to-b from-yellow-400 via-pink-400 to-purple-400 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute left-[50%] top-20 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-40 animate-bounce-cartoon"></div>
          <div className="absolute right-[20%] bottom-20 w-40 h-40 bg-pink-300 rounded-full blur-3xl opacity-40 animate-bounce-cartoon" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 mb-8 sm:mb-12">

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-purple-900 dark:text-purple-100 leading-tight px-2 drop-shadow-lg">
                Grow Your Social Media & Get
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-yellow-400 bg-clip-text text-transparent animate-rainbow">
                  Virtual Phone Numbers
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-purple-800 dark:text-purple-200 max-w-3xl mx-auto leading-relaxed px-4 font-medium">
                Boost your followers, likes, and engagement across all platforms. Plus, get virtual phone numbers for SMS verification, WhatsApp, Telegram, and more.
              </p>

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-8 px-4">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white shadow-2xl hover:shadow-pink-500/50 transform hover:scale-110 transition-all duration-200 rounded-cartoon border-4 border-white animate-bounce-cartoon">
                    🎉 Get Started Free
                  </Button>
                </Link>
                <Link href="/dashboard/services" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg border-4 border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-cartoon font-bold">
                    ✨ View Services
                  </Button>
                </Link>
              </div>
              </div>

            {/* Dual Service Cards */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto mb-8 sm:mb-12 px-4">
              {/* Social Media Services Card */}
              <Card className="border-4 border-pink-400 dark:border-pink-600 bg-gradient-to-br from-pink-100 via-yellow-50 to-purple-100 dark:from-pink-900/50 dark:via-purple-900/50 dark:to-blue-900/50 hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-cartoon bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-2xl flex-shrink-0 animate-bounce-cartoon">
                      <span className="text-2xl sm:text-3xl md:text-4xl">👥</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900 dark:text-purple-100">Social Media Growth</h3>
                      <p className="text-xs sm:text-sm text-pink-700 dark:text-pink-300 font-semibold">Followers, Likes, Comments</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 mb-3 sm:mb-4 leading-relaxed font-medium">
                    Grow your presence on Facebook, Instagram, Twitter, TikTok, YouTube, and more with real followers and authentic engagement.
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <span className="px-2 sm:px-3 py-1 bg-blue-300 dark:bg-blue-700 text-blue-900 dark:text-blue-100 rounded-full text-xs font-bold border-2 border-blue-500">Facebook</span>
                    <span className="px-2 sm:px-3 py-1 bg-pink-300 dark:bg-pink-700 text-pink-900 dark:text-pink-100 rounded-full text-xs font-bold border-2 border-pink-500">Instagram</span>
                    <span className="px-2 sm:px-3 py-1 bg-purple-300 dark:bg-purple-700 text-purple-900 dark:text-purple-100 rounded-full text-xs font-bold border-2 border-purple-500">Twitter/X</span>
                    <span className="px-2 sm:px-3 py-1 bg-yellow-300 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 rounded-full text-xs font-bold border-2 border-yellow-500">TikTok</span>
                    <span className="px-2 sm:px-3 py-1 bg-red-300 dark:bg-red-700 text-red-900 dark:text-red-100 rounded-full text-xs font-bold border-2 border-red-500">YouTube</span>
                  </div>
                  <Link href="/dashboard/services">
                    <Button className="w-full text-sm sm:text-base bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white rounded-cartoon border-2 border-white font-bold shadow-lg">
                      🚀 Explore Services
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Phone Numbers Card */}
              <Card className="border-4 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 dark:from-purple-900/50 dark:via-blue-900/50 dark:to-pink-900/50 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-cartoon bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 flex items-center justify-center shadow-2xl flex-shrink-0 animate-bounce-cartoon" style={{ animationDelay: '0.5s' }}>
                      <span className="text-2xl sm:text-3xl md:text-4xl">📱</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900 dark:text-purple-100">Virtual Phone Numbers</h3>
                      <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-semibold">SMS, OTP, Verification</p>
                </div>
                  </div>
                  <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 mb-3 sm:mb-4 leading-relaxed font-medium">
                    Get virtual numbers from 50+ countries for SMS verification, WhatsApp, Telegram, TikTok, and account creation.
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <span className="px-2 sm:px-3 py-1 bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100 rounded-full text-xs font-bold border-2 border-green-500">WhatsApp</span>
                    <span className="px-2 sm:px-3 py-1 bg-blue-300 dark:bg-blue-700 text-blue-900 dark:text-blue-100 rounded-full text-xs font-bold border-2 border-blue-500">Telegram</span>
                    <span className="px-2 sm:px-3 py-1 bg-yellow-300 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 rounded-full text-xs font-bold border-2 border-yellow-500">TikTok</span>
                    <span className="px-2 sm:px-3 py-1 bg-purple-300 dark:bg-purple-700 text-purple-900 dark:text-purple-100 rounded-full text-xs font-bold border-2 border-purple-500">SMS OTP</span>
                </div>
                  <Link href="/dashboard/numbers">
                    <Button className="w-full text-sm sm:text-base bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 hover:from-purple-600 hover:via-blue-600 hover:to-pink-600 text-white rounded-cartoon border-2 border-white font-bold shadow-lg">
                      🔍 Browse Numbers
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto px-4">
              <div className="text-center p-3 sm:p-4 rounded-cartoon bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-800/50 dark:to-purple-800/50 backdrop-blur-sm border-4 border-pink-400 dark:border-pink-600 transform hover:scale-110 transition-all">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-900 dark:text-purple-100 mb-1">827K+</div>
                <p className="text-xs sm:text-sm text-pink-800 dark:text-pink-200 font-bold">Active Users</p>
                </div>
              <div className="text-center p-3 sm:p-4 rounded-cartoon bg-gradient-to-br from-yellow-200 to-pink-200 dark:from-yellow-800/50 dark:to-pink-800/50 backdrop-blur-sm border-4 border-yellow-400 dark:border-yellow-600 transform hover:scale-110 transition-all">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-pink-900 dark:text-pink-100 mb-1">4M+</div>
                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-bold">Orders Delivered</p>
                  </div>
              <div className="text-center p-3 sm:p-4 rounded-cartoon bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800/50 dark:to-purple-800/50 backdrop-blur-sm border-4 border-blue-400 dark:border-blue-600 transform hover:scale-110 transition-all">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-900 dark:text-purple-100 mb-1">50K+</div>
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 font-bold">Phone Numbers</p>
                </div>
              <div className="text-center p-3 sm:p-4 rounded-cartoon bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/50 dark:to-pink-800/50 backdrop-blur-sm border-4 border-purple-400 dark:border-purple-600 transform hover:scale-110 transition-all">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-pink-900 dark:text-pink-100 mb-1">15+</div>
                <p className="text-xs sm:text-sm text-purple-800 dark:text-purple-200 font-bold">Platforms</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20 bg-gradient-to-b from-yellow-50 via-pink-50 to-purple-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-purple-900 dark:text-purple-100 mb-3 sm:mb-4 px-4 drop-shadow-lg">
            🎨 Why Choose Numzaro?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-purple-800 dark:text-purple-200 max-w-2xl mx-auto px-4 font-semibold">
            Everything you need for phone number management, all in one powerful platform
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
          <Card className="border-4 border-blue-400 dark:border-blue-600 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-cartoon bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-3 sm:mb-4 shadow-xl">
                <span className="text-2xl sm:text-3xl md:text-4xl">⚡</span>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-purple-900 dark:text-purple-100">Fast Delivery</CardTitle>
              <CardDescription className="text-sm sm:text-base text-blue-700 dark:text-blue-300 font-semibold">
                Phone number services delivered quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 leading-relaxed font-medium">
                Get virtual phone numbers activated within minutes. Automated setup for instant access to SMS and call services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-green-400 dark:border-green-600 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-cartoon bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center mb-3 sm:mb-4 shadow-xl">
                <span className="text-2xl sm:text-3xl md:text-4xl">📱</span>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-purple-900 dark:text-purple-100">Phone Numbers</CardTitle>
              <CardDescription className="text-sm sm:text-base text-green-700 dark:text-green-300 font-semibold">
                Virtual numbers for SMS & calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 leading-relaxed font-medium">
                Get virtual phone numbers from multiple countries. Perfect for SMS verification, business communications, and OTP services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-cartoon bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 sm:mb-4 shadow-xl">
                <span className="text-2xl sm:text-3xl md:text-4xl">✅</span>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-purple-900 dark:text-purple-100">Reliable Service</CardTitle>
              <CardDescription className="text-sm sm:text-base text-purple-700 dark:text-purple-300 font-semibold">
                Reliable phone number services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 leading-relaxed font-medium">
                We provide real, working phone numbers from verified carriers to ensure reliable SMS and call services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-yellow-400 dark:border-yellow-600 bg-gradient-to-br from-yellow-100 to-pink-100 dark:from-yellow-900/50 dark:to-pink-900/50 hover:shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-cartoon bg-gradient-to-br from-yellow-500 to-pink-500 flex items-center justify-center mb-3 sm:mb-4 shadow-xl">
                <span className="text-2xl sm:text-3xl md:text-4xl">🔒</span>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-purple-900 dark:text-purple-100">Secure & Safe</CardTitle>
              <CardDescription className="text-sm sm:text-base text-yellow-700 dark:text-yellow-300 font-semibold">
                Enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 leading-relaxed font-medium">
                All transactions are secure and compliant. Industry-standard encryption keeps your data and accounts safe.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Phone Number Services Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-purple-50 via-blue-50 to-pink-50 dark:from-purple-950 dark:via-blue-950 dark:to-pink-950">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-purple-900 dark:text-purple-100 mb-4 drop-shadow-lg">
            📞 Phone Number Services
          </h2>
          <p className="text-xl text-purple-800 dark:text-purple-200 max-w-2xl mx-auto font-semibold">
            Virtual phone numbers for SMS, calls, and verification. Perfect for businesses and developers.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          <Card className="border-4 border-blue-400 dark:border-blue-600 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-cartoon bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4 shadow-xl">
                <span className="text-4xl">💬</span>
              </div>
              <CardTitle className="text-2xl text-purple-900 dark:text-purple-100">SMS & Voice</CardTitle>
              <CardDescription className="text-base text-blue-700 dark:text-blue-300 font-semibold">
                Full communication support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 dark:text-purple-200 leading-relaxed mb-4 font-medium">
                Receive SMS messages and handle voice calls with virtual numbers from multiple countries.
              </p>
              <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  SMS inbox management
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Call forwarding
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  OTP verification
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-4 border-green-400 dark:border-green-600 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-cartoon bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center mb-4 shadow-xl">
                <span className="text-4xl">🌍</span>
              </div>
              <CardTitle className="text-2xl text-purple-900 dark:text-purple-100">Multiple Countries</CardTitle>
              <CardDescription className="text-base text-green-700 dark:text-green-300 font-semibold">
                Global number selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 dark:text-purple-200 leading-relaxed mb-4 font-medium">
                Choose from phone numbers in multiple countries for international reach and local presence.
              </p>
              <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  50+ countries available
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Instant activation
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Affordable pricing
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-4 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-cartoon bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-xl">
                <span className="text-4xl">🏢</span>
              </div>
              <CardTitle className="text-2xl text-purple-900 dark:text-purple-100">Business Ready</CardTitle>
              <CardDescription className="text-base text-purple-700 dark:text-purple-300 font-semibold">
                Enterprise features included
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 dark:text-purple-200 leading-relaxed mb-4 font-medium">
                Perfect for businesses needing reliable phone number services for customer support and verification.
              </p>
              <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Call logs & analytics
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  API integration
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  24/7 support
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-8">
          <Link href="/dashboard/numbers">
            <Button size="lg" variant="outline" className="border-4 border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-cartoon font-bold">
              🔍 Browse Phone Numbers
            </Button>
          </Link>
        </div>
      </section>


      {/* Social Media Services Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-pink-50 via-purple-50 to-yellow-50 dark:from-pink-950 dark:via-purple-950 dark:to-yellow-950">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-purple-900 dark:text-purple-100 mb-4 drop-shadow-lg">
            🎯 Social Media Growth Services
          </h2>
          <p className="text-xl text-purple-800 dark:text-purple-200 max-w-2xl mx-auto font-semibold">
            Boost your social media presence with real followers, likes, comments, and engagement across all major platforms
          </p>
        </div>

        {/* Platform Icons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12 max-w-5xl mx-auto">
          {/* Facebook */}
          <Card className="border-4 border-blue-400 dark:border-blue-600 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 cursor-pointer rounded-cartoon transform hover:scale-110">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-cartoon bg-[#1877F2] flex items-center justify-center mb-3 shadow-xl animate-bounce-cartoon">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">Facebook</p>
            </CardContent>
          </Card>

          {/* Instagram */}
          <Card className="border-4 border-pink-400 dark:border-pink-600 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 cursor-pointer rounded-cartoon transform hover:scale-110">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-cartoon bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center mb-3 shadow-xl animate-bounce-cartoon" style={{ animationDelay: '0.2s' }}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">Instagram</p>
            </CardContent>
          </Card>

          {/* Twitter/X */}
          <Card className="border-4 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 cursor-pointer rounded-cartoon transform hover:scale-110">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-cartoon bg-black dark:bg-white flex items-center justify-center mb-3 shadow-xl animate-bounce-cartoon" style={{ animationDelay: '0.4s' }}>
                <svg className="w-8 h-8 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">X (Twitter)</p>
            </CardContent>
          </Card>

          {/* TikTok */}
          <Card className="border-4 border-yellow-400 dark:border-yellow-600 bg-gradient-to-br from-yellow-100 to-pink-100 dark:from-yellow-900/50 dark:to-pink-900/50 hover:shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 cursor-pointer rounded-cartoon transform hover:scale-110">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-cartoon bg-black dark:bg-white flex items-center justify-center mb-3 shadow-xl animate-bounce-cartoon" style={{ animationDelay: '0.6s' }}>
                <svg className="w-8 h-8 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">TikTok</p>
            </CardContent>
          </Card>

          {/* YouTube */}
          <Card className="border-4 border-red-400 dark:border-red-600 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 cursor-pointer rounded-cartoon transform hover:scale-110">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-cartoon bg-[#FF0000] flex items-center justify-center mb-3 shadow-xl animate-bounce-cartoon" style={{ animationDelay: '0.8s' }}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">YouTube</p>
            </CardContent>
          </Card>

          {/* Telegram */}
          <Card className="border-4 border-blue-400 dark:border-blue-600 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 cursor-pointer rounded-cartoon transform hover:scale-110">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-cartoon bg-[#0088cc] flex items-center justify-center mb-3 shadow-xl animate-bounce-cartoon" style={{ animationDelay: '1s' }}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">Telegram</p>
            </CardContent>
          </Card>
        </div>

        {/* Services Offered */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          <Card className="border-4 border-blue-400 dark:border-blue-600 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-cartoon bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4 shadow-xl">
                <span className="text-4xl">👥</span>
              </div>
              <CardTitle className="text-2xl text-purple-900 dark:text-purple-100">Followers</CardTitle>
              <CardDescription className="text-base text-blue-700 dark:text-blue-300 font-semibold">
                Grow your audience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 dark:text-purple-200 leading-relaxed mb-4 font-medium">
                Get real, active followers for your social media accounts. Boost your credibility and reach more people.
              </p>
              <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Real, active followers
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Fast delivery
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Refill available
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-4 border-pink-400 dark:border-pink-600 bg-gradient-to-br from-pink-100 to-red-100 dark:from-pink-900/50 dark:to-red-900/50 hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-cartoon bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mb-4 shadow-xl">
                <span className="text-4xl">❤️</span>
              </div>
              <CardTitle className="text-2xl text-purple-900 dark:text-purple-100">Likes & Reactions</CardTitle>
              <CardDescription className="text-base text-pink-700 dark:text-pink-300 font-semibold">
                Increase engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 dark:text-purple-200 leading-relaxed mb-4 font-medium">
                Boost your posts with likes, reactions, and engagement. Make your content stand out and reach more people.
              </p>
              <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Instant likes delivery
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  All reaction types
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  High-quality engagement
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-4 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 rounded-cartoon transform hover:scale-105">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-cartoon bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-xl">
                <span className="text-4xl">💬</span>
              </div>
              <CardTitle className="text-2xl text-purple-900 dark:text-purple-100">Comments</CardTitle>
              <CardDescription className="text-base text-purple-700 dark:text-purple-300 font-semibold">
                Authentic interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 dark:text-purple-200 leading-relaxed mb-4 font-medium">
                Get real comments and conversations on your posts. Increase engagement and build a community around your content.
              </p>
              <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Custom comments
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Natural delivery
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <span className="text-green-500 text-xl">✓</span>
                  Real accounts
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard/services">
            <Button size="lg" className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white rounded-cartoon border-4 border-white font-bold shadow-2xl">
              🎉 View All Services
            </Button>
          </Link>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-purple-50 via-pink-50 to-yellow-50 dark:from-purple-950 dark:via-pink-950 dark:to-yellow-950 overflow-hidden">
        <div className="container mx-auto px-4 mb-8 md:mb-16">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-purple-900 dark:text-purple-100 mb-3 md:mb-4 px-4 drop-shadow-lg">
              ⭐ What Our Customers Say
            </h2>
            <p className="text-base md:text-xl text-purple-800 dark:text-purple-200 max-w-2xl mx-auto px-4 font-semibold">
              Join thousands of satisfied customers who trust Numzaro for phone number services
            </p>
          </div>
        </div>
        
        {/* Infinite Scroll Container */}
        <div className="relative">
          {/* Left Fade Gradient - Responsive width */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-purple-50 via-pink-50/80 to-transparent dark:from-purple-950 dark:via-pink-950/80 dark:to-transparent z-10 pointer-events-none"></div>
          
          {/* Right Fade Gradient - Responsive width */}
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-purple-50 via-pink-50/80 to-transparent dark:from-purple-950 dark:via-pink-950/80 dark:to-transparent z-10 pointer-events-none"></div>
          
          {/* Scrolling Container */}
          <div className="flex gap-4 md:gap-6 animate-scroll-left">
            {/* First set of reviews */}
            {reviews.map((review, index) => (
              <div key={`first-${index}`} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[380px]">
                <Card className="border-4 border-pink-400 dark:border-pink-600 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/50 dark:via-purple-900/50 dark:to-blue-900/50 hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 h-full rounded-cartoon transform hover:scale-105">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-cartoon bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0 shadow-xl">
                        {review.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm md:text-base text-purple-900 dark:text-purple-100 truncate">{review.name}</h4>
                        <p className="text-xs md:text-sm text-pink-700 dark:text-pink-300 truncate font-semibold">{review.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3 md:mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i} className="text-2xl md:text-3xl">⭐</span>
                      ))}
                    </div>
                    <p className="text-sm md:text-base text-purple-800 dark:text-purple-200 leading-relaxed italic font-medium">
                      "{review.text}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
            
            {/* Duplicate set for seamless loop */}
            {reviews.map((review, index) => (
              <div key={`second-${index}`} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[380px]">
                <Card className="border-4 border-pink-400 dark:border-pink-600 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/50 dark:via-purple-900/50 dark:to-blue-900/50 hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 h-full rounded-cartoon transform hover:scale-105">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-cartoon bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0 shadow-xl">
                        {review.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm md:text-base text-purple-900 dark:text-purple-100 truncate">{review.name}</h4>
                        <p className="text-xs md:text-sm text-pink-700 dark:text-pink-300 truncate font-semibold">{review.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3 md:mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i} className="text-2xl md:text-3xl">⭐</span>
                      ))}
                    </div>
                    <p className="text-sm md:text-base text-purple-800 dark:text-purple-200 leading-relaxed italic font-medium">
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
      <section className="container mx-auto px-4 py-20 text-center bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-yellow-400 rounded-cartoon my-20 shadow-2xl border-4 border-white dark:border-purple-800 transform hover:scale-105 transition-all duration-300">
        <h2 className="text-4xl font-bold mb-6 text-white drop-shadow-lg">🎊 Ready to Boost Your Business?</h2>
        <p className="text-xl text-white/95 mb-8 max-w-2xl mx-auto font-bold">
          Join thousands of users who trust Numzaro for phone number services.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-purple-700 hover:bg-yellow-200 border-4 border-white rounded-cartoon font-bold shadow-xl transform hover:scale-110 transition-all">
              🚀 Get Started Free
            </Button>
          </Link>
          <Link href="/dashboard/numbers">
            <Button size="lg" variant="outline" className="border-4 border-white text-white hover:bg-white/20 hover:text-white rounded-cartoon font-bold shadow-xl transform hover:scale-110 transition-all">
              📱 View Phone Numbers
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Numzaro</div>
              <p className="text-purple-800 dark:text-purple-200 text-sm font-semibold">
                Phone number services in one powerful platform. Virtual numbers, real results.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-purple-600 dark:text-purple-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors transform hover:scale-125">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-purple-600 dark:text-purple-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors transform hover:scale-125">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-purple-600 dark:text-purple-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors transform hover:scale-125">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4 text-lg">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/pricing" className="text-purple-700 dark:text-purple-300 hover:text-pink-500 dark:hover:text-pink-400 transition-colors font-semibold">
                    💰 Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/numbers" className="text-purple-700 dark:text-purple-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-semibold">
                    📱 Phone Numbers
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-purple-700 dark:text-purple-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors font-semibold">
                    🚀 Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-purple-700 dark:text-purple-300 hover:text-purple-500 dark:hover:text-purple-400 transition-colors font-semibold">
                    📊 Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4 text-lg">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/contact" className="text-purple-700 dark:text-purple-300 hover:text-pink-500 dark:hover:text-pink-400 transition-colors font-semibold">
                    📧 Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#faq" className="text-purple-700 dark:text-purple-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-semibold">
                    ❓ FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-purple-700 dark:text-purple-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors font-semibold">
                    💵 Refund Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4 text-lg">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-purple-700 dark:text-purple-300 hover:text-pink-500 dark:hover:text-pink-400 transition-colors font-semibold">
                    📜 Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-purple-700 dark:text-purple-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-semibold">
                    🔒 Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-purple-700 dark:text-purple-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors font-semibold">
                    🍪 Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t-4 border-purple-400 dark:border-purple-600 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <p className="text-purple-800 dark:text-purple-200 text-sm text-center sm:text-left font-semibold">
              &copy; 2024 Numzaro. All rights reserved.
            </p>
              <p className="text-purple-800 dark:text-purple-200 text-sm font-semibold">
                Built by{" "}
                <a 
                  href="https://jabulaniusen.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-600 dark:text-pink-400 hover:text-purple-600 dark:hover:text-purple-400 underline transition-colors font-bold"
                >
                  Jabulani Usen
                </a>
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-purple-800 dark:text-purple-200 font-semibold">
              <span>827K+ Active Users</span>
              <span className="hidden sm:inline text-purple-500">•</span>
              <span>50K+ Phone Numbers</span>
              <span className="hidden sm:inline text-purple-500">•</span>
              <span>4M+ Orders Delivered</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

