"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { RecentTransactions } from "./RecentTransactions";
import { BudgetOverview } from "./BudgetOverview";
import { AddTransactionButton } from "./AddTransactionButton";
import { QuickActions } from "./QuickActions";
import { AccountCarousel } from "./AccountCarousel";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCurrency } from "@/lib/hooks/useCurrency";
import type { Transaction, Category, Account } from "@/types";
import StatCard from "@/components/ui/StatCard";

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
}

export function DashboardClient({
  summary,
  transactions,
  allTransactions,
  categories,
  accounts,
  budgetSummary,
  budgetWarningCount,
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
      {/* Gradient Header */}
      <div className="
        bg-gradient-to-br
        from-[#00B9A7] to-[#0099A0]
        px-4 pt-6 pb-10
        md:rounded-2xl md:mx-4 md:mt-4
      ">
        {/* Title */}
        <div className="
          flex items-center
          justify-between mb-4
        ">
          <div>
            <p className="
              text-white/80 text-sm
              font-medium
            ">
              {mounted
                ? t("dashboard.description")
                : "Overview"}
            </p>
            <h1 className="
              text-2xl font-extrabold
              text-white mt-0.5
            ">
              {mounted
                ? t("dashboard.title")
                : "Dashboard"}
            </h1>
          </div>
          {/* Add button desktop */}
          <div className="hidden md:block">
            <AddTransactionButton />
          </div>
        </div>

        {/* Income / Expense pills */}
        <div className="flex gap-3 mt-2 min-h-[52px]">
          <div className={`
            flex items-center gap-2
            bg-white/20 backdrop-blur-sm
            rounded-2xl px-4 py-2
            transition-opacity duration-200
            ${mounted ? "opacity-100" : "opacity-0"}
          `}>
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
          </div>

          <div className={`
            flex items-center gap-2
            bg-white/20 backdrop-blur-sm
            rounded-2xl px-4 py-2
            transition-opacity duration-200
            ${mounted ? "opacity-100" : "opacity-0"}
          `}>
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

      {/* Stat Cards (desktop only) */}
      <div className="
        hidden md:grid
        md:grid-cols-3
        gap-4 mt-4 mx-4
        stagger-children
      ">
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
      </div>

      {/* Budget Warning */}
      {budgetWarningCount > 0 && (
        <div className="
          mx-4 mt-4
          bg-[#FFF8E6] dark:bg-yellow-900/20
          border border-[#FFB800]/30
          rounded-2xl p-4
          flex items-center gap-3
          animate-slideUp
        ">
          <span className="text-xl shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="
              text-sm font-semibold
              text-[#FFB800]
            ">
              {budgetWarningCount}{" "}
              {mounted
                ? t("budget.warningCategories")
                : "budget(s) over limit"}
            </p>
            <Link
              href="/budget"
              className="
                text-xs text-[#FFB800]
                hover:underline font-medium
              "
            >
              {mounted ? t("budget.viewBudgets") : "View budgets"} →
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!hasAnyTransactions ? (
        /* Empty state */
        <div className="
          mx-4 mt-4
          bg-white dark:bg-gray-900
          rounded-2xl shadow-sm p-8
          flex flex-col items-center
          text-center animate-fadeIn
        ">
          <span className="text-5xl mb-4">💸</span>
          <h3 className="
            text-base font-bold
            text-[#1A1A2E] dark:text-white
          ">
            {mounted
              ? t("dashboard.noTransactions")
              : "No transactions yet"}
          </h3>
          <p className="
            text-sm text-[#6B7280] mt-1 mb-4
          ">
            {mounted
              ? t("dashboard.noTransactionsDesc")
              : "Add your first transaction to get started"}
          </p>
          <div className="md:hidden">
            <AddTransactionButton />
          </div>
        </div>
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
        </div>
      )}

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
