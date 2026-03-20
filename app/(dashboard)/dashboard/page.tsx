import { fetchDashboardSummary, fetchTransactions } from "@/lib/actions/transactions";
import { fetchCategories } from "@/lib/actions/categories";
import { getOrSeedAccounts } from "@/lib/actions/accounts";
import { fetchGoals } from "@/lib/actions/goals";
import { getOrComputeHealthScore } from "@/lib/actions/healthScore";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import type { Category } from "@/types";

// Force dynamic rendering since this page uses cookies for auth
export const dynamic = "force-dynamic";

interface SupabaseAuthClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        gte: (column: string, value: string) => {
          lte: (column: string, value: string) => {
            eq: (column: string, value: string) => Promise<{ data: unknown[] | null }>;
          };
        };
      };
    };
  };
}

export default async function DashboardPage() {
  try {
    const { supabase: rawSupabase, user } = await getAuthenticatedClient();
    const supabase: SupabaseAuthClient = rawSupabase as unknown as SupabaseAuthClient;

    if (!user) {
      console.error("DashboardPage: No authenticated user found");
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-500">Please log in to view the dashboard.</p>
        </div>
      );
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    const [
      summary,
      { items: allTransactions },
      categories,
      accounts,
      goals,
      { data: monthTransactions }
    ] = await Promise.all([
      fetchDashboardSummary(),
      fetchTransactions({ page: 1, pageSize: 5 }),
      fetchCategories(),
      getOrSeedAccounts(),
      fetchGoals(),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", currentMonth + "-01")
        .lte("date", currentMonth + "-31")
        .eq("type", "expense"),
    ]);

    const expenseCategories = (categories as Category[]).filter((c: Category) => c.type === "expense");
    const categoriesWithLimit = expenseCategories.filter((c: Category) => c.budget_limit !== null && c.budget_limit > 0);
    const totalBudgeted = categoriesWithLimit.reduce((sum: number, c: Category) => sum + (c.budget_limit ?? 0), 0);

    const spendingMap = new Map<string, number>();
    (monthTransactions ?? []).forEach((t: unknown) => {
      const tx = t as { category_id: string; amount: string | number };
      const current = spendingMap.get(tx.category_id) ?? 0;
      // Ensure amount is treated as number to prevent string concatenation
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount);
      spendingMap.set(tx.category_id, current + amount);
    });

    const totalSpent = Array.from(spendingMap.values()).reduce((sum: number, amount: number) => sum + amount, 0);
    const overBudgetCount = categoriesWithLimit.filter((c: Category) => {
      const spent = spendingMap.get(c.id) ?? 0;
      return spent > (c.budget_limit ?? 0);
    }).length;

    // Compute budget warnings (70%+ of budget)
    const budgetWarningCount: number = categoriesWithLimit.filter((cat: Category) => {
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

    // Compute health score after other data is fetched
    const healthScore = await getOrComputeHealthScore(
      allTransactions ?? [],
      categories as Category[]
    );

    return (
      <DashboardClient
        summary={summary}
        transactions={allTransactions.slice(0, 5)}
        allTransactions={allTransactions}
        categories={categories}
        accounts={accounts}
        budgetSummary={budgetSummary}
        budgetWarningCount={budgetWarningCount}
        goals={goals}
        healthScore={healthScore}
      />
    );
  } catch (error) {
    console.error("DashboardPage: Unexpected error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load dashboard. Please try refreshing.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}