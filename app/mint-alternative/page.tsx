import type { Metadata } from "next"
import Link from "next/link"
import { getSiteUrl } from "@/lib/utils/url"
import { Lock, Zap, Shield, Key, Smartphone, CircleX } from "lucide-react"

export const metadata: Metadata = {
  title: "The Best Mint Alternative in 2026 | Free Budget App — SonaMoney",
  description:
    "Mint shut down? SonaMoney is the best free Mint alternative. " +
    "Import your data in 2 minutes. No ads, no fees, bank-level security. " +
    "Join 50,000+ users who switched from Mint.",
  keywords: [
    "mint alternative",
    "mint replacement",
    "free budget app",
    "expense tracker",
    "mint shut down",
    "best budget app 2026",
    "mint successor",
    "switch from mint",
  ],
  alternates: {
    canonical: `${getSiteUrl()}/mint-alternative`,
  },
  openGraph: {
    title: "The Best Mint Alternative in 2026 | Free Budget App",
    description:
      "Mint shut down? Switch to SonaMoney. Free forever, no ads, import your Mint data in 2 minutes.",
    url: `${getSiteUrl()}/mint-alternative`,
    type: "website",
    images: [
      {
        url: `${getSiteUrl()}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Best Mint Alternative 2026 - SonaMoney",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Best Mint Alternative in 2026 | Free Budget App",
    description: "Mint shut down? Switch to SonaMoney. Free forever, no ads, import your Mint data in 2 minutes.",
    images: [`${getSiteUrl()}/og-image.png`],
  },
}

export default function MintAlternativePage() {
  const baseUrl = getSiteUrl()
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Mint Alternative",
        item: `${baseUrl}/mint-alternative`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd),
        }}
      />
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Hero Section */}
      <section className="px-4 py-16 lg:py-24 fade-in-up">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00B9A7]/10 rounded-full mb-6 gentle-pulse">
            <span className="w-2 h-2 bg-[#00B9A7] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-[#00B9A7]">
              200,000+ Mint Users Have Switched
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold text-[#1A1A2E] mb-6">
            Mint Shut Down?{" "}
            <span className="text-[#00B9A7]">Here&apos;s Your Free Replacement</span>
          </h1>
          <p className="text-lg lg:text-xl text-[#6B7280] mb-8 max-w-2xl mx-auto">
            SonaMoney is the best Mint alternative in 2026. Same features you loved,
            zero ads, forever free. Import your data in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#00B9A7] text-white font-semibold rounded-full hover:bg-[#0099A0] transition-colors shadow-lg shadow-[#00B9A7]/25"
            >
              Get Started Free →
            </Link>
            <Link
              href="/features/expense-tracking"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#1A1A2E] font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Section 1: Why Users Switched */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] text-center mb-12">
            Why 200,000+ Mint Users Switched to SonaMoney
          </h2>
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            <div className="p-6 rounded-2xl bg-[#F5F7FA] hover-lift stagger-1">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mb-4">
                <CircleX className="w-6 h-6 text-[#00B9A7]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">Zero Ads. Forever.</h3>
              <p className="text-[#6B7280]">
                Unlike Mint&apos;s ad-supported model, SonaMoney has no ads. Your data
                isn&apos;t sold to advertisers.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F5F7FA] hover-lift stagger-2">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-[#00B9A7]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">Bank-Level Security</h3>
              <p className="text-[#6B7280]">
                256-bit encryption, SOC 2 Type II compliant infrastructure. Your
                financial data stays private.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F5F7FA] hover-lift stagger-3">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[#00B9A7]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">2-Minute Setup</h3>
              <p className="text-[#6B7280]">
                Import your Mint CSV export and pick up exactly where you left off.
                No learning curve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Import Data */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] mb-6">
                Import Your Mint Data in 2 Minutes
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </span>
                  <span className="text-[#6B7280]">
                    Export your transactions from Mint (CSV format)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </span>
                  <span className="text-[#6B7280]">
                    Upload to SonaMoney — we auto-categorize everything
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </span>
                  <span className="text-[#6B7280]">
                    Your budgets, categories, and history — all preserved
                  </span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center mt-8 px-6 py-3 bg-[#00B9A7] text-white font-semibold rounded-full hover:bg-[#0099A0] transition-colors"
              >
                Start Your Import →
              </Link>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl">
                  <span className="text-[#6B7280]">Transactions imported</span>
                  <span className="font-bold text-[#1A1A2E]">2,847</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl">
                  <span className="text-[#6B7280]">Categories matched</span>
                  <span className="font-bold text-[#1A1A2E]">18/18</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl">
                  <span className="text-[#6B7280]">Budgets recreated</span>
                  <span className="font-bold text-[#00B9A7]">✓ Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Features Comparison */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] text-center mb-12">
            All the Features You Loved — None of the Ads
          </h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-[#F5F7FA]">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-[#1A1A2E]">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-[#6B7280]">
                    Mint
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-[#00B9A7]">
                    SonaMoney
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4 text-[#1A1A2E]">Expense Tracking</td>
                  <td className="px-6 py-4 text-center text-[#6B7280]">✓</td>
                  <td className="px-6 py-4 text-center text-[#00B9A7] font-bold">
                    ✓
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-[#1A1A2E]">Budget Creation</td>
                  <td className="px-6 py-4 text-center text-[#6B7280]">✓</td>
                  <td className="px-6 py-4 text-center text-[#00B9A7] font-bold">
                    ✓ Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-[#1A1A2E]">Bill Reminders</td>
                  <td className="px-6 py-4 text-center text-[#6B7280]">✓</td>
                  <td className="px-6 py-4 text-center text-[#00B9A7] font-bold">
                    ✓ Smart Alerts
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-[#1A1A2E]">Credit Score</td>
                  <td className="px-6 py-4 text-center text-[#6B7280]">✓</td>
                  <td className="px-6 py-4 text-center text-[#9CA3AF]">—</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-[#1A1A2E]">Advertisements</td>
                  <td className="px-6 py-4 text-center text-[#FF5B5B]">Heavy</td>
                  <td className="px-6 py-4 text-center text-[#00B9A7] font-bold">
                    None
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-[#1A1A2E]">Data Sold to 3rd Parties</td>
                  <td className="px-6 py-4 text-center text-[#FF5B5B]">Yes</td>
                  <td className="px-6 py-4 text-center text-[#00B9A7] font-bold">
                    Never
                  </td>
                </tr>
                <tr className="bg-[#E6F7F6]">
                  <td className="px-6 py-4 font-bold text-[#1A1A2E]">Price</td>
                  <td className="px-6 py-4 text-center text-[#FF5B5B] font-bold">
                    Shut Down
                  </td>
                  <td className="px-6 py-4 text-center text-[#00B9A7] font-bold">
                    Free Forever
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-[#6B7280] mt-4">
            Credit score tracking coming Q2 2025. {" "}
            <Link
              href="/features"
              className="text-[#00B9A7] hover:underline"
            >
              See full feature comparison
            </Link>
          </p>
        </div>
      </section>

      {/* Section 4: Security */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] mb-6">
            Bank-Level Security Without the Bank Fees
          </h2>
          <p className="text-lg text-[#6B7280] mb-8 max-w-2xl mx-auto">
            We use the same encryption standards as your bank. 256-bit SSL,
            read-only access, and we never store your login credentials.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-[#6B7280] inline-flex items-center gap-1">
              <Lock className="w-4 h-4" /> 256-bit Encryption
            </div>
            <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-[#6B7280] inline-flex items-center gap-1">
              <Shield className="w-4 h-4" /> SOC 2 Type II
            </div>
            <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-[#6B7280] inline-flex items-center gap-1">
              <Key className="w-4 h-4" /> Read-Only Access
            </div>
            <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-[#6B7280] inline-flex items-center gap-1">
              <Smartphone className="w-4 h-4" /> Biometric Login
            </div>
          </div>
          <Link
            href="/security"
            className="inline-flex items-center text-[#00B9A7] font-semibold hover:underline"
          >
            Learn about our security →
          </Link>
        </div>
      </section>

      {/* Section 5: Social Proof / CTA */}
      <section className="px-4 py-16 bg-[#00B9A7]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Join 50,000+ Users Tracking Their Money Free
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Start tracking your expenses, creating budgets, and reaching your
            financial goals today. No credit card required.
          </p>
          <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#00B9A7] font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg btn-press"
            >
              Create Free Account →
            </Link>
          <p className="text-sm text-white/60 mt-4">
            Free forever. Upgrade to Premium for advanced analytics.
          </p>
        </div>
      </section>

      {/* Internal Links Section */}
      <section className="px-4 py-12 bg-[#F5F7FA] border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-[#6B7280] text-center">
            Related:{" "}
            <Link
              href="/features/expense-tracking"
              className="text-[#00B9A7] hover:underline"
            >
              expense tracking features
            </Link>{" "}
            •{" "}
            <Link href="/templates" className="text-[#00B9A7] hover:underline">
              budget templates
            </Link>{" "}
            •{" "}
            <Link href="/signup" className="text-[#00B9A7] hover:underline">
              signup free
            </Link>
          </p>
        </div>
      </section>
    </div>
    </>
  )
}
