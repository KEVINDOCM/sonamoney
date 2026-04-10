import type { Metadata } from "next"
import Link from "next/link"
import { getSiteUrl } from "@/lib/utils/url"
import { Key, BarChart3, FileText, FileSpreadsheet, Plug } from "lucide-react"

export const metadata: Metadata = {
  title: "Manual Expense Tracker App | No Bank Connection Required — SonaMoney",
  description:
    "Track spending without linking your bank account. Manual expense entry, privacy-focused, " +
    "data export anytime. No bank fees, no overdraft risk, no privacy concerns. " +
    "Free forever. Works offline.",
  keywords: [
    "manual expense tracker",
    "expense tracker without bank",
    "privacy focused budget app",
    "no bank connection budget",
    "offline expense tracker",
    "manual budget app",
    "secure finance app",
    "bank-free tracker",
  ],
  alternates: {
    canonical: `${getSiteUrl()}/manual-tracker`,
  },
  openGraph: {
    title: "Manual Expense Tracker | No Bank Connection Required",
    description:
      "Track spending without linking your bank. Full privacy, manual entry, data export. Free forever.",
    url: `${getSiteUrl()}/manual-tracker`,
    type: "website",
    images: [
      {
        url: `${getSiteUrl()}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Manual Expense Tracker - No Bank Required",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manual Expense Tracker | No Bank Connection Required",
    description: "Track spending without linking your bank. Full privacy, manual entry, data export. Free forever.",
    images: [`${getSiteUrl()}/og-image.png`],
  },
}

export default function ManualTrackerPage() {
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
        name: "Manual Tracker",
        item: `${baseUrl}/manual-tracker`,
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
      <section className="px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00B9A7]/10 rounded-full mb-6">
            <span className="text-sm font-medium text-[#00B9A7]">
              🔒 Privacy-First Design
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] mb-6">
            Track Spending Without{" "}
            <span className="text-[#00B9A7]">Linking Your Bank Account</span>
          </h1>
          <p className="text-lg lg:text-xl text-[#6B7280] mb-8 max-w-2xl mx-auto">
            40% of users prefer manual entry. No bank fees, no overdraft risk,
            no privacy concerns. Full control over your financial data. Free forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#00B9A7] text-white font-semibold rounded-full hover:bg-[#0099A0] transition-colors shadow-lg shadow-[#00B9A7]/25"
            >
              Start Tracking Manually →
            </Link>
            <Link
              href="/features/bank-sync"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#1A1A2E] font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Optional Bank Sync Info
            </Link>
          </div>
        </div>
      </section>

      {/* Section 1: Why Manual */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] text-center mb-12">
            Why 40% of Users Prefer Manual Entry
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#F5F7FA]">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mb-4">
                <Key className="w-6 h-6 text-[#00B9A7]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                Maximum Privacy
              </h3>
              <p className="text-[#6B7280]">
                Your bank login never leaves your device. No third-party access
                to your accounts. Your data stays yours.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F5F7FA]">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                Spending Awareness
              </h3>
              <p className="text-[#6B7280]">
                Manually entering each expense makes you conscious of every
                purchase. Studies show manual trackers save 15% more.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F5F7FA]">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🏛️</span>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                Cash &amp; Side Hustles
              </h3>
              <p className="text-[#6B7280]">
                Bank sync misses cash transactions, tips, and side income.
                Manual entry captures everything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How to Track */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] text-center mb-12">
            How to Track Every Expense in 3 Taps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#00B9A7] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Tap +</h3>
              <p className="text-[#6B7280]">
                Open app, tap the big + button. Takes 1 second.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#00B9A7] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
                Enter Amount
              </h3>
              <p className="text-[#6B7280]">
                Type the amount. Smart suggestions appear based on location
                and time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#00B9A7] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
                Pick Category
              </h3>
              <p className="text-[#6B7280]">
                Auto-categorized or choose from your custom categories. Done.
              </p>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-6 text-center">
              Demo: Adding a Coffee Purchase
            </h3>
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-4 p-3 bg-[#F5F7FA] rounded-xl">
                <div className="w-10 h-10 bg-[#00B9A7] rounded-full flex items-center justify-center text-white font-bold">
                  +
                </div>
                <div>
                  <p className="font-medium text-[#1A1A2E]">Tap add button</p>
                  <p className="text-xs text-[#6B7280]">2:34 PM • Detected location: Starbucks</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-[#F5F7FA] rounded-xl">
                <div className="w-10 h-10 bg-[#FFB800] rounded-full flex items-center justify-center text-white font-bold">
                  $7
                </div>
                <div>
                  <p className="font-medium text-[#1A1A2E]">Enter $7.50</p>
                  <p className="text-xs text-[#6B7280]">Suggestion: Coffee &amp; snacks</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-[#E6F7F6] rounded-xl border border-[#00B9A7]/20">
                <div className="w-10 h-10 bg-[#00C48C] rounded-full flex items-center justify-center text-white text-xl">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-[#00B9A7]">Saved!</p>
                  <p className="text-xs text-[#6B7280]">
                    Categorized: Food &amp; Dining • Wants (30%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Data Export */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-8">
            Export Your Data Anytime — You Own It
          </h2>
          <p className="text-lg text-[#6B7280] text-center mb-8 max-w-2xl mx-auto">
            No vendor lock-in. Export your complete financial history whenever
            you want. CSV, Excel, or PDF formats.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-[#00B9A7]" />
              <span className="font-medium text-[#1A1A2E] block">CSV Export</span>
              <span className="text-xs text-[#6B7280]">Universal format</span>
            </div>
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <FileSpreadsheet className="w-6 h-6 mx-auto mb-2 text-[#00B9A7]" />
              <span className="font-medium text-[#1A1A2E] block">Excel (.xlsx)</span>
              <span className="text-xs text-[#6B7280]">With formulas</span>
            </div>
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <FileText className="w-6 h-6 mx-auto mb-2 text-[#00B9A7]" />
              <span className="font-medium text-[#1A1A2E] block">PDF Reports</span>
              <span className="text-xs text-[#6B7280]">Share or print</span>
            </div>
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <Plug className="w-6 h-6 mx-auto mb-2 text-[#00B9A7]" />
              <span className="font-medium text-[#1A1A2E] block">API Access</span>
              <span className="text-xs text-[#6B7280]">For power users</span>
            </div>
          </div>

          <Link
            href="/features/export"
            className="block text-center mt-8 text-[#00B9A7] font-semibold hover:underline"
          >
            Learn more about data export options →
          </Link>
        </div>
      </section>

      {/* Section 4: No Bank Benefits */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-12">
            No Bank Fees, No Overdraft Risk, No Privacy Concerns
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#00C48C]/10 rounded-lg flex items-center justify-center text-[#00C48C]">
                  ✓
                </span>
                No Bank Fees
              </h3>
              <p className="text-[#6B7280]">
                Apps with bank sync often charge $5-15/month. SonaMoney manual
                tracking is free forever. No hidden fees.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#00C48C]/10 rounded-lg flex items-center justify-center text-[#00C48C]">
                  ✓
                </span>
                No Overdraft Risk
              </h3>
              <p className="text-[#6B7280]">
                Bank-connected apps can accidentally trigger overdrafts with
                their sync attempts. Manual entry is completely safe.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#00C48C]/10 rounded-lg flex items-center justify-center text-[#00C48C]">
                  ✓
                </span>
                No Data Sharing
              </h3>
              <p className="text-[#6B7280]">
                Bank-connected apps often sell transaction data to advertisers.
                With manual entry, your spending habits stay private.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#00C48C]/10 rounded-lg flex items-center justify-center text-[#00C48C]">
                  ✓
                </span>
                Works Everywhere
              </h3>
              <p className="text-[#6B7280]">
                International banks, credit unions, cash economies — manual
                tracking works with any financial system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Upgrade Path */}
      <section className="px-4 py-16 bg-[#00B9A7]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Start Tracking Manually — Upgrade to Auto Later
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Begin with full manual control. If you ever want bank sync, upgrade
            to Premium. You&apos;re always in control.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#00B9A7] font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            Create Free Account →
          </Link>
          <p className="text-sm text-white/60 mt-4">
            Manual tracking free forever. Bank sync available in Premium ($4.99/mo)
          </p>
        </div>
      </section>

      {/* Internal Links */}
      <section className="px-4 py-12 bg-[#F5F7FA] border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-[#6B7280] text-center">
            Related:{" "}
            <Link
              href="/features/bank-sync"
              className="text-[#00B9A7] hover:underline"
            >
              bank sync optional
            </Link>{" "}
            •{" "}
            <Link
              href="/features/export"
              className="text-[#00B9A7] hover:underline"
            >
              data export
            </Link>{" "}
            •{" "}
            <Link href="/signup" className="text-[#00B9A7] hover:underline">
              download free app
            </Link>
          </p>
        </div>
      </section>
    </div>
    </>
  )
}
