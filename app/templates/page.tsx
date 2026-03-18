import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Free Budget Templates | Excel, PDF & In-App — SonaMoney",
  description:
    "12 free budget templates that actually work. Monthly, 50/30/20, biweekly, and zero-based budgets. Excel, Google Sheets, PDF downloads. Plus free expense tracker app.",
  keywords: [
    "budget templates",
    "free budget spreadsheet",
    "monthly budget template",
    "budget worksheet",
    "50/30/20 template",
    "biweekly budget",
  ],
  openGraph: {
    title: "Free Budget Templates | Excel, PDF & Google Sheets",
    description:
      "12 free budget templates that actually work. Download Excel, Google Sheets, or PDF. Plus free expense tracker app.",
    url: "https://sona-money.vercel.app/templates",
    images: ["/og-image.svg"],
  },
}

export default function TemplatesPage() {
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
        name: "Templates",
        item: "https://sona-money.vercel.app/templates",
      },
    ],
  }

  const templates = [
    {
      icon: "📅",
      title: "Monthly Budget Template",
      description: "Classic monthly budget with income, expenses, and savings tracking.",
      formats: ["Excel", "Google Sheets", "PDF"],
      popular: true,
    },
    {
      icon: "📊",
      title: "50/30/20 Budget Worksheet",
      description: "Elizabeth Warren's rule: 50% needs, 30% wants, 20% savings.",
      formats: ["Excel", "Google Sheets"],
      popular: true,
    },
    {
      icon: "🎯",
      title: "Zero-Based Budget",
      description: "Every rupiah/dollar has a job. Perfect for irregular income.",
      formats: ["Excel", "PDF"],
      popular: false,
    },
    {
      icon: "💼",
      title: "Biweekly Budget for Freelancers",
      description: "Designed for gig workers with inconsistent pay schedules.",
      formats: ["Excel", "Google Sheets"],
      popular: true,
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Family Budget Planner",
      description: "Track household expenses, kids' costs, and family savings goals.",
      formats: ["Excel", "PDF"],
      popular: false,
    },
    {
      icon: "🎓",
      title: "Student Budget Template",
      description: "Manage allowance, tuition, food, and entertainment on a tight budget.",
      formats: ["Excel", "Google Sheets"],
      popular: false,
    },
    {
      icon: "🏠",
      title: "Debt Payoff Tracker",
      description: "Snowball or avalanche method to eliminate debt faster.",
      formats: ["Excel", "PDF"],
      popular: true,
    },
    {
      icon: "✈️",
      title: "Vacation Budget Planner",
      description: "Plan trips without overspending. Flights, hotels, food, activities.",
      formats: ["Excel", "PDF"],
      popular: false,
    },
    {
      icon: "💍",
      title: "Wedding Budget Worksheet",
      description: "Track venue, catering, attire, and all wedding expenses.",
      formats: ["Excel", "PDF"],
      popular: false,
    },
    {
      icon: "🏦",
      title: "Emergency Fund Tracker",
      description: "Build your 3-6 month safety net with visual progress.",
      formats: ["Excel", "PDF"],
      popular: false,
    },
    {
      icon: "📈",
      title: "Annual Budget Overview",
      description: "Yearly financial planning with monthly breakdowns.",
      formats: ["Excel", "Google Sheets"],
      popular: false,
    },
    {
      icon: "🌍",
      title: "Multi-Currency Budget",
      description: "Perfect for expats or those with income/expenses in multiple currencies.",
      formats: ["Excel"],
      popular: false,
    },
  ]

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
              12 Free Templates • No Email Required
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] mb-6">
            12 Free Budget Templates{" "}
            <span className="text-[#00B9A7]">That Actually Work</span>
          </h1>
          <p className="text-lg text-[#6B7280] mb-8 max-w-2xl mx-auto">
            Download Excel, Google Sheets, and PDF budget templates. Monthly,
            50/30/20, biweekly, zero-based, and more. Plus free expense tracker
            app.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#00B9A7] text-white font-semibold rounded-full hover:bg-[#0099A0] transition-colors shadow-lg shadow-[#00B9A7]/25"
          >
            Get All Templates + Free App →
          </Link>
        </div>
      </section>

      {/* Section 1: Monthly Budget Template */}
      <section className="px-4 py-16 bg-white fade-in-up">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-12">
            Monthly Budget Template (Excel + Google Sheets)
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-[#F5F7FA] rounded-2xl p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#00B9A7]">
                    <th className="text-left py-2 font-bold text-[#1A1A2E]">
                      Category
                    </th>
                    <th className="text-right py-2 font-bold text-[#1A1A2E]">
                      Budgeted
                    </th>
                    <th className="text-right py-2 font-bold text-[#1A1A2E]">
                      Actual
                    </th>
                    <th className="text-right py-2 font-bold text-[#1A1A2E]">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 text-[#6B7280]">Income</td>
                    <td className="text-right font-medium">$5,000</td>
                    <td className="text-right">$5,200</td>
                    <td className="text-right text-[#00C48C]">+$200</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[#6B7280]">Rent/Mortgage</td>
                    <td className="text-right font-medium">$1,500</td>
                    <td className="text-right">$1,500</td>
                    <td className="text-right">$0</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[#6B7280]">Groceries</td>
                    <td className="text-right font-medium">$600</td>
                    <td className="text-right">$650</td>
                    <td className="text-right text-[#FF5B5B]">-$50</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[#6B7280]">Utilities</td>
                    <td className="text-right font-medium">$200</td>
                    <td className="text-right">$180</td>
                    <td className="text-right text-[#00C48C]">+$20</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[#6B7280]">Savings</td>
                    <td className="text-right font-medium">$1,000</td>
                    <td className="text-right">$1,000</td>
                    <td className="text-right">$0</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-4">
                What&apos;s Included:
              </h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  <span className="text-[#6B7280]">
                    Pre-built categories (customizable)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  <span className="text-[#6B7280]">
                    Automatic variance calculations
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  <span className="text-[#6B7280]">
                    Visual charts and graphs
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  <span className="text-[#6B7280]">
                    Multi-month tracking tabs
                  </span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-[#00B9A7] text-white rounded-lg font-medium hover:bg-[#0099A0] transition-colors">
                  Excel (.xlsx)
                </button>
                <button className="px-4 py-2 bg-white text-[#1A1A2E] border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Google Sheets
                </button>
                <button className="px-4 py-2 bg-white text-[#1A1A2E] border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 50/30/20 Template */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-12">
            50/30/20 Budget Worksheet (PDF Download)
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-[#6B7280] mb-6">
                The 50/30/20 rule is the simplest way to budget. Elizabeth Warren,
                Harvard bankruptcy expert, popularized this method.
              </p>
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-[#00B9A7]/5 rounded-xl border-l-4 border-[#00B9A7]">
                  <span className="text-[#00B9A7] font-bold">50%</span>
                  <span className="text-[#6B7280] ml-2">Needs: Rent, groceries, utilities</span>
                </div>
                <div className="p-4 bg-[#FFB800]/5 rounded-xl border-l-4 border-[#FFB800]">
                  <span className="text-[#FFB800] font-bold">30%</span>
                  <span className="text-[#6B7280] ml-2">Wants: Dining, entertainment, shopping</span>
                </div>
                <div className="p-4 bg-[#00C48C]/5 rounded-xl border-l-4 border-[#00C48C]">
                  <span className="text-[#00C48C] font-bold">20%</span>
                  <span className="text-[#6B7280] ml-2">Savings: Emergency fund, retirement</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-[#00B9A7] text-white rounded-lg font-medium hover:bg-[#0099A0] transition-colors">
                  Excel (.xlsx)
                </button>
                <button className="px-4 py-2 bg-white text-[#1A1A2E] border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Google Sheets
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h4 className="font-bold text-[#1A1A2E] mb-4">Example: $5,000/month income</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#6B7280]">Needs (50%)</span>
                    <span className="font-medium">$2,500</span>
                  </div>
                  <div className="h-2 bg-[#00B9A7] rounded-full" style={{ width: "50%" }} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#6B7280]">Wants (30%)</span>
                    <span className="font-medium">$1,500</span>
                  </div>
                  <div className="h-2 bg-[#FFB800] rounded-full" style={{ width: "30%" }} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#6B7280]">Savings (20%)</span>
                    <span className="font-medium">$1,000</span>
                  </div>
                  <div className="h-2 bg-[#00C48C] rounded-full" style={{ width: "20%" }} />
                </div>
              </div>
              <Link
                href="/budget-calculator"
                className="inline-flex items-center mt-6 text-[#00B9A7] font-semibold hover:underline"
              >
                Try our interactive calculator →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Zero-Based Budget */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-8">
            Zero-Based Budget for Irregular Income
          </h2>
          <div className="bg-[#F5F7FA] rounded-2xl p-8">
            <p className="text-lg text-[#6B7280] mb-6 text-center">
              Perfect for freelancers, gig workers, and commission-based earners.
              Every dollar/rupiah gets assigned before the month begins.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#00B9A7]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-[#00B9A7]">1</span>
                </div>
                <h4 className="font-bold text-[#1A1A2E] mb-2">List All Income</h4>
                <p className="text-sm text-[#6B7280]">
                  Expected + buffer for irregular sources
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#00B9A7]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-[#00B9A7]">2</span>
                </div>
                <h4 className="font-bold text-[#1A1A2E] mb-2">Assign Every Dollar</h4>
                <p className="text-sm text-[#6B7280]">
                  Expenses + savings + buffer = income
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#00B9A7]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-[#00B9A7]">3</span>
                </div>
                <h4 className="font-bold text-[#1A1A2E] mb-2">Adjust as Needed</h4>
                <p className="text-sm text-[#6B7280]">
                  Roll with income changes month to month
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Biweekly Budget */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-8">
            Biweekly Budget for Freelancers & Gig Workers
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#FFB800]/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                Designed for Irregular Pay
              </h3>
              <p className="text-[#6B7280]">
                Get paid every 2 weeks? This template aligns your bills and
                spending with your actual income schedule.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#00C48C]/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                Bill Calendar Sync
              </h3>
              <p className="text-[#6B7280]">
                Map which paycheck covers which bills. Never miss a due date
                even with variable income.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: All Templates Grid + CTA */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-12">
            Get All Templates + Free Expense Tracker App
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 stagger-children">
            {templates.map((template, index) => (
              <div
                key={index}
                className={`p-4 bg-[#F5F7FA] rounded-xl hover-lift stagger-${Math.min(index + 1, 6)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{template.icon}</span>
                  {template.popular && (
                    <span className="px-2 py-1 bg-[#00B9A7] text-white text-xs font-medium rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-[#1A1A2E] mb-1 text-sm">
                  {template.title}
                </h4>
                <p className="text-xs text-[#6B7280] mb-2">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  {template.formats.map((format) => (
                    <span
                      key={format}
                      className="px-2 py-0.5 bg-white text-[#6B7280] text-xs rounded border border-gray-200"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center bg-[#00B9A7] rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Templates Are Great. Automation Is Better.
            </h3>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Why manually track when SonaMoney can categorize expenses
              automatically? Start with templates, upgrade to automation.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#00B9A7] font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg btn-press"
            >
              Create Free Account →
            </Link>
            <p className="text-sm text-white/60 mt-4">
              No credit card required. Upgrade anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Internal Links */}
      <section className="px-4 py-12 bg-[#F5F7FA] border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-[#6B7280] text-center">
            Related:{" "}
            <Link
              href="/features/expenses"
              className="text-[#00B9A7] hover:underline"
            >
              monthly expense tracker
            </Link>{" "}
            •{" "}
            <Link href="/features/goals" className="text-[#00B9A7] hover:underline">
              budget goals
            </Link>{" "}
            •{" "}
            <Link href="/signup" className="text-[#00B9A7] hover:underline">
              sign up free
            </Link>
          </p>
        </div>
      </section>
    </div>
    </>
  )
}
