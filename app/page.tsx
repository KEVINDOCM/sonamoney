"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ChevronDown,
  ArrowRight,
  BarChart2,
  Target,
  Shield,
  Smartphone,
  TrendingUp,
  Wallet,
  Bell,
  Globe,
  CheckCircle,
  Menu,
  X,
} from "lucide-react"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const features = [
    {
      icon: Wallet,
      color: "bg-[#E6F7F6]",
      iconColor: "text-[#00B9A7]",
      title: "Track Everything",
      desc: "Income, expenses, and transfers in one place. Never lose track of where your money goes.",
    },
    {
      icon: Target,
      color: "bg-[#FFF8E6]",
      iconColor: "text-[#FFB800]",
      title: "Smart Budgets",
      desc: "Set spending limits per category. Get warned before you overspend.",
    },
    {
      icon: BarChart2,
      color: "bg-[#F0EFFE]",
      iconColor: "text-[#6366F1]",
      title: "Visual Analytics",
      desc: "Beautiful charts that show your spending trends, top categories, and monthly comparisons.",
    },
    {
      icon: TrendingUp,
      color: "bg-[#E6FAF4]",
      iconColor: "text-[#00C48C]",
      title: "Spending Insights",
      desc: "AI-powered insights that tell you exactly where to cut costs and how to save more.",
    },
    {
      icon: Globe,
      color: "bg-[#FFF0F0]",
      iconColor: "text-[#FF5B5B]",
      title: "Multi Currency",
      desc: "Track money in any currency with real-time exchange rates. Perfect for global users.",
    },
    {
      icon: Shield,
      color: "bg-[#E6F7F6]",
      iconColor: "text-[#00B9A7]",
      title: "Secure & Private",
      desc: "Your data is encrypted and never shared. You own your financial data, always.",
    },
  ]

  const faqs = [
    {
      q: "Is SonaMoney free to use?",
      a: "Yes, SonaMoney is completely free. No hidden fees, no premium tiers — all features are available to everyone.",
    },
    {
      q: "Is my financial data secure?",
      a: "Absolutely. We use Supabase with row-level security, meaning only you can access your data. It is never sold or shared.",
    },
    {
      q: "Can I use it on my phone?",
      a: "Yes. SonaMoney is fully responsive and works perfectly on mobile browsers. A PWA install option is also available.",
    },
    {
      q: "Does it support multiple currencies?",
      a: "Yes. You can track transactions in any currency with automatic conversion using real-time exchange rates.",
    },
    {
      q: "Can I export my data?",
      a: "Yes. You can export your transactions as PDF or Excel at any time from the transactions page.",
    },
    {
      q: "Do I need to install anything?",
      a: "No installation needed. Just open the web app, create an account, and start tracking your finances instantly.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SonaMoney",
    url: "https://sonamoney.vercel.app",
    description:
      "Free personal finance tracker. Track income, " +
      "expenses, budgets, and insights with analytics " +
      "and AI assistant.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, iOS, Android",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free forever",
    },
    featureList: [
      "Expense tracking",
      "Budget management",
      "Analytics & charts",
      "Multi-currency support",
      "AI financial assistant",
      "PDF & Excel export",
      "PWA mobile support",
    ],
    inLanguage: ["en", "id"],
    isAccessibleForFree: true,
  }

  const faqPageLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageLd),
        }}
      />
      <div className="min-h-screen bg-white text-[#1A1A2E] pb-16 md:pb-0">

      {/* ================================
          NAVBAR
          ================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#00B9A7] flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-[#1A1A2E] text-base">SonaMoney</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-[#6B7280] hover:text-[#00B9A7] transition-colors duration-200 font-medium"
            >
              Features
            </a>
            <a
              href="#faq"
              className="text-sm text-[#6B7280] hover:text-[#00B9A7] transition-colors duration-200 font-medium"
            >
              FAQ
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#6B7280] hover:text-[#00B9A7] transition-colors duration-200 px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-[#00B9A7] text-white rounded-full px-5 py-2 hover:bg-[#0099A0] active:scale-95 transition-all duration-200 shadow-sm"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#6B7280] hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#6B7280] py-2 hover:text-[#00B9A7]"
            >
              Features
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#6B7280] py-2 hover:text-[#00B9A7]"
            >
              FAQ
            </a>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="/login"
                className="text-center text-sm font-semibold text-[#6B7280] py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-center text-sm font-semibold bg-[#00B9A7] text-white py-2.5 rounded-xl hover:bg-[#0099A0] transition-colors"
              >
                Get started free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ================================
          HERO SECTION
          ================================ */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 px-4 lg:px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div className="flex flex-col items-start text-left lg:items-start lg:text-left space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#E6F7F6] rounded-full px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#00B9A7] animate-pulse"/>
              <span className="text-xs font-semibold text-[#00B9A7]">Personal finance, made simple</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] leading-tight tracking-tight">
              Take control of <span className="text-[#00B9A7] relative">your money</span> today.
            </h1>

            {/* Description */}
            <p className="text-base text-[#6B7280] max-w-md lg:mx-0 leading-relaxed">
              Track income, expenses, budgets, and insights in one clean dashboard. No spreadsheets, no guessing — just a clear view of your money.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-none">
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 h-12 px-8 bg-[#00B9A7] text-white rounded-full font-semibold text-sm hover:bg-[#0099A0] active:scale-95 transition-all duration-200 shadow-md shadow-[#00B9A7]/25"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 h-12 px-8 border-2 border-gray-200 text-[#1A1A2E] rounded-full font-semibold text-sm hover:border-[#00B9A7] hover:text-[#00B9A7] active:scale-95 transition-all duration-200"
              >
                Log in
              </Link>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Takes 60 seconds · No credit card · Cancel anytime
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-start gap-4 pt-2">
              {[
                { icon: CheckCircle, text: "Free forever" },
                { icon: Shield, text: "Secure & private" },
                { icon: Smartphone, text: "Works on mobile" },
              ].map((badge) => (
                <div key={badge.text} className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
                  <badge.icon className="w-3.5 h-3.5 text-[#00B9A7]" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard Preview Card */}
          <div className="hidden lg:block relative">
            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-64 h-64 rounded-full bg-[#00B9A7]/10 blur-3xl"/>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-[#6366F1]/10 blur-3xl"/>

            {/* Main card */}
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-gray-200/80 border border-gray-100 p-6 space-y-4">
              {/* Card header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B7280] font-medium">Total Balance</p>
                  <p className="text-2xl font-extrabold text-[#1A1A2E]">Rp 12.450.000</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#E6F7F6] flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#00B9A7]"/>
                </div>
              </div>

              {/* Income/Expense row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#E6FAF4] rounded-2xl p-3">
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wide">Income</p>
                  <p className="text-sm font-extrabold text-[#00C48C] mt-0.5">+Rp 8.500.000</p>
                </div>
                <div className="bg-[#FFF0F0] rounded-2xl p-3">
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wide">Expenses</p>
                  <p className="text-sm font-extrabold text-[#FF5B5B] mt-0.5">-Rp 4.200.000</p>
                </div>
              </div>

              {/* Budget bars */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-[#1A1A2E]">Budget Overview</p>
                {[
                  { name: "Food", pct: 72, color: "bg-[#FFB800]" },
                  { name: "Transport", pct: 35, color: "bg-[#00C48C]" },
                  { name: "Shopping", pct: 91, color: "bg-[#FF5B5B]" },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-[#6B7280]">{item.name}</span>
                      <span className="text-xs font-bold text-[#1A1A2E]">{item.pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent transactions */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#1A1A2E]">Recent</p>
                {[
                  { icon: "🛒", name: "Groceries", amount: "-Rp 250.000", color: "text-[#FF5B5B]" },
                  { icon: "💰", name: "Salary", amount: "+Rp 8.500.000", color: "text-[#00C48C]" },
                  { icon: "🍕", name: "Food", amount: "-Rp 85.000", color: "text-[#FF5B5B]" },
                ].map((tx) => (
                  <div key={tx.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#F5F7FA] flex items-center justify-center text-sm">
                        {tx.icon}
                      </div>
                      <span className="text-xs font-medium text-[#1A1A2E]">{tx.name}</span>
                    </div>
                    <span className={`text-xs font-bold ${tx.color}`}>{tx.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -left-6 top-1/3 bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
              <span className="text-lg">📊</span>
              <div>
                <p className="text-[10px] font-bold text-[#1A1A2E]">Analytics</p>
                <p className="text-[10px] text-[#00C48C] font-semibold">+12% this month</p>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/4 bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <div>
                <p className="text-[10px] font-bold text-[#1A1A2E]">Budget on track</p>
                <p className="text-[10px] text-[#6B7280]">2 of 6 categories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================
          STATS STRIP
          ================================ */}
      <section className="bg-[#0D1F1E] border-y border-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center divide-x divide-white/10">
          {[
            { value: "100%", label: "Free forever" },
            { value: "256-bit", label: "Encryption" },
            { value: "∞", label: "Transactions" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl lg:text-3xl font-extrabold text-[#00B9A7]">{stat.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================
          FEATURES SECTION
          ================================ */}
      <section id="features" className="py-16 lg:py-24 px-4 lg:px-6 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#E6F7F6] rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs font-semibold text-[#00B9A7]">Everything you need</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] leading-tight">
            Powerful features, <span className="text-[#00B9A7]">zero complexity</span>
          </h2>
          <p className="text-base text-[#6B7280] mt-4 max-w-xl mx-auto">
            Everything you need to understand and control your finances — without the learning curve.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default group"
            >
              <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`}/>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E] mb-1">{feature.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================
          TRUST SIGNAL BAR
          ================================ */}
      <section className="py-10 px-4 bg-[#F8FAFB] border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            {
              icon: Shield,
              title: "Bank-level encryption",
              desc: "256-bit AES encryption. Your data is never sold or shared.",
            },
            {
              icon: CheckCircle,
              title: "Free forever",
              desc: "No hidden fees, no premium tiers. All features, always free.",
            },
            {
              icon: Smartphone,
              title: "Works everywhere",
              desc: "Fully responsive web app. Install as PWA on any device.",
            },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-3 p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#E6F7F5] flex items-center justify-center">
                <item.icon className="w-5 h-5 text-[#007A6E]" />
              </div>
              <p className="text-sm font-bold text-[#0D1F1E]">{item.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================
          CTA SECTION
          ================================ */}
      <section className="py-16 lg:py-24 px-4 lg:px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#00B9A7] to-[#0099A0] rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2"/>
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2"/>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-white"/>
              <span className="text-xs font-semibold text-white">Free forever — no credit card needed</span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              Start tracking your money<br />in under 2 minutes.
            </h2>

            <p className="text-white/80 text-base max-w-md mx-auto">
              Join thousands of people who use SonaMoney to take control of their financial life.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white text-[#00B9A7] rounded-full font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all duration-200 shadow-md"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white/20 text-white rounded-full font-semibold text-sm hover:bg-white/30 active:scale-95 transition-all duration-200"
              >
                Already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================
          FAQ SECTION
          ================================ */}
      <section id="faq" className="py-16 lg:py-24 px-4 lg:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1A1A2E]">Frequently asked questions</h2>
          <p className="text-base text-[#6B7280] mt-3">Everything you need to know about SonaMoney.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#00B9A7]/30 transition-colors duration-200"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-150"
              >
                <span className="text-sm font-semibold text-[#1A1A2E] pr-4">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`}/>
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-[#6B7280] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================================
          FOOTER
          ================================ */}
      <footer className="bg-[#1A1A2E] text-white py-12 px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#00B9A7] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-white">SonaMoney</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                Personal finance made simple. Take control of your money, one transaction at a time.
              </p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00C48C] animate-pulse"/>
                <span className="text-xs text-white/50">Free forever</span>
              </div>
            </div>

            {/* Product links */}
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Product</p>
              <ul className="space-y-3">
                {[
                  { label: "Log in", href: "/login" },
                  { label: "Sign up", href: "/signup" },
                  { label: "Dashboard", href: "/dashboard" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors duration-150">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features list */}
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Features</p>
              <ul className="space-y-3">
                {[
                  "Transaction Tracking",
                  "Budget Management",
                  "Analytics & Charts",
                  "Multi Currency",
                  "AI Assistant",
                  "Export PDF & Excel",
                ].map((feature) => (
                  <li key={feature} className="text-sm text-white/60 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[#00B9A7] shrink-0"/>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Legal</p>
              <ul className="space-y-3">
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Security", href: "/security" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/40">© 2026 SonaMoney. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Shield className="w-3 h-3" />
              <span>Secured with 256-bit encryption</span>
            </div>
          </div>
        </div>
      </footer>
    </div>

    {/* Sticky mobile CTA bar */}
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-100 shadow-lg px-4 py-3">
      <Link
        href="/signup"
        className="flex items-center justify-center gap-2 h-12 w-full bg-[#00B9A7] text-white rounded-full font-semibold text-sm hover:bg-[#007A6E] active:scale-95 transition-all duration-200 shadow-md shadow-[#00B9A7]/25"
      >
        Get started free
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </>
  )
}
