import { fetchCategories } from "@/lib/actions/categories";
import { BudgetView } from "@/components/budget/BudgetView";
import { getAuthenticatedClient } from "@/lib/utils/auth"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Category, Transaction } from "@/types";

export const metadata = {
  title: "Budget",
  description: "Track your spending against budget limits.",
};

export default async function BudgetPage() {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient()
  const supabase = rawSupabase as SupabaseClient

  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: transactionsRaw } = await supabase
    .from("transactions")
    .select("*, categories(name)")
    .eq("user_id", user.id)
    .gte("date", currentMonth + "-01")
    .lte("date", currentMonth + "-31")
    .eq("type", "expense")

  const transactions = transactionsRaw as Transaction[] | null

  const allCategories = await fetchCategories()
  const initialCategories = allCategories.filter(
    (cat: Category) => cat.type === "expense"
  )

  return (
    <BudgetView
      transactions={(transactions ?? [])}
      initialCategories={initialCategories}
    />
  )
}

