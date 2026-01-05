import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardContent className="p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. What Are Cookies</h2>
                <p>
                  Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Cookies</h2>
                <p>We use cookies for the following purposes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for the website to function properly, including authentication and security</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track campaign performance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Types of Cookies We Use</h2>
                
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Session Cookies</h3>
                  <p>These are temporary cookies that expire when you close your browser. They help maintain your session while browsing our website.</p>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Persistent Cookies</h3>
                  <p>These cookies remain on your device for a set period or until you delete them. They remember your preferences and actions across visits.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Third-Party Cookies</h2>
                <p>
                  We may also use third-party cookies from trusted partners for analytics, advertising, and other services. These cookies are subject to the respective third parties' privacy policies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Managing Cookies</h2>
                <p>You can control and manage cookies in several ways:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Browser settings allow you to refuse or accept cookies</li>
                  <li>You can delete cookies that have already been set</li>
                  <li>You can set your browser to notify you when cookies are being set</li>
                </ul>
                <p className="mt-4">
                  Please note that disabling cookies may affect the functionality of our website and your user experience.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Cookies We Use</h2>
                <p>Below is a list of the main cookies we use:</p>
                <div className="mt-4 space-y-4">
                  <div className="border-l-4 border-[#1877F2] pl-4">
                    <strong>Authentication Cookies</strong>
                    <p className="text-sm text-gray-600 mt-1">Used to keep you logged in and maintain your session</p>
                  </div>
                  <div className="border-l-4 border-[#1877F2] pl-4">
                    <strong>Preference Cookies</strong>
                    <p className="text-sm text-gray-600 mt-1">Remember your language and display preferences</p>
                  </div>
                  <div className="border-l-4 border-[#1877F2] pl-4">
                    <strong>Analytics Cookies</strong>
                    <p className="text-sm text-gray-600 mt-1">Help us improve our website by analyzing usage patterns</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Updates to This Policy</h2>
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Contact Us</h2>
                <p>
                  If you have any questions about our use of cookies, please contact us:
                </p>
                <p className="mt-2">
                  Email: privacy@milexboost.com<br />
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

