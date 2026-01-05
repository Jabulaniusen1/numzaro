import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardContent className="p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Refund Eligibility</h2>
                <p>
                  At MilexBoost, we strive to provide high-quality services. Refunds may be available under the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Service delivery failure due to technical issues on our end</li>
                  <li>Cancellation of an order before service has started</li>
                  <li>Duplicate payments or billing errors</li>
                  <li>Service not delivered within the promised timeframe (subject to terms)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Non-Refundable Services</h2>
                <p>The following are generally not eligible for refunds:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Services that have been completed and delivered</li>
                  <li>Services cancelled after delivery has started</li>
                  <li>Account credits or balance added to your account</li>
                  <li>Services purchased during promotional periods (unless stated otherwise)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Refund Request Process</h2>
                <p>To request a refund:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Contact our support team through the contact form or email</li>
                  <li>Provide your order number and reason for refund request</li>
                  <li>Allow 5-7 business days for review</li>
                  <li>If approved, refunds will be processed within 10-14 business days</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Refund Method</h2>
                <p>
                  Refunds will be issued to the original payment method used for the purchase. Processing times may vary depending on your payment provider:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Credit/Debit Cards: 5-10 business days</li>
                  <li>PayPal: 3-5 business days</li>
                  <li>Bank Transfers: 10-14 business days</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Partial Refunds</h2>
                <p>
                  In some cases, partial refunds may be offered for partially completed services or when only a portion of the service fails to meet expectations. The amount will be determined on a case-by-case basis.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Refill Policy</h2>
                <p>
                  If followers, likes, or engagement drop within the guarantee period, we offer refills instead of refunds. Please check the specific service terms for refill eligibility and timeframes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Dispute Resolution</h2>
                <p>
                  If you are not satisfied with our refund decision, you may request a review by our management team. We are committed to resolving all disputes fairly and promptly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Time Limits</h2>
                <p>
                  Refund requests must be submitted within 30 days of the original purchase date, unless otherwise specified in the service terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact Us</h2>
                <p>
                  For refund requests or questions about this policy, please contact us:
                </p>
                <p className="mt-2">
                  Email: support@milexboost.com<br />
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

