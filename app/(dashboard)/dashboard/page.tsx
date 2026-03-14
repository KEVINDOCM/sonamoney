// @ts-nocheck
import { fetchDashboardSummary, fetchTransactions } from "@/lib/actions/transactions";
import { fetchCategories } from "@/lib/actions/categories";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [summary, { items: allTransactions }, categories, { data: monthTransactions }] = await Promise.all([
    fetchDashboardSummary(),
    fetchTransactions({ page: 1, pageSize: 5 }),
    fetchCategories(),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session?.user?.id ?? "")
      .gte("date", currentMonth + "-01")
      .lte("date", currentMonth + "-31")
      .eq("type", "expense"),
  ]);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const categoriesWithLimit = expenseCategories.filter((c) => c.budget_limit !== null && c.budget_limit > 0);
  const totalBudgeted = categoriesWithLimit.reduce((sum, c) => sum + (c.budget_limit ?? 0), 0);

  const spendingMap = new Map<string, number>();
  (monthTransactions ?? []).forEach((t) => {
    const current = spendingMap.get(t.category_id) ?? 0;
    // Ensure amount is treated as number to prevent string concatenation
    const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount);
    spendingMap.set(t.category_id, current + amount);
  });

  const totalSpent = Array.from(spendingMap.values()).reduce((sum, amount) => sum + amount, 0);
  const overBudgetCount = categoriesWithLimit.filter((c) => {
    const spent = spendingMap.get(c.id) ?? 0;
    return spent > (c.budget_limit ?? 0);
  }).length;

  // Compute budget warnings (70%+ of budget)
  const budgetWarningCount: number = categoriesWithLimit.filter(cat => {
    const spent = spendingMap.get(cat.id) ?? 0;
    const budget = cat.budget_limit ?? 0;
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    return pct >= 70;
  }).length;

  const budgetSummary = {
    categoriesWithLimit,
    spendingMap,
    totalBudgeted,
    totalSpent,
    overBudgetCount,
    hasBudgets: categoriesWithLimit.length > 0,
  };

  return (
    <DashboardClient
      summary={summary}
      transactions={allTransactions.slice(0, 5)}
      allTransactions={allTransactions}
      categories={categories}
      budgetSummary={budgetSummary}
      budgetWarningCount={budgetWarningCount}
    />
  );
}