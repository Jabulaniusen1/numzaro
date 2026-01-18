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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <div className="absolute left-[10%] top-0 w-1 h-full bg-gradient-to-b from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800"></div>
          <div className="absolute right-[10%] top-0 w-1 h-full bg-gradient-to-b from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800"></div>
        </div>

        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 mb-8 sm:mb-12">

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white leading-tight px-2">
                Grow Your Social Media & Get
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Virtual Phone Numbers
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
                Boost your followers, likes, and engagement across all platforms. Plus, get virtual phone numbers for SMS verification, WhatsApp, Telegram, and more.
              </p>

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-8 px-4">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/dashboard/services" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                    View Services
                  </Button>
                </Link>
                  </div>
                </div>

            {/* Dual Service Cards */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto mb-8 sm:mb-12 px-4">
              {/* Social Media Services Card */}
              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-2a3 3 0 00-3 3v2zM13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Social Media Growth</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Followers, Likes, Comments</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 mb-3 sm:mb-4 leading-relaxed">
                    Grow your presence on Facebook, Instagram, Twitter, TikTok, YouTube, and more with real followers and authentic engagement.
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <span className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">Facebook</span>
                    <span className="px-2 sm:px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-medium">Instagram</span>
                    <span className="px-2 sm:px-3 py-1 bg-black dark:bg-gray-700 text-white rounded-full text-xs font-medium">Twitter/X</span>
                    <span className="px-2 sm:px-3 py-1 bg-black dark:bg-gray-700 text-white rounded-full text-xs font-medium">TikTok</span>
                    <span className="px-2 sm:px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">YouTube</span>
                  </div>
                  <Link href="/dashboard/services">
                    <Button className="w-full text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Explore Services
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Phone Numbers Card */}
              <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Virtual Phone Numbers</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">SMS, OTP, Verification</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 mb-3 sm:mb-4 leading-relaxed">
                    Get virtual numbers from 50+ countries for SMS verification, WhatsApp, Telegram, TikTok, and account creation.
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <span className="px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">WhatsApp</span>
                    <span className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">Telegram</span>
                    <span className="px-2 sm:px-3 py-1 bg-black dark:bg-gray-700 text-white rounded-full text-xs font-medium">TikTok</span>
                    <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">SMS OTP</span>
                </div>
                  <Link href="/dashboard/numbers">
                    <Button className="w-full text-sm sm:text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      Browse Numbers
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto px-4">
              <div className="text-center p-3 sm:p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">827K+</div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">4M+</div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Orders Delivered</p>
                  </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">50K+</div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Phone Numbers</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">15+</div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Platforms</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-4">
            Why Choose Numzaro?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Everything you need for phone number management, all in one powerful platform
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl dark:text-white">Fast Delivery</CardTitle>
              <CardDescription className="text-sm sm:text-base dark:text-gray-300">
                Phone number services delivered quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Get virtual phone numbers activated within minutes. Automated setup for instant access to SMS and call services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl dark:text-white">Phone Numbers</CardTitle>
              <CardDescription className="text-sm sm:text-base dark:text-gray-300">
                Virtual numbers for SMS & calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Get virtual phone numbers from multiple countries. Perfect for SMS verification, business communications, and OTP services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl dark:text-white">Reliable Service</CardTitle>
              <CardDescription className="text-sm sm:text-base dark:text-gray-300">
                Reliable phone number services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                We provide real, working phone numbers from verified carriers to ensure reliable SMS and call services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl dark:text-white">Secure & Safe</CardTitle>
              <CardDescription className="text-sm sm:text-base dark:text-gray-300">
                Enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                All transactions are secure and compliant. Industry-standard encryption keeps your data and accounts safe.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Phone Number Services Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Phone Number Services
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Virtual phone numbers for SMS, calls, and verification. Perfect for businesses and developers.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <CardTitle className="text-2xl dark:text-white">SMS & Voice</CardTitle>
              <CardDescription className="text-base dark:text-gray-300">
                Full communication support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Receive SMS messages and handle voice calls with virtual numbers from multiple countries.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  SMS inbox management
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Call forwarding
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  OTP verification
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-2xl dark:text-white">Multiple Countries</CardTitle>
              <CardDescription className="text-base dark:text-gray-300">
                Global number selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Choose from phone numbers in multiple countries for international reach and local presence.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  50+ countries available
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Instant activation
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Affordable pricing
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <CardTitle className="text-2xl dark:text-white">Business Ready</CardTitle>
              <CardDescription className="text-base dark:text-gray-300">
                Enterprise features included
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Perfect for businesses needing reliable phone number services for customer support and verification.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Call logs & analytics
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  API integration
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24/7 support
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-8">
          <Link href="/dashboard/numbers">
            <Button size="lg" variant="outline">
              Browse Phone Numbers
            </Button>
          </Link>
        </div>
      </section>


      {/* Social Media Services Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Social Media Growth Services
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Boost your social media presence with real followers, likes, comments, and engagement across all major platforms
          </p>
        </div>

        {/* Platform Icons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12 max-w-5xl mx-auto">
          {/* Facebook */}
          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:hover:border-[#1877F2] cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#1877F2] flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Facebook</p>
            </CardContent>
          </Card>

          {/* Instagram */}
          <Card className="border-2 hover:border-pink-500 transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:hover:border-pink-500 cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Instagram</p>
            </CardContent>
          </Card>

          {/* Twitter/X */}
          <Card className="border-2 hover:border-black dark:hover:border-white transition-all duration-300 hover:shadow-lg dark:border-gray-800 cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">X (Twitter)</p>
            </CardContent>
          </Card>

          {/* TikTok */}
          <Card className="border-2 hover:border-black dark:hover:border-white transition-all duration-300 hover:shadow-lg dark:border-gray-800 cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">TikTok</p>
            </CardContent>
          </Card>

          {/* YouTube */}
          <Card className="border-2 hover:border-[#FF0000] transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:hover:border-[#FF0000] cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#FF0000] flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">YouTube</p>
            </CardContent>
          </Card>

          {/* Telegram */}
          <Card className="border-2 hover:border-[#0088cc] transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:hover:border-[#0088cc] cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#0088cc] flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Telegram</p>
            </CardContent>
          </Card>
        </div>

        {/* Services Offered */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-2a3 3 0 00-3 3v2zM13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <CardTitle className="text-2xl dark:text-white">Followers</CardTitle>
              <CardDescription className="text-base dark:text-gray-300">
                Grow your audience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Get real, active followers for your social media accounts. Boost your credibility and reach more people.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Real, active followers
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Fast delivery
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Refill available
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <CardTitle className="text-2xl dark:text-white">Likes & Reactions</CardTitle>
              <CardDescription className="text-base dark:text-gray-300">
                Increase engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Boost your posts with likes, reactions, and engagement. Make your content stand out and reach more people.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Instant likes delivery
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All reaction types
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  High-quality engagement
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#1877F2] transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:hover:border-[#1877F2]">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <CardTitle className="text-2xl dark:text-white">Comments</CardTitle>
              <CardDescription className="text-base dark:text-gray-300">
                Authentic interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Get real comments and conversations on your posts. Increase engagement and build a community around your content.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Custom comments
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Natural delivery
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Real accounts
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard/services">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              View All Services
            </Button>
          </Link>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
        <div className="container mx-auto px-4 mb-8 md:mb-16">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-4">
              What Our Customers Say
            </h2>
            <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Join thousands of satisfied customers who trust Numzaro for phone number services
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
          Join thousands of users who trust Numzaro for phone number services.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-[#1877F2] hover:bg-gray-100">
              Get Started Free
            </Button>
          </Link>
          <Link href="/dashboard/numbers">
            <Button size="lg" variant="outline" className="border-white hover:bg-white/10 hover:text-white">
              View Phone Numbers
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
                Phone number services in one powerful platform. Virtual numbers, real results.
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

