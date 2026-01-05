import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardContent className="p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using MilexBoost services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
                <p>
                  MilexBoost provides social media marketing services including but not limited to followers, likes, comments, and other engagement services. We are a third-party service provider and are not affiliated with any social media platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
                <p>To use our services, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Be at least 18 years old or have parental consent</li>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Not share your account with others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Service Usage</h2>
                <p>When using our services, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use services only for lawful purposes</li>
                  <li>Not use services to violate any platform's terms of service</li>
                  <li>Not use services to spam, harass, or harm others</li>
                  <li>Provide accurate information when placing orders</li>
                  <li>Not attempt to reverse engineer or interfere with our services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Payment Terms</h2>
                <p>
                  All payments must be made through our secure payment system. Prices are subject to change without notice. By making a payment, you agree to our pricing and refund policies. All sales are final unless otherwise stated.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Delivery and Service Guarantees</h2>
                <p>
                  We strive to deliver services within the stated timeframe, but delivery times are estimates and not guaranteed. Service quality and results may vary. We offer refills for services that drop within the guarantee period as specified per service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
                <p>
                  All content, trademarks, and intellectual property on our website are owned by MilexBoost. You may not copy, modify, or distribute our content without written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
                <p>
                  MilexBoost shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services. Our total liability shall not exceed the amount paid for the specific service in question.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless MilexBoost from any claims, damages, losses, liabilities, and expenses arising from your use of our services or violation of these terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Termination</h2>
                <p>
                  We reserve the right to terminate or suspend your account and access to our services at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms. We will notify users of significant changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
                <p>
                  If you have any questions about these Terms, please contact us:
                </p>
                <p className="mt-2">
                  Email: legal@milexboost.com<br />
                  <Link href="/contact" className="text-[#1877F2] hover:underline">
                    Contact Form
                  </Link>
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

