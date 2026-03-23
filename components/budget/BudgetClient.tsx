"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { updateBudgetLimit } from "@/lib/actions/categories";
import { useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useUserData } from "@/lib/contexts/UserDataContext";
import type { CategoryWithBudget, Transaction } from "@/types";
import { Target, AlertCircle, Pencil, Check, X } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import StatCard from "@/components/ui/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";

interface BudgetWarning {
  categoryName: string;
  spent: number;
  budget: number;
  percentage: number;
  level: "warning" | "danger";
}

function computeBudgetWarnings(
  categories: CategoryWithBudget[],
  spendingMap: Map<string, number>
): BudgetWarning[] {
  return categories
    .filter(cat => cat.budget_limit && cat.budget_limit > 0)
    .map(cat => {
      const spent = spendingMap.get(cat.id) ?? 0;
      const budget = cat.budget_limit ?? 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      return {
        categoryName: cat.name,
        spent,
        budget,
        percentage,
        level: (percentage >= 100 ? "danger" : "warning") as "warning" | "danger",
      };
    })
    .filter(w => w.percentage >= 70)
    .sort((a, b) => b.percentage - a.percentage);
}

export interface BudgetClientProps {
  transactions: Transaction[];
  initialCategories: CategoryWithBudget[];
}

interface BudgetCategoryData {
  category: CategoryWithBudget;
  spent: number;
  limit: number;
  percentage: number;
  isOverBudget: boolean;
  hasLimit: boolean;
}

