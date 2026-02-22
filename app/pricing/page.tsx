"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/Navbar"
import { useCurrency } from "@/lib/hooks/use-currency"

export default function PricingPage() {
  const { format, convert } = useCurrency();
  
  const prices = {
    followers: 0.90,
    likes: 1.20,
    comments: 8.00
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Pricing Header */}
      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Pricing</h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          Transparent pricing for all our social media services. No hidden fees.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-12 md:pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Followers</CardTitle>
              <CardDescription>Grow your follower base</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#1877F2]">{format(convert(prices.followers))}</span>
                <span className="text-gray-600"> per 1000</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li>✓ Real followers</li>
                <li>✓ Fast delivery</li>
                <li>✓ Refill available</li>
                <li>✓ Cancel anytime</li>
              </ul>
              <Link href="/auth/signup">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Likes</CardTitle>
              <CardDescription>Boost your engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#1877F2]">{format(convert(prices.likes))}</span>
                <span className="text-gray-600"> per 1000</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li>✓ Real likes</li>
                <li>✓ Instant delivery</li>
                <li>✓ All platforms</li>
                <li>✓ Safe & secure</li>
              </ul>
              <Link href="/auth/signup">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>Engage your audience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#1877F2]">{format(convert(prices.comments))}</span>
                <span className="text-gray-600"> per 100</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li>✓ Custom comments</li>
                <li>✓ High quality</li>
                <li>✓ Natural engagement</li>
                <li>✓ Multiple options</li>
              </ul>
              <Link href="/auth/signup">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 pb-12 md:pb-16 scroll-mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 md:mb-12 px-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How fast is delivery?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Most orders start within minutes and are completed within 24-48 hours, depending on the quantity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Are the followers real?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Yes, we only work with real, active accounts to ensure authentic growth for your social media.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Is it safe for my account?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Absolutely. We never ask for your password and all services are delivered in a safe, compliant manner.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Can I cancel an order?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Yes, if the service allows cancellation, you can cancel your order from your dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-12 md:pb-16 text-center">
        <Card className="max-w-2xl mx-auto bg-[#1877F2] text-white border-none">
          <CardHeader>
            <CardTitle className="text-white">Ready to get started?</CardTitle>
            <CardDescription className="text-white/80">
              Create your account and start growing your social media today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signup">
              <Button variant="secondary" size="lg">
                Sign Up Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

