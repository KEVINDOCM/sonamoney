"use server";

import { fetchDashboardSummary, fetchTransactions } from "@/lib/actions/transactions";
import { fetchCategories } from "@/lib/actions/categories";
import { fetchGoals } from "@/lib/actions/goals";
import { getOrComputeHealthScore } from "@/lib/actions/healthScore";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { withCache, CACHE_TTL } from "@/lib/services/cache";
import { DashboardView } from "@/components/dashboard/DashboardView";
import type { Category } from "@/types";

// This component fetches all dashboard data and renders the view
// It's designed to be wrapped in Suspense for streaming
export async function DashboardData() {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase = rawSupabase as any;

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Fetch with caching for hot queries
  const [
    summary,
    { items: allTransactions },
    categories,
    goals,
    { data: monthTransactions },
  ] = await Promise.all([
    withCache(user.id, "dashboard-summary", fetchDashboardSummary, { ttl: CACHE_TTL.DASHBOARD_SUMMARY }),
    fetchTransactions({ page: 1, pageSize: 5 }),
    withCache(user.id, "categories", () => fetchCategories(), { ttl: CACHE_TTL.CATEGORIES }),
    withCache(user.id, "goals", fetchGoals, { ttl: CACHE_TTL.GOALS }),
    supabase
      .from("transactions")
      .select("category_id, amount, type")
      .eq("user_id", user.id)
      .gte("date", currentMonth + "-01")
      .lte("date", currentMonth + "-31")
      .eq("type", "expense"),
  ]);

  const expenseCategories = (categories as Category[]).filter(
    (c: Category) => c.type === "expense"
  );
  const categoriesWithLimit = expenseCategories.filter(
    (c: Category) => c.budget_limit !== null && c.budget_limit > 0
  );
  const totalBudgeted = categoriesWithLimit.reduce(
    (sum: number, c: Category) => sum + (c.budget_limit ?? 0),
    0
  );

  const spendingMap = new Map<string, number>();
  (monthTransactions ?? []).forEach((t: { category_id: string; amount: number | string }) => {
    const current = spendingMap.get(t.category_id) ?? 0;
    const amount =
      typeof t.amount === "string" ? parseFloat(t.amount) : Number(t.amount);
    spendingMap.set(t.category_id, current + amount);
  });

  const totalSpent = Array.from(spendingMap.values()).reduce(
    (sum: number, amount: number) => sum + amount,
    0
  );
  const overBudgetCount = categoriesWithLimit.filter((c: Category) => {
    const spent = spendingMap.get(c.id) ?? 0;
    return spent > (c.budget_limit ?? 0);
  }).length;

  const budgetWarningCount: number = categoriesWithLimit.filter(
    (cat: Category) => {
      const spent = spendingMap.get(cat.id) ?? 0;
      const budget = cat.budget_limit ?? 0;
      const pct = budget > 0 ? (spent / budget) * 100 : 0;
      return pct >= 70;
    }
  ).length;

  const budgetSummary = {
    categoriesWithLimit,
    spendingMap,
    totalBudgeted,
    totalSpent,
    overBudgetCount,
    hasBudgets: categoriesWithLimit.length > 0,
  };

  const healthScore = await getOrComputeHealthScore(
    allTransactions ?? [],
    categories as Category[]
  );

  return (
    <DashboardView
      summary={summary}
      transactions={allTransactions.slice(0, 5)}
      allTransactions={allTransactions}
      categories={categories}
      budgetSummary={budgetSummary}
      budgetWarningCount={budgetWarningCount}
      goals={goals}
      healthScore={healthScore}
    />
  );
}
