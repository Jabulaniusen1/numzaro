import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "Privacy Policy – Numzaro",
  description: "Learn how Numzaro collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "June 16, 2025";
const CONTACT_EMAIL = "support@numzaro.com";
const WEBSITE = "https://numzaro.com";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
          {/* Header */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-10 text-sm">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-10 text-gray-700 dark:text-gray-300 text-[15px] leading-7">

            {/* 1. Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
              <p>
                Numzaro ("<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") operates the Numzaro
                mobile application and the website at <a href={WEBSITE} className="text-[#7C5CFC] hover:underline">{WEBSITE}</a>{" "}
                (collectively, the "<strong>Service</strong>"). This Privacy Policy explains what information we collect,
                how we use it, who we share it with, and the choices you have.
              </p>
              <p className="mt-3">
                By creating an account or using the Service, you agree to the collection and use of information as
                described in this policy. If you do not agree, please do not use the Service.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>

              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Account information:</strong> full name and email address when you register.</li>
                <li><strong>Payment information:</strong> when you fund your wallet, we collect the transaction amount and reference number. Card details are handled directly by Paystack — we never store raw card data.</li>
                <li><strong>Communications:</strong> messages you send to our support team.</li>
                <li><strong>Account deletion requests:</strong> name and email you provide when submitting a deletion request.</li>
              </ul>

              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">2.2 Information We Collect Automatically</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Usage data:</strong> pages visited, features used, order history, and timestamps.</li>
                <li><strong>Device identifiers:</strong> push notification token (Expo Push Token) used to send you alerts about your orders and OTPs.</li>
                <li><strong>IP address and device type:</strong> collected by our infrastructure for security and fraud prevention.</li>
              </ul>

              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">2.3 Information From Our Services</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Virtual numbers:</strong> the phone numbers assigned to you and the OTPs or messages received on them (so we can display them to you in the app).</li>
                <li><strong>eSIM data:</strong> the eSIM plans you purchase, the destination countries, and data package details.</li>
                <li><strong>Social media boost orders:</strong> the platform, service type, and target details you submit for a boost order. We do not access your social media account credentials.</li>
                <li><strong>Wallet transactions:</strong> credits, debits, and balances within your Numzaro wallet.</li>
              </ul>
            </section>

            {/* 3. How We Use Your Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
                <li>Create and manage your account.</li>
                <li>Provide virtual phone numbers and display incoming OTPs and messages.</li>
                <li>Provision and manage eSIM orders.</li>
                <li>Process wallet top-ups and service purchases.</li>
                <li>Fulfill social media boost orders.</li>
                <li>Send push notifications about your orders, received OTPs, and account activity.</li>
                <li>Detect, investigate, and prevent fraudulent transactions and abuse.</li>
                <li>Respond to support requests and process account deletion.</li>
                <li>Comply with applicable laws and regulations.</li>
                <li>Improve the performance and features of the Service.</li>
              </ul>
            </section>

            {/* 4. Third-Party Services */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Third-Party Services We Use</h2>
              <p>We work with the following third-party providers to deliver our Service. Each has its own privacy practices:</p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                      <th className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200 rounded-tl-lg">Provider</th>
                      <th className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">Purpose</th>
                      <th className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200 rounded-tr-lg">Data Shared</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr>
                      <td className="px-4 py-2 font-medium">Supabase</td>
                      <td className="px-4 py-2">Database &amp; authentication</td>
                      <td className="px-4 py-2">Account data, transaction records</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <td className="px-4 py-2 font-medium">Paystack</td>
                      <td className="px-4 py-2">Payment processing (NGN)</td>
                      <td className="px-4 py-2">Email, payment amount &amp; reference</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">TextVerified / SMSPool</td>
                      <td className="px-4 py-2">Virtual phone number provisioning</td>
                      <td className="px-4 py-2">Number assignment requests</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <td className="px-4 py-2 font-medium">eSIM providers</td>
                      <td className="px-4 py-2">eSIM issuance &amp; activation</td>
                      <td className="px-4 py-2">Order details, device eSIM identifier</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Expo (push notifications)</td>
                      <td className="px-4 py-2">Delivering push notifications</td>
                      <td className="px-4 py-2">Device push token, notification content</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                We do not sell your personal information to any third party.
              </p>
            </section>

            {/* 5. Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Data Retention</h2>
              <p>
                We retain your account information and transaction records for as long as your account is active, and
                for up to <strong>90 days</strong> after account deletion (to resolve disputes and comply with legal
                obligations). OTP message content is deleted within <strong>24 hours</strong> of receipt. You can
                request deletion at any time (see Section 7).
              </p>
            </section>

            {/* 6. Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Data Security</h2>
              <p>
                We use industry-standard measures including encrypted connections (HTTPS/TLS), row-level security on
                our database, and token-based authentication to protect your data. No method of electronic
                transmission or storage is 100% secure, but we take the protection of your information seriously and
                continuously work to improve our security practices.
              </p>
            </section>

            {/* 7. Your Rights & Account Deletion */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Your Rights &amp; Account Deletion</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
                <li><strong>Access</strong> the personal data we hold about you.</li>
                <li><strong>Correct</strong> inaccurate information in your profile.</li>
                <li><strong>Delete</strong> your account and associated data.</li>
                <li><strong>Export</strong> your transaction history.</li>
                <li><strong>Opt out</strong> of push notifications at any time via your device settings.</li>
              </ul>
              <p className="mt-3">
                To request account deletion, use the <strong>Delete Account</strong> option in the app (Profile → Delete Account)
                or email us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#7C5CFC] hover:underline">{CONTACT_EMAIL}</a>{" "}
                with the subject <em>"Account Deletion Request"</em>. We will process your request within{" "}
                <strong>7 business days</strong>.
              </p>
            </section>

            {/* 8. Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Children's Privacy</h2>
              <p>
                The Service is not directed to anyone under the age of <strong>18</strong>. We do not knowingly
                collect personal information from children. If you believe a child has provided us with personal
                information, please contact us and we will delete it promptly.
              </p>
            </section>

            {/* 9. International Users */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. International Users</h2>
              <p>
                Numzaro is operated from Nigeria and serves users globally. Your data may be stored on servers
                located outside your country of residence. By using the Service, you consent to the transfer of your
                data to these servers in accordance with this Privacy Policy.
              </p>
            </section>

            {/* 10. Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Cookies</h2>
              <p>
                Our website uses cookies to maintain your login session and remember your preferences (such as dark
                mode). We do not use cookies for advertising or cross-site tracking. You can disable cookies in your
                browser settings, but some features may not function correctly.
              </p>
            </section>

            {/* 11. Changes to This Policy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy periodically. When we make material changes, we will update the
                "Last updated" date at the top of this page and, where appropriate, notify you via email or an
                in-app notification. Continued use of the Service after changes take effect constitutes acceptance of
                the updated policy.
              </p>
            </section>

            {/* 12. Contact */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">12. Contact Us</h2>
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy, contact us at:</p>
              <div className="mt-3 bg-[#f5f3ff] dark:bg-[#1e1a2e] rounded-xl px-5 py-4 text-sm">
                <p><strong>Numzaro Support</strong></p>
                <p>
                  Email:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#7C5CFC] hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p>
                  Website:{" "}
                  <a href={WEBSITE} className="text-[#7C5CFC] hover:underline">
                    {WEBSITE}
                  </a>
                </p>
              </div>
            </section>

          </div>

          {/* Footer nav */}
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#7C5CFC] transition-colors">
              ← Back to Home
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-[#7C5CFC] transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/refund-policy" className="text-gray-500 hover:text-[#7C5CFC] transition-colors">
              Refund Policy
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-[#7C5CFC] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
