"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RecentTransactions } from "./RecentTransactions";
import { BudgetOverview } from "./BudgetOverview";
import { AddTransactionButton } from "./AddTransactionButton";
import { QuickActions } from "./QuickActions";
import { AccountCarousel } from "./AccountCarousel";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCurrency } from "@/lib/hooks/useCurrency";
import type { Transaction, Category, Account } from "@/types";
import type { Goal } from "@/lib/actions/goals";
import type { SavedHealthScore } from "@/lib/actions/healthScore";
import StatCard from "@/components/ui/StatCard";
import { GoalsWidget } from "./GoalsWidget";
import { BudgetNotification } from "./BudgetNotification";
import { HealthScoreWidget } from "./HealthScoreWidget";
import { HealthScoreFAB } from "./HealthScoreFAB";

// Animated number counter component
function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    if (hasAnimated) return;
    
    const duration = 1500;
    const steps = 45;
    const stepValue = value / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const current = Math.min(Math.floor(step * stepValue), value);
      setCount(current);
      
      if (step >= steps) {
        setCount(value);
        setHasAnimated(true);
        clearInterval(timer);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value, hasAnimated]);
  
  return <span>{prefix}{count.toLocaleString()}</span>;
}

interface BudgetSummary {
  categoriesWithLimit: Category[];
  spendingMap: Map<string, number>;
  totalBudgeted: number;
  totalSpent: number;
  overBudgetCount: number;
  hasBudgets: boolean;
}

interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  hasAnyTransactions: boolean;
}

interface DashboardClientProps {
  summary: DashboardSummary;
  transactions: Transaction[];
  allTransactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgetSummary: BudgetSummary;
  budgetWarningCount: number;
  goals: Goal[];
  healthScore: SavedHealthScore;
}

