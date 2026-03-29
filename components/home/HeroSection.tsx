"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, Shield, Smartphone } from "lucide-react"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { containerVariants, itemVariants } from "./animations"

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 px-4 lg:px-6 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — Text */}
        <motion.div
          className="flex flex-col items-start text-left lg:items-start lg:text-left space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-[#E6F7F6] rounded-full px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00B9A7] animate-pulse" />
            <span className="text-xs font-semibold text-[#00B9A7]">Personal Finance, Made Simple</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] leading-tight tracking-tight">
            Take control of <span className="text-[#00B9A7] relative">your money</span> today with the best financial tracker.
          </motion.h1>

          {/* Description */}
          <motion.p variants={itemVariants} className="text-base text-[#6B7280] max-w-md lg:mx-0 leading-relaxed">
            Track income, expenses, budgets, and insights in one clean dashboard. No spreadsheets, no guessing — just a clear view of your money.
          </motion.p>

          {/* CTA buttons — Mobile-optimized */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-none">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 h-14 sm:h-12 px-8 bg-gradient-to-r from-[#00B9A7] to-[#00A896] text-white rounded-2xl sm:rounded-full font-bold text-base sm:text-sm sm:font-semibold hover:shadow-lg hover:shadow-[#00B9A7]/30 sm:hover:shadow-md sm:hover:shadow-[#00B9A7]/25 sm:hover:scale-100 hover:scale-[1.02] active:scale-[0.98] sm:active:scale-95 transition-all duration-200"
            >
              Get started free
              <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center h-12 text-[#6B7280] sm:border-2 sm:border-gray-200 sm:text-[#1A1A2E] sm:rounded-full sm:font-semibold sm:text-sm sm:px-8 font-medium text-sm hover:text-[#00B9A7] sm:hover:border-[#00B9A7] sm:hover:text-[#00B9A7] transition-colors duration-200"
            >
              <motion.span variants={itemVariants} className="sm:hidden">Already have an account? </motion.span>
              <motion.span variants={itemVariants} className="sm:hidden text-[#00B9A7] ml-1">Log in</motion.span>
              <motion.span variants={itemVariants} className="hidden sm:inline">Log in</motion.span>
            </Link>
          </motion.div>
          <motion.p variants={itemVariants} className="text-xs text-[#9CA3AF]">
            Takes 60 seconds · No credit card · Cancel anytime
          </motion.p>

          {/* Trust badges */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-start gap-4 pt-2">
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
          </motion.div>
        </motion.div>

        {/* Right — Dashboard Preview Card (Desktop) */}
        <div className="hidden lg:block relative">
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-64 h-64 rounded-full bg-[#00B9A7]/10 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-[#6366F1]/10 blur-3xl" />

          {/* Main card */}
          <div className="relative bg-white rounded-3xl shadow-2xl shadow-gray-200/80 border border-gray-100 p-6 space-y-4">
            {/* Card header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7280] font-medium">Total Balance</p>
                <p className="text-2xl font-extrabold text-[#1A1A2E]">Rp 12.450.000</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#E6F7F6] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00B9A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
  )
}
