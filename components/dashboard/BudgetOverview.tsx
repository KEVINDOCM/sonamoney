"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCurrency } from "@/lib/hooks/useCurrency";
import type { Category } from "@/types";
import { Button } from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

interface BudgetSummary {
  categoriesWithLimit: Category[];
  spendingMap: Map<string, number>;
  totalBudgeted: number;
  totalSpent: number;
  overBudgetCount: number;
  hasBudgets: boolean;
}

interface BudgetOverviewProps {
  budgetSummary: BudgetSummary;
}

export function BudgetOverview({ budgetSummary }: BudgetOverviewProps) {
  const { t, mounted } = useTranslation();
  const { baseCurrency } = useCurrency();
  const { categoriesWithLimit, spendingMap, hasBudgets } = budgetSummary;

  return (
    <div className="
      bg-white dark:bg-gray-900
      rounded-2xl shadow-sm
      overflow-hidden
      hover:shadow-md
      transition-shadow duration-300
    ">
      {/* Header */}
      <div className="
        flex items-center justify-between
        px-4 pt-4 pb-3
        border-b border-gray-100 dark:border-gray-800
      ">
        <h3 className="
          text-sm font-bold
          text-[#1A1A2E] dark:text-white
        ">
          {mounted ? t("budget.title") : "Budget"}
        </h3>
        <Link
          href="/budget"
          className="
            text-xs font-semibold
            text-[#00B9A7] hover:text-[#0099A0]
            transition-colors duration-150
          "
        >
          {mounted ? t("dashboard.viewAll") : "View All"} →
        </Link>
      </div>

      {/* Empty state */}
      {(!categoriesWithLimit ||
        categoriesWithLimit.length === 0) ? (
        <div className="
          flex flex-col items-center justify-center
          py-10 px-4 text-center
        ">
          <span className="text-3xl mb-3">🎯</span>
          <p className="
            text-sm font-medium
            text-[#1A1A2E] dark:text-white
          ">
            {mounted ? t("budget.noBudgets") : "No budgets set"}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            {mounted
              ? t("budget.noBudgetsDesc")
              : "Set spending limits on categories"}
          </p>
          <Link
            href="/categories"
            className="
              mt-4 text-xs font-semibold
              text-[#00B9A7] hover:text-[#0099A0]
              transition-colors
            "
          >
            {mounted ? t("budget.goToCategories") : "Go to Categories"} →
          </Link>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          {categoriesWithLimit
            .slice(0, 4)
            .map((cat: Category) => {
              const spent = spendingMap.get(cat.id) ?? 0;
              const pct = cat.budget_limit
                ? Math.min(
                    (spent / cat.budget_limit) * 100,
                    100
                  )
                : 0
              const color =
                pct >= 90
                  ? "bg-[#FF5B5B]"
                  : pct >= 70
                  ? "bg-[#FFB800]"
                  : "bg-[#00C48C]"

              return (
                <div key={cat.id}>
                  <div className="
                    flex justify-between
                    items-center mb-1.5
                  ">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {cat.icon ?? "📦"}
                      </span>
                      <span className="
                        text-xs font-semibold
                        text-[#1A1A2E] dark:text-white
                      ">
                        {cat.name}
                      </span>
                    </div>
                    <span className={`
                      text-[10px] font-bold px-2 py-0.5
                      rounded-full
                      ${pct >= 90
                        ? "bg-[#FFF0F0] text-[#FF5B5B]"
                        : pct >= 70
                        ? "bg-[#FFF8E6] text-[#FFB800]"
                        : "bg-[#E6FAF4] text-[#00C48C]"
                      }
                    `}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="
                    w-full bg-gray-100
                    dark:bg-gray-700
                    rounded-full h-1.5
                    overflow-hidden
                  ">
                    <div
                      className={`
                        h-1.5 rounded-full
                        transition-all duration-700
                        ${color}
                      `}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