export function DashboardClient({
  summary,
  transactions,
  allTransactions,
  categories,
  accounts,
  budgetSummary,
  budgetWarningCount,
  goals,
  healthScore,
}: DashboardClientProps) {
  const { t, mounted } = useTranslation();
  const { baseCurrency, convert, rates, mounted: currencyMounted } = useCurrency();

  const safeConvert = useCallback(
    (amount: number, fromCurrency: string): number => {
      try {
        if (fromCurrency === baseCurrency) return amount;
        if (!rates || Object.keys(rates).length === 0) return amount;
        const validCurrency = ["USD", "IDR"].includes(fromCurrency) ? fromCurrency : "IDR";
        return convert(amount, validCurrency, baseCurrency);
      } catch {
        return amount;
      }
    },
    [baseCurrency, rates, convert]
  );

  const totalIncome = useMemo(
    () => allTransactions
      .filter(tx => tx.type === "income")
      .reduce((sum, tx) => {
        const txCurrency = (tx.currency as string) ?? "IDR";
        return sum + safeConvert(tx.amount, txCurrency);
      }, 0),
    [allTransactions, safeConvert]
  );

  const totalExpenses = useMemo(
    () => allTransactions
      .filter(tx => tx.type === "expense")
      .reduce((sum, tx) => {
        const txCurrency = (tx.currency as string) ?? "IDR";
        return sum + safeConvert(tx.amount, txCurrency);
      }, 0),
    [allTransactions, safeConvert]
  );

  const totalBalance = useMemo(
    () => totalIncome - totalExpenses,
    [totalIncome, totalExpenses]
  );

  const hasAnyTransactions = summary.hasAnyTransactions;

  return (
    <div className="
      bg-[#F5F7FA] dark:bg-[#0F172A]
      min-h-screen pb-6
      overflow-x-hidden
    ">
      {/* Modern Gradient Mesh Header - Mobile First Compact */}
      <div className="
        relative overflow-hidden
        px-4 pt-4 pb-6
        md:pt-6 md:pb-10
        md:rounded-3xl md:mx-4 md:mt-4
        bg-gradient-to-br from-[#00B9A7] via-[#00A896] to-[#0099A0]
      ">
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/20 rounded-full blur-3xl"/>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#00D4AA]/30 rounded-full blur-2xl"/>
        </div>
        
        <div className="relative z-10">
        {/* Title - Compact on mobile */}
        <motion.div 
          className="flex items-center justify-between mb-3 md:mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="text-white/80 text-xs md:text-sm font-medium">
              {mounted ? t("dashboard.description") : "Overview"}
            </p>
            <h1 className="text-xl md:text-2xl font-extrabold text-white mt-0.5">
              {mounted ? t("dashboard.title") : "Dashboard"}
            </h1>
          </div>
          <div className="hidden md:block">
            <AddTransactionButton />
          </div>
        </motion.div>

        {/* Mobile Combined Stats Card */}
        <motion.div 
          className="md:hidden bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-lg shadow-black/5 p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-[10px] text-white/70 uppercase tracking-wide">{mounted ? t("dashboard.totalIncome") : "Income"}</p>
              <p className="text-white font-bold text-sm">{mounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: baseCurrency, maximumFractionDigits: 0 }).format(totalIncome) : "—"}</p>
            </div>
            <div className="w-px h-8 bg-white/30"/>
            <div className="text-center flex-1">
              <p className="text-[10px] text-white/70 uppercase tracking-wide">{mounted ? t("dashboard.totalExpenses") : "Expenses"}</p>
              <p className="text-white font-bold text-sm">{mounted ? new Intl.NumberFormat("id-ID", { style: "currency", currency: baseCurrency, maximumFractionDigits: 0 }).format(totalExpenses) : "—"}</p>
            </div>
          </div>
        </motion.div>

        {/* Desktop Income / Expense pills - hidden on mobile */}
        <div className="hidden md:flex gap-3 mt-2 min-h-[52px]">
          <motion.div 
            className={`
              flex items-center gap-2
              bg-white/15 backdrop-blur-md
              rounded-2xl px-4 py-2
              border border-white/20
              shadow-lg shadow-black/5
              ${mounted ? "opacity-100" : "opacity-0"}
            `}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="text-white text-sm">↑</span>
            <div>
              <p className="
                text-white/70 text-[10px]
                uppercase tracking-wide
              ">
                {mounted
                  ? t("dashboard.totalIncome")
                  : "Income"}
              </p>
              <p className="
                text-white font-bold text-sm
              ">
                {mounted
                  ? new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: baseCurrency,
                      maximumFractionDigits: 0,
                    }).format(totalIncome)
                  : "—"}
              </p>
            </div>
          </motion.div>

          <motion.div 
            className={`
              flex items-center gap-2
              bg-white/15 backdrop-blur-md
              rounded-2xl px-4 py-2
              border border-white/20
              shadow-lg shadow-black/5
              transition-opacity duration-200
              ${mounted ? "opacity-100" : "opacity-0"}
            `}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="text-white text-sm">↓</span>
            <div>
              <p className="
                text-white/70 text-[10px]
                uppercase tracking-wide
              ">
                {mounted
                  ? t("dashboard.totalExpenses")
                  : "Expenses"}
              </p>
              <p className="
                text-white font-bold text-sm
              ">
                {mounted
                  ? new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: baseCurrency,
                      maximumFractionDigits: 0,
                    }).format(totalExpenses)
                  : "—"}
              </p>
            </div>
          </motion.div>
        </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions
        mounted={mounted}
        t={t}
        onAddTransaction={() => {}}
      />

      {/* Account Carousel */}
      {accounts && accounts.length > 0 && (
        <div className="mt-4 mx-4 md:mx-0">
          <div className="
            flex items-center
            justify-between mb-3
          ">
            <h2 className="
              text-sm font-bold
              text-[#1A1A2E] dark:text-white
            ">
              {mounted ? t("nav.accounts") : "Accounts"}
            </h2>
          </div>
          <AccountCarousel
            accounts={accounts}
            mounted={mounted}
            t={t}
            baseCurrency={baseCurrency}
            convert={safeConvert}
            formatCurrency={(amount, currency) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              }).format(amount)
            }
          />
        </div>
      )}

      {/* Stat Cards (desktop only) - with animated counters */}
      <div className="
        hidden md:grid
        md:grid-cols-3
        gap-4 mt-4 mx-4
      ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <StatCard
            title={mounted ? t("dashboard.totalBalance") : "Balance"}
            value={mounted
              ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: baseCurrency,
                  maximumFractionDigits: 0,
                }).format(totalBalance)
              : "—"}
            borderColorClass="border-[#00B9A7]"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatCard
            title={mounted ? t("dashboard.totalIncome") : "Income"}
            value={mounted
              ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: baseCurrency,
                  maximumFractionDigits: 0,
                }).format(totalIncome)
              : "—"}
            borderColorClass="border-[#00C48C]"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatCard
            title={mounted ? t("dashboard.totalExpenses") : "Expenses"}
            value={mounted
              ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: baseCurrency,
                  maximumFractionDigits: 0,
                }).format(totalExpenses)
              : "—"}
            borderColorClass="border-[#FF5B5B]"
          />
        </motion.div>
      </div>

      {/* Budget Warning - Modern Styled */}
      {budgetWarningCount > 0 && (
        <motion.div 
          className="mx-4 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="
            relative overflow-hidden
            bg-gradient-to-r from-amber-50 to-orange-50
            dark:from-yellow-900/20 dark:to-orange-900/10
            border border-amber-200/50
            rounded-2xl p-4
            shadow-sm
          ">
            {/* Subtle gradient overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-full blur-2xl"/>
            
            <div className="relative flex items-center gap-3">
              <div className="
                w-10 h-10 rounded-xl shrink-0
                bg-gradient-to-br from-amber-100 to-orange-100
                dark:from-yellow-800/30 dark:to-orange-800/20
                flex items-center justify-center
                text-xl shadow-sm
              ">
                ⚠️
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  {budgetWarningCount}{" "}
                  {mounted
                    ? t("budget.warningCategories")
                    : "budget(s) need attention"}
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-300/70 mt-0.5">
                  {mounted
                    ? t("budget.warningDesc")
                    : "Some categories are close to or over limit"}
                </p>
              </div>
              <Link
                href="/budget"
                className="
                  shrink-0 text-xs font-bold
                  text-amber-700 dark:text-amber-400
                  bg-white/80 dark:bg-white/10
                  backdrop-blur-sm
                  px-4 py-2 rounded-full
                  border border-amber-200/50
                  hover:bg-white hover:shadow-md
                  transition-all duration-200
                "
              >
                View →
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      {!hasAnyTransactions ? (
        /* Empty state - Modern Glassmorphism */
        <motion.div 
          className="
            mx-4 mt-4
            bg-white dark:bg-gray-900
            rounded-3xl shadow-lg shadow-gray-200/50
            border border-gray-100 dark:border-gray-800
            p-8
            flex flex-col items-center
            text-center
          "
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="
            w-20 h-20 rounded-2xl
            bg-gradient-to-br from-[#E6F7F6] to-[#B8E8E3]
            dark:from-[#00B9A7]/20 dark:to-[#0099A0]/10
            flex items-center justify-center
            text-4xl mb-5
            shadow-sm
          ">
            💸
          </div>
          <h3 className="
            text-lg font-bold
            text-[#1A1A2E] dark:text-white
            mb-2
          ">
            {mounted
              ? t("dashboard.noTransactions")
              : "No transactions yet"}
          </h3>
          <p className="
            text-sm text-[#6B7280] dark:text-gray-400
            mb-6 max-w-xs
          ">
            {mounted
              ? t("dashboard.noTransactionsDesc")
              : "Add your first transaction to get started"}
          </p>
          <div className="md:hidden">
            <AddTransactionButton />
          </div>
        </motion.div>
      ) : (
        /* Has transactions */
        <div className="
          mt-4 mx-4 md:mx-0
          grid grid-cols-1
          md:grid-cols-2
          gap-4
        ">
          <RecentTransactions
            transactions={transactions}
            categories={categories}
          />
          <BudgetOverview
            budgetSummary={budgetSummary}
          />
          <HealthScoreWidget healthScore={healthScore} />
          {goals && goals.length > 0 && (
            <GoalsWidget
              goals={goals}
              mounted={mounted}
              t={t}
            />
          )}
        </div>
      )}

      <BudgetNotification
        budgetWarningCount={budgetWarningCount}
        mounted={mounted}
        t={t}
      />

      <HealthScoreFAB healthScore={healthScore} />

      {/* Mobile Add Button */}
      <div className="
        fixed bottom-20 left-4 right-4
        md:hidden z-40
      ">
        <div className="flex justify-center">
          <AddTransactionButton />
        </div>
      </div>
    </div>
  );
}
