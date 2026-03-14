// ============================================
// AI CONTEXT BUILDER
// Fetches and anonymizes user financial data
// ============================================

import { AI_MAX_TRANSACTIONS_CONTEXT, AI_MAX_CATEGORIES_CONTEXT, AI_CONTEXT_DAYS, AI_CONTEXT_CURRENCY_DEFAULT } from "@/lib/constants/ai"
import type {
  AIContext,
  AnonymizedAccount,
  AnonymizedCategory,
  AnonymizedTransaction,
} from "@/lib/types/ai"

interface TransactionRow {
  amount: number
  type: "income" | "expense"
  currency: string
  categories: { name: string } | null
}

interface AccountRow {
  name: string
  type: string
  balance: number
  currency: string
}

interface CategoryRow {
  id: string
  name: string
  type: "income" | "expense"
  budget_limit: number | null
}

interface SupabaseAuthClient {
  from: (table: string) => QueryBuilder
}

interface QueryBuilder {
  select: (columns: string) => FilterBuilder
  insert: (data: unknown) => Promise<{ error: Error | null }>
  update: (data: unknown) => FilterBuilder
}

interface FilterBuilder {
  eq: (column: string, value: string) => FilterBuilder & PromiseExecutor
  gte: (column: string, value: string) => FilterBuilder & PromiseExecutor
  order: (column: string, options: { ascending: boolean }) => FilterBuilder & PromiseExecutor
  limit: (count: number) => FilterBuilder & PromiseExecutor
  single: () => Promise<{ data: unknown | null; error: Error | null }>
}

interface PromiseExecutor {
  then: (onfulfilled: (value: { data: unknown | null; error: Error | null; count?: number | null }) => void) => Promise<void>
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function getDaysAgo(days: number): string {
  const date = new Date(Date.now() - days * MS_PER_DAY)
  return date.toISOString().slice(0, 10)
}

export async function buildAIContext(
  supabase: SupabaseAuthClient,
  userId: string
): Promise<AIContext> {
  const daysAgo = getDaysAgo(AI_CONTEXT_DAYS)
  const startOfMonth = new Date().toISOString().slice(0, 7) + "-01"

  const [accounts, categories, recentTransactions, monthlyTransactions] = await Promise.all([
    fetchAccounts(supabase, userId),
    fetchCategoriesWithSpending(supabase, userId, daysAgo),
    fetchRecentTransactions(supabase, userId, daysAgo),
    fetchMonthlyTransactions(supabase, userId, startOfMonth),
  ])

  const thisMonthIncome = computeMonthlyTotal(monthlyTransactions, "income")
  const thisMonthExpenses = computeMonthlyTotal(monthlyTransactions, "expense")
  const netSavings = thisMonthIncome - thisMonthExpenses

  const topCategories = categories.slice(0, AI_MAX_CATEGORIES_CONTEXT)
  const budgetsOverLimit = categories.filter((cat) => cat.isOverBudget)

  const firstTransaction = recentTransactions[0]
  const currency = firstTransaction?.currency ?? AI_CONTEXT_CURRENCY_DEFAULT

  return {
    generatedAt: new Date().toISOString(),
    thisMonthIncome,
    thisMonthExpenses,
    netSavings,
    currency,
    accounts,
    topCategories,
    recentTransactions: recentTransactions.slice(0, 10),
    budgetsOverLimit,
  }
}

async function fetchRecentTransactions(
  supabase: SupabaseAuthClient,
  userId: string,
  fromDate: string
): Promise<AnonymizedTransaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("date, amount, type, currency, categories(name)")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .order("date", { ascending: false })
    .limit(AI_MAX_TRANSACTIONS_CONTEXT)

  if (error || !data) return []

  return (data as TransactionRow[]).map((row) => ({
    amount: row.amount,
    type: row.type,
    categoryName: row.categories?.name ?? "Uncategorized",
    currency: row.currency ?? AI_CONTEXT_CURRENCY_DEFAULT,
  }))
}

async function fetchAccounts(
  supabase: SupabaseAuthClient,
  userId: string
): Promise<AnonymizedAccount[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("name, type, balance, currency")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error || !data) return []

  return (data as AccountRow[]).map((row) => ({
    name: row.name,
    type: row.type,
    balance: row.balance,
    currency: row.currency,
  }))
}

async function fetchCategoriesWithSpending(
  supabase: SupabaseAuthClient,
  userId: string,
  fromDate: string
): Promise<AnonymizedCategory[]> {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, type, budget_limit")
    .eq("user_id", userId)

  if (error || !categories) return []

  const categoryList = categories as CategoryRow[]

  const spendingPromises = categoryList.map(async (category) => {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", userId)
      .eq("category_id", category.id)
      .eq("type", category.type)
      .gte("date", fromDate)

    const spent = (transactions as { amount: number }[] | null)?.reduce(
      (sum, t) => sum + t.amount,
      0
    ) ?? 0

    const isOverBudget =
      category.budget_limit !== null &&
      category.budget_limit > 0 &&
      spent > category.budget_limit

    return {
      name: category.name,
      type: category.type,
      budgetLimit: category.budget_limit,
      spent,
      isOverBudget,
    }
  })

  const categoriesWithSpending = await Promise.all(spendingPromises)

  // Filter out categories with 0 spent, sort by spent descending, limit to top N
  return categoriesWithSpending
    .filter((cat) => cat.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, AI_MAX_CATEGORIES_CONTEXT)
}

async function fetchMonthlyTransactions(
  supabase: SupabaseAuthClient,
  userId: string,
  fromDate: string
): Promise<{ amount: number; type: "income" | "expense" }[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type")
    .eq("user_id", userId)
    .gte("date", fromDate)

  if (error || !data) return []

  return data as { amount: number; type: "income" | "expense" }[]
}

function computeMonthlyTotal(
  transactions: { amount: number; type: "income" | "expense" }[],
  type: "income" | "expense"
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0)
}
