// @ts-nocheck
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchCategories } from "@/lib/actions/categories";
import { BudgetClient } from "@/components/budget/BudgetClient";
import type { Category, Transaction } from "@/types";

export const metadata = {
  title: "Budget",
  description: "Track your spending against budget limits.",
};

export default async function BudgetPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: transactions } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", session.user.id)
      .gte("date", currentMonth + "-01")
      .lte("date", currentMonth + "-31")
      .eq("type", "expense");

  // Fetch categories on server — always available on refresh
  const allCategories = await fetchCategories();
  const initialCategories = allCategories.filter(
    (cat) => cat.type === "expense"
  );

  return (
    <BudgetClient
      transactions={(transactions ?? []) as Transaction[]}
      initialCategories={initialCategories}
    />
  );
}

