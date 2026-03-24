"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RecentTransactions } from "./RecentTransactions";
import { BudgetOverview } from "./BudgetOverview";
import { AddTransactionButton } from "./AddTransactionButton";
import { QuickActions } from "./QuickActions";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCurrency } from "@/lib/hooks/useCurrency";
import type { Transaction, Category } from "@/types";
import type { Goal } from "@/lib/actions/goals";
import type { SavedHealthScore } from "@/lib/actions/healthScore";
import { GoalsWidget } from "./GoalsWidget";
import { BudgetNotification } from "./BudgetNotification";
import { HealthScoreWidget } from "./HealthScoreWidget";
import { HealthScoreFAB } from "./HealthScoreFAB";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, PiggyBank } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

// Performance-optimized animated number - only animates once
function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [count, setCount] = useState(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || typeof window === "undefined") {
      setCount(value);
      return;
    }
    
    hasAnimated.current = true;
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const current = Math.min(Math.floor(step * stepValue), value);
      setCount(current);

      if (step >= steps) {
        setCount(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

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
  budgetSummary,
  budgetWarningCount,
  goals,
  healthScore,
}: DashboardClientProps) {
  const { t, mounted, lang } = useTranslation();
  const { baseCurrency, convert, rates, mounted: currencyMounted } = useCurrency();
  const prefersReducedMotion = useReducedMotion();

  // Derive locale from selected language for correct number formatting
  const locale = lang === "id" ? "id-ID" : "en-US";

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

  const formatCurrencyValue = (amount: number) => {
    return mounted
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: baseCurrency,
          maximumFractionDigits: 0,
        }).format(amount)
      : "—";
  };

  return (
    <div className="page-container">
      {/* Modern Enterprise Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-slate-800 px-4 pt-6 pb-8 md:pt-8 md:pb-12 md:rounded-3xl md:mx-4 md:mt-4">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}/>
        </div>

        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl"/>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-slate-500/20 rounded-full blur-3xl"/>
        </div>

        <div className="relative z-10">
          {/* Header Row */}
          <motion.div
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <p className="text-teal-100 text-xs md:text-sm font-medium uppercase tracking-wide">
                {mounted ? t("dashboard.description") : "Financial Overview"}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
                {mounted ? t("dashboard.title") : "Dashboard"}
              </h1>
            </div>
            <div className="hidden md:block">
              <AddTransactionButton />
            </div>
          </motion.div>

          {/* Stats Grid - Simplified Quick Stats */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6">
            {/* Net Flow Card */}
            <motion.div
              className="col-span-3 md:col-span-1"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${totalBalance >= 0 ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}>
                    <TrendingUp className={`h-4 w-4 ${totalBalance >= 0 ? 'text-emerald-300' : 'text-red-300'}`} aria-hidden="true" />
                  </div>
                  <span className="text-teal-100 text-xs font-medium">
                    {mounted ? "Net Flow" : "Net Flow"}
                  </span>
                </div>
                <p className="text-white font-bold text-lg md:text-xl tabular-nums" aria-label={`Net flow: ${formatCurrencyValue(totalBalance)}`}>
                  {formatCurrencyValue(totalBalance)}
                </p>
              </div>
            </motion.div>

            {/* Savings Rate Card */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-teal-500/30 rounded-lg">
                    <PiggyBank className="h-4 w-4 text-teal-300" aria-hidden="true" />
                  </div>
                  <span className="text-teal-100 text-xs font-medium">
                    {mounted ? "Saved" : "Saved"}
                  </span>
                </div>
                <p className="text-white font-bold text-base md:text-lg tabular-nums">
                  {totalIncome > 0 ? `${Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)}%` : "0%"}
                </p>
              </div>
            </motion.div>

            {/* Transaction Count */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Wallet className="h-4 w-4 text-white" aria-hidden="true" />
                  </div>
                  <span className="text-teal-100 text-xs font-medium">
                    {mounted ? "Transactions" : "Txns"}
                  </span>
                </div>
                <p className="text-white font-bold text-base md:text-lg tabular-nums">
                  <AnimatedNumber value={allTransactions.length} />
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

      {/* Budget Warning */}
      {budgetWarningCount > 0 && (
        <motion.div
          className="mx-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 shadow-soft">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-full blur-2xl"/>
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 flex items-center justify-center text-xl shadow-sm">
                ⚠️
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                  {budgetWarningCount}{" "}
                  {mounted ? t("budget.warningCategories") : "budget(s) need attention"}
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-300/70 mt-0.5">
                  {mounted ? t("budget.warningDesc") : "Some categories are close to or over limit"}
                </p>
              </div>
              <Link
                href="/budget"
                className="shrink-0 text-xs font-semibold text-amber-800 dark:text-amber-400 bg-white/80 dark:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-200/50 hover:bg-white hover:shadow-md transition-all duration-200"
              >
                View →
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      {!hasAnyTransactions ? (
        /* Empty state */
        <motion.div
          className="mx-4 mt-6 bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/20 flex items-center justify-center text-4xl mb-5 shadow-sm">
            💸
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {mounted ? t("dashboard.noTransactions") : "No transactions yet"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
            {mounted ? t("dashboard.noTransactionsDesc") : "Add your first transaction to get started"}
          </p>
          <div className="md:hidden">
            <AddTransactionButton />
          </div>
        </motion.div>
      ) : (
        /* Has transactions */
        <div className="mt-6 mx-4 md:mx-0 grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="fixed bottom-20 left-4 right-4 md:hidden z-40">
        <div className="flex justify-center">
          <AddTransactionButton />
        </div>
      </div>
    </div>
  );
}
