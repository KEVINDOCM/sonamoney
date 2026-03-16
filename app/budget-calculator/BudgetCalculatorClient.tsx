"use client"

import Link from "next/link"
import { useState } from "react"

export default function BudgetCalculatorClient() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://sona-money.vercel.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Budget Calculator",
        item: "https://sona-money.vercel.app/budget-calculator",
      },
    ],
  }

  const [income, setIncome] = useState<string>("")
  const [currency, setCurrency] = useState<string>("USD")

  const monthlyIncome = parseFloat(income) || 0
  const needs = monthlyIncome * 0.5
  const wants = monthlyIncome * 0.3
  const savings = monthlyIncome * 0.2

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount)
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
      <section className="px-4 py-16 lg:py-20 fade-in-up">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00B9A7]/10 rounded-full mb-6">
            <span className="text-sm font-medium text-[#00B9A7]">
              Based on Elizabeth Warren&apos;s Rule
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] mb-6">
            Calculate Your Perfect Budget{" "}
            <span className="text-[#00B9A7]">in 30 Seconds</span>
          </h1>
          <p className="text-lg text-[#6B7280] mb-8 max-w-2xl mx-auto">
            The 50/30/20 rule is the simplest way to budget: 50% for needs,
            30% for wants, 20% for savings. See your numbers instantly.
          </p>
        </div>
      </section>

      {/* Section 1: What Is the Rule */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-12">
            What Is the 50/30/20 Rule?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            <div className="text-center p-6 hover-lift stagger-1">
              <div className="w-20 h-20 bg-[#00B9A7]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-[#00B9A7]">50%</span>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Needs</h3>
              <p className="text-[#6B7280]">
                Rent, groceries, utilities, minimum debt payments, transportation
              </p>
            </div>
            <div className="text-center p-6 hover-lift stagger-2">
              <div className="w-20 h-20 bg-[#FFB800]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-[#FFB800]">30%</span>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Wants</h3>
              <p className="text-[#6B7280]">
                Dining out, entertainment, hobbies, subscriptions, shopping
              </p>
            </div>
            <div className="text-center p-6 hover-lift stagger-3">
              <div className="w-20 h-20 bg-[#00C48C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-[#00C48C]">20%</span>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Savings</h3>
              <p className="text-[#6B7280]">
                Emergency fund, retirement, extra debt payments, investments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Calculator */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-12">
            Enter Your Income — See Your Budget
          </h2>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            {/* Input Section */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1">
                <label className="text-sm font-semibold text-[#1A1A2E] uppercase tracking-wide block mb-2">
                  Monthly Income
                </label>
                <input
                  type="number"
                  placeholder="5000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full h-12 border border-gray-200 rounded-xl px-4 text-lg text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7]"
                />
              </div>
              <div className="sm:w-32">
                <label className="text-sm font-semibold text-[#1A1A2E] uppercase tracking-wide block mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  aria-label="Select currency"
                  className="w-full h-12 border border-gray-200 rounded-xl px-4 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="IDR">IDR (Rp)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Results */}
            {monthlyIncome > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-[#00B9A7]/5 rounded-xl border border-[#00B9A7]/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-[#00B9A7]">
                        50% Needs
                      </span>
                      <p className="text-xs text-[#6B7280] mt-1">
                        Rent, utilities, groceries, minimum payments
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-[#00B9A7]">
                      {formatCurrency(needs)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#FFB800]/5 rounded-xl border border-[#FFB800]/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-[#FFB800]">
                        30% Wants
                      </span>
                      <p className="text-xs text-[#6B7280] mt-1">
                        Dining, entertainment, subscriptions, shopping
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-[#FFB800]">
                      {formatCurrency(wants)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#00C48C]/5 rounded-xl border border-[#00C48C]/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-[#00C48C]">
                        20% Savings
                      </span>
                      <p className="text-xs text-[#6B7280] mt-1">
                        Emergency fund, retirement, extra debt payments
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-[#00C48C]">
                      {formatCurrency(savings)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#1A1A2E]">
                      Total Monthly Budget
                    </span>
                    <span className="text-2xl font-bold text-[#1A1A2E]">
                      {formatCurrency(monthlyIncome)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {monthlyIncome === 0 && (
              <div className="text-center py-8 text-[#6B7280]">
                <p>Enter your monthly income above to see your budget breakdown</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Download Template */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#1A1A2E] mb-6">
            Download Your Personalized Budget Template
          </h2>
          <p className="text-lg text-[#6B7280] mb-8 max-w-2xl mx-auto">
            Get a pre-filled Google Sheets or Excel template with your 50/30/20
            numbers. Track against your actual spending with SonaMoney.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="inline-flex items-center justify-center px-6 py-3 bg-[#00B9A7] text-white font-semibold rounded-full hover:bg-[#0099A0] transition-colors">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              Google Sheets Template
            </button>
            <button className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#1A1A2E] font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              Excel Template
            </button>
          </div>

          <div className="bg-[#F5F7FA] rounded-2xl p-6 inline-block">
            <p className="text-sm text-[#6B7280] mb-2">
              Or track automatically with SonaMoney
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center text-[#00B9A7] font-semibold hover:underline"
            >
              Create free account →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 4: Indonesian Localization */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-8">
            Why This Method Works for Indonesians
          </h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-3">
                  🇮🇩 IDR-Optimized Calculations
                </h3>
                <p className="text-[#6B7280]">
                  Built-in support for Indonesian Rupiah with real-time USD → IDR
                  conversion rates. Track your THR (holiday bonus) and 13th salary
                  separately.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-3">
                  🏠 Local Expense Categories
                </h3>
                <p className="text-[#6B7280]">
                  Pre-loaded categories for kos/kost rent, GoJek/Grab, Indomaret
                  spending, and warung expenses. No need to create custom
                  categories.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-3">
                  📱 Works Offline
                </h3>
                <p className="text-[#6B7280]">
                  Track expenses even without internet. Sync when you&apos;re back
                  online — perfect for areas with spotty connectivity.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-3">
                  💬 Bilingual Support
                </h3>
                <p className="text-[#6B7280]">
                  Switch between English and Indonesian instantly. All budget
                  categories and reports available in both languages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: CTA */}
      <section className="px-4 py-16 bg-[#00B9A7]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Start Tracking Against Your New Budget
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Connect SonaMoney to automatically categorize your spending and see
            how you&apos;re tracking against your 50/30/20 targets.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#00B9A7] font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Tracking Free →
          </Link>
        </div>
      </section>

      {/* Internal Links */}
      <section className="px-4 py-12 bg-[#F5F7FA] border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-[#6B7280] text-center">
            Related:{" "}
            <Link
              href="/features/budgets"
              className="text-[#00B9A7] hover:underline"
            >
              budget tracking
            </Link>{" "}
            •{" "}
            <Link
              href="/features/categories"
              className="text-[#00B9A7] hover:underline"
            >
              expense categories
            </Link>{" "}
            •{" "}
            <Link href="/signup" className="text-[#00B9A7] hover:underline">
              create free account
            </Link>
          </p>
        </div>
      </section>
    </div>
    </>
  )
}