export function BudgetClient({ transactions, initialCategories }: BudgetClientProps) {
  const { categories: contextCategories } = useUserData();
  const { toast, toasts, removeToast } = useToast();
  const { t, mounted } = useTranslation();
  const { baseCurrency, convert } = useCurrency();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingBudgetValue, setEditingBudgetValue] = useState<string>("");
  const [localCategories, setLocalCategories] = useState<CategoryWithBudget[]>(initialCategories);

  useEffect(() => {
    const expenseContext = contextCategories
      .filter((c) => c.type === "expense")

    if (expenseContext.length === 0) return

    setLocalCategories((prev) => {
      // Build lookup of current local budget_limits
      const localBudgetMap = new Map(
        prev.map((c) => [c.id, c.budget_limit])
      )

      // Check if IDs changed
      const prevIds = prev.map((c) => c.id).sort().join(",")
      const ctxIds = expenseContext
        .map((c) => c.id)
        .sort()
        .join(",")

      // If same IDs, only update if budget_limit
      // changed in context (user saved new budget)
      if (prevIds === ctxIds) {
        const hasChange = expenseContext.some((ctxCat) => {
          const localBudget = localBudgetMap.get(ctxCat.id)
          // Context has a NEW budget_limit that differs
          // from what we have locally
          return (
            ctxCat.budget_limit !== null &&
            ctxCat.budget_limit !== localBudget
          )
        })

        if (!hasChange) return prev

        // Update only changed budget_limits
        return prev.map((localCat) => {
          const ctxCat = expenseContext.find(
            (c) => c.id === localCat.id
          )
          if (!ctxCat) return localCat
          return {
            ...localCat,
            budget_limit:
              ctxCat.budget_limit ?? localCat.budget_limit,
          }
        })
      }

      // IDs changed (new category added/deleted)
      // Full replace with budget_limit preserved
      return expenseContext.map((ctxCat) => ({
        ...ctxCat,
        budget_limit:
          ctxCat.budget_limit ??
          localBudgetMap.get(ctxCat.id) ??
          null,
      }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextCategories])

  const spendingMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      const current = map.get(t.category_id) ?? 0;
      const txCurrency = t.currency ?? "USD";
      const convertedAmount = convert(t.amount, txCurrency, baseCurrency);
      map.set(t.category_id, current + convertedAmount);
    });
    return map;
  }, [transactions, convert, baseCurrency]);

  const budgetData: BudgetCategoryData[] = useMemo(() => {
    return localCategories
      .filter((category) => category.type === "expense")
      .map((category) => {
      const spent = spendingMap.get(category.id) ?? 0;
      const limit = category.budget_limit ?? 0;
      const hasLimit = category.budget_limit !== null && category.budget_limit > 0;
      const percentage = hasLimit ? Math.min((spent / limit) * 100, 100) : 0;
      const isOverBudget = hasLimit && spent > limit;

      return {
        category,
        spent,
        limit,
        percentage,
        isOverBudget,
        hasLimit,
      };
    });
  }, [localCategories, spendingMap]);

  const summary = useMemo(() => {
    // Only count spending for categories that have budget limits
    const totalSpent = budgetData.reduce(
      (sum, d) => sum + d.spent,
      0
    )
    const totalBudgeted = budgetData.reduce((sum, d) => {
      return sum + convert(
        d.category.budget_limit ?? 0,
        "IDR",
        baseCurrency
      )
    }, 0);
    const categoriesOverBudget = budgetData.filter((d) => d.isOverBudget).length;
    const budgetUsedPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return {
      totalBudgeted,
      totalSpent,
      categoriesOverBudget,
      budgetUsedPercentage,
    };
  }, [budgetData, convert, baseCurrency]);

  const currentMonthName = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const warnings = computeBudgetWarnings(localCategories, spendingMap);

  const handleEditBudgetClick = useCallback((category: CategoryWithBudget) => {
    setEditingCategoryId(category.id);
    setEditingBudgetValue(category.budget_limit !== null ? String(category.budget_limit) : "");
  }, []);

  const handleCancelBudgetEdit = useCallback(() => {
    setEditingCategoryId(null);
    setEditingBudgetValue("");
  }, []);

  const handleSaveBudgetLimit = async (categoryId: string) => {
    const newLimit = editingBudgetValue.trim() === "" ? null : Number(editingBudgetValue);

    if (newLimit !== null && (isNaN(newLimit) || newLimit < 0)) {
      toast.error(mounted ? t("common.error") : "Please enter a valid positive number");
      return;
    }

    // Optimistic update
    const previousCategories = localCategories;
    setLocalCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, budget_limit: newLimit } : cat
      )
    );
    setEditingCategoryId(null);

    const result = await updateBudgetLimit(categoryId, newLimit);

    if (result.success) {
      toast.success(t("budget.budgetUpdated"));
    } else {
      // Revert on error
      setLocalCategories(previousCategories);
      toast.error(result.error ?? t("common.error"));
    }
  };

  const getProgressColor = useCallback((percentage: number): string => {
    if (percentage < 70) return "bg-emerald-500";
    if (percentage < 90) return "bg-amber-500";
    return "bg-rose-500";
  }, []);

  if (localCategories.length === 0) {
    return (
      <div className="
        bg-[#F5F7FA] dark:bg-[#0F172A]
        min-h-screen pb-6
      ">
        <div className="px-4 pt-4 pb-0 md:px-0 md:pt-0 mb-4">
          <h1 className="text-xl font-extrabold text-[#1A1A2E] dark:text-white">
            {mounted ? t("budget.title") : "Budget"}
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            {mounted ? t("budget.description") : ""}
          </p>
        </div>
        <div className="mx-4 md:mx-0 bg-white dark:bg-gray-900 rounded-2xl shadow-sm flex flex-col items-center justify-center py-12 px-4 text-center animate-fadeIn">
          <span className="text-4xl mb-3">🎯</span>
          <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
            {mounted ? t("budget.noBudgets") : "No expense categories yet"}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            {mounted ? t("budget.noBudgetsDesc") : "Create expense categories first to set budget limits."}
          </p>
          <Link
            href="/categories"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-[#00B9A7] text-white rounded-full text-sm font-semibold hover:bg-[#0099A0] active:scale-95 transition-all duration-200"
          >
            {mounted ? t("budget.goToCategories") : "Go to Categories"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">

      {/* ================================
          PAGE HEADER
          ================================ */}
      <div className="px-4 pt-4 pb-0 md:px-0 md:pt-0 mb-4">
        <h1 className="page-title">
          {mounted ? t("budget.title") : "Budget"}
        </h1>
        <p className="section-subtitle mt-0.5">
          {mounted ? t("budget.description") : "Track and manage your spending limits"}
        </p>
      </div>

      {/* ================================
          GRADIENT OVERVIEW CARD
          ================================ */}
      <div className="px-4 md:px-0 mb-4">
        <div className="
          bg-gradient-to-br
          from-teal-600 to-slate-800
          rounded-2xl p-5
          shadow-lg
          animate-fadeIn
        ">
          <p className="
            text-white/70 text-xs
            uppercase tracking-wide mb-1
          ">
            {mounted ? t("budget.totalBudgeted") : "Total Budgeted"}
          </p>
          <p className="
            text-3xl font-extrabold
            text-white leading-tight
          ">
            {mounted
              ? formatCurrency(summary.totalBudgeted, baseCurrency)
              : "—"}
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="
              w-full bg-white/30
              rounded-full h-2 overflow-hidden
            ">
              <div
                className="
                  h-2 rounded-full bg-white
                  transition-all duration-700 ease-out
                "
                style={{
                  width: `${Math.min(summary.budgetUsedPercentage, 100)}%`,
                }}
              />
            </div>
            <div className="
              flex justify-between items-center mt-2
            ">
              <span className="text-white/70 text-xs">
                {mounted
                  ? formatCurrency(summary.totalSpent, baseCurrency)
                  : "—"}{" "}
                {mounted ? t("budget.spentOf") : "spent"}
              </span>
              <span className="text-white/70 text-xs">
                {mounted
                  ? formatCurrency(
                      Math.max(
                        summary.totalBudgeted - summary.totalSpent,
                        0
                      ),
                      baseCurrency
                    )
                  : "—"}{" "}
                {mounted ? t("budget.remaining") : "left"}
              </span>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex gap-2 mt-4">
            <div className="
              bg-white/20 rounded-2xl
              px-3 py-1.5 backdrop-blur-sm
            ">
              <p className="text-white/70 text-[10px] uppercase tracking-wide">
                {mounted ? t("budget.categories") : "Categories"}
              </p>
              <p className="text-white font-bold text-sm">
                {budgetData.length}
              </p>
            </div>
            <div className="
              bg-white/20 rounded-2xl
              px-3 py-1.5 backdrop-blur-sm
            ">
              <p className="text-white/70 text-[10px] uppercase tracking-wide">
                {mounted ? t("budget.overBudget") : "Over budget"}
              </p>
              <p className="text-white font-bold text-sm">
                {summary.categoriesOverBudget}
              </p>
            </div>
            <div className="
              bg-white/20 rounded-2xl
              px-3 py-1.5 backdrop-blur-sm
            ">
              <p className="text-white/70 text-[10px] uppercase tracking-wide">
                {mounted ? t("budget.onTrack") : "On track"}
              </p>
              <p className="text-white font-bold text-sm">
                {budgetData.length - summary.categoriesOverBudget}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================
          WARNING BANNERS
          ================================ */}
      {warnings.length > 0 && (
        <div className="px-4 md:px-0 mb-4 space-y-2">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className={`
                flex items-start gap-3
                rounded-2xl p-4 shadow-sm
                animate-slideUp
                ${warning.level === "danger"
                  ? "bg-[#FFF0F0] dark:bg-rose-900/20 border border-[#FF5B5B]/20"
                  : "bg-[#FFF8E6] dark:bg-yellow-900/20 border border-[#FFB800]/20"
                }
              `}
            >
              <span className="text-xl shrink-0">
                {warning.level === "danger" ? "🔴" : "⚠️"}
              </span>
              <div className="flex-1">
                <p className={`
                  text-sm font-semibold
                  ${warning.level === "danger"
                    ? "text-[#FF5B5B]"
                    : "text-[#FFB800]"
                  }
                `}>
                  {warning.level === "danger"
                    ? `${warning.categoryName} ${mounted ? t("budget.warningOver") : "is over budget!"}`
                    : `${warning.categoryName} ${mounted ? t("budget.warningNear") : "is at"} ${warning.percentage.toFixed(0)}% ${mounted ? t("budget.spentOf") : "of budget"}`
                  }
                </p>
                <p className={`
                  text-xs mt-0.5
                  ${warning.level === "danger"
                    ? "text-[#FF5B5B]/70"
                    : "text-[#FFB800]/70"
                  }
                `}>
                  {formatCurrency(warning.spent, baseCurrency)} {mounted ? t("budget.spentOf") : "spent of"} {formatCurrency(warning.budget, baseCurrency)}
                  {warning.level === "danger" && ` · ${formatCurrency(warning.spent - warning.budget, baseCurrency)} ${mounted ? t("budget.overBudget") : "over limit"}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================
          BUDGET LIST HEADER
          ================================ */}
      <div className="
        px-4 md:px-0 mb-3
        flex items-center justify-between
      ">
        <h2 className="
          text-sm font-bold
          text-[#1A1A2E] dark:text-white
        ">
          {mounted ? t("budget.categories") : "Categories"}
        </h2>
        <span className="
          text-xs text-[#6B7280]
          dark:text-gray-400
        ">
          {budgetData.length}{" "}
          {mounted ? t("budget.items") : "items"}
        </span>
      </div>

      {/* ================================
          BUDGET CATEGORY CARDS
          ================================ */}
      {budgetData.length === 0 ? (
        <div className="
          mx-4 md:mx-0
          bg-white dark:bg-gray-900
          rounded-2xl shadow-sm
          flex flex-col items-center
          justify-center py-12 px-4
          text-center animate-fadeIn
        ">
          <span className="text-4xl mb-3">🎯</span>
          <p className="
            text-sm font-semibold
            text-[#1A1A2E] dark:text-white
          ">
            {mounted ? t("budget.noBudgets") : "No budgets set"}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            {mounted
              ? t("budget.noBudgetsDesc")
              : "Set spending limits on your expense categories"}
          </p>
          <Link
            href="/categories"
            className="
              mt-4 inline-flex items-center justify-center
              px-4 py-2 bg-[#00B9A7] text-white
              rounded-full text-sm font-semibold
              hover:bg-[#0099A0] active:scale-95
              transition-all duration-200
            "
          >
            {mounted ? t("budget.goToCategories") : "Go to Categories"}
          </Link>
        </div>
      ) : (
        <div className="
          px-4 md:px-0
          space-y-3 stagger-children
        ">
          {budgetData.map((data) => {
            const pct = data.hasLimit
              ? Math.min(
                  ((data.spent ?? 0) / data.limit) * 100,
                  100
                )
              : 0

            const isEditing = editingCategoryId === data.category.id

            const barColor =
              pct >= 90
                ? "bg-[#FF5B5B]"
                : pct >= 70
                ? "bg-[#FFB800]"
                : "bg-[#00C48C]"

            const badgeStyle =
              pct >= 90
                ? "bg-[#FFF0F0] text-[#FF5B5B]"
                : pct >= 70
                ? "bg-[#FFF8E6] text-[#FFB800]"
                : "bg-[#E6FAF4] text-[#00C48C]"

            return (
              <div
                key={data.category.id}
                className="
                  bg-white dark:bg-gray-900
                  rounded-2xl shadow-sm p-4
                  hover:shadow-md
                  hover:-translate-y-0.5
                  transition-all duration-200
                "
              >
                {/* Top row: icon + name + badge */}
                <div className="
                  flex items-center gap-3 mb-3
                ">
                  <div className="
                    w-10 h-10 rounded-xl shrink-0
                    flex items-center justify-center
                    bg-[#F5F7FA] dark:bg-gray-800
                    text-lg
                  ">
                    {data.category.icon ?? "📦"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="
                      text-sm font-bold
                      text-[#1A1A2E] dark:text-white
                      truncate
                    ">
                      {data.category.name}
                    </p>
                    {data.hasLimit && (
                      <p className="
                        text-xs text-[#6B7280]
                        dark:text-gray-400 mt-0.5
                      ">
                        {formatCurrency(data.spent, baseCurrency)}
                        {" / "}
                        {formatCurrency(data.limit, baseCurrency)}
                      </p>
                    )}
                  </div>

                  {/* Percentage badge */}
                  {data.hasLimit && (
                    <span className={`
                      text-[11px] font-bold
                      px-2.5 py-1 rounded-full
                      shrink-0 ${badgeStyle}
                    `}>
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {data.hasLimit ? (
                  <div className="
                    w-full bg-gray-100
                    dark:bg-gray-700
                    rounded-full h-2
                    overflow-hidden mb-3
                  ">
                    <div
                      className={`
                        h-2 rounded-full
                        transition-all duration-700
                        ease-out ${barColor}
                      `}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : (
                  <div className="
                    w-full bg-gray-100
                    dark:bg-gray-700
                    rounded-full h-2 mb-3
                  ">
                    <div className="
                      h-2 w-0 rounded-full
                      bg-gray-200 dark:bg-gray-600
                    "/>
                  </div>
                )}

                {/* Edit budget input OR set budget prompt */}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editingBudgetValue}
                      onChange={(e) =>
                        setEditingBudgetValue(e.target.value)
                      }
                      placeholder="Budget limit"
                      className="
                        flex-1 h-9
                        border border-gray-200
                        dark:border-gray-700
                        dark:bg-gray-800
                        dark:text-white
                        rounded-xl px-3
                        text-sm
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#00B9A7]/30
                        focus:border-[#00B9A7]
                      "
                    />
                    <button
                      onClick={() => handleSaveBudgetLimit(data.category.id)}
                      className="
                        h-9 px-3 rounded-xl
                        bg-[#00B9A7] text-white
                        text-xs font-semibold
                        hover:bg-[#0099A0]
                        active:scale-95
                        transition-all duration-200
                      "
                    >
                      {mounted ? t("common.save") : "Save"}
                    </button>
                    <button
                      onClick={handleCancelBudgetEdit}
                      className="
                        h-9 px-3 rounded-xl
                        border border-gray-200
                        dark:border-gray-700
                        text-xs font-medium
                        text-[#6B7280]
                        hover:bg-gray-50
                        dark:hover:bg-gray-800
                        active:scale-95
                        transition-all duration-200
                      "
                    >
                      {mounted ? t("common.cancel") : "Cancel"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingCategoryId(data.category.id)
                      setEditingBudgetValue(
                        data.hasLimit
                          ? String(data.limit)
                          : ""
                      )
                    }}
                    className="
                      text-xs font-semibold
                      text-[#00B9A7]
                      hover:text-[#0099A0]
                      transition-colors duration-150
                    "
                  >
                    {data.hasLimit
                      ? (mounted ? t("budget.setBudget") : "Edit limit")
                      : (mounted ? t("budget.setBudget") : "+ Set budget limit")}
                  </button>
                )}

                {/* Over budget warning */}
                {data.isOverBudget && (
                  <p className="
                    text-xs text-[#FF5B5B]
                    flex items-center gap-1 mt-2
                    font-medium
                  ">
                    🔴 {mounted
                      ? t("budget.overBudgetBy")
                      : "Over budget by"}{" "}
                    {formatCurrency(data.spent - data.limit, baseCurrency)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
