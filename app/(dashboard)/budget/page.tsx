import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchCategories } from "@/lib/actions/categories";
import { BudgetClient } from "@/components/budget/BudgetClient";
import type { Category, Transaction } from "@/types";

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
  };
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

export const metadata = {
  title: "Budget",
  description: "Track your spending against budget limits.",
};

export default async function BudgetPage() {
  const supabase = await createSupabaseServerClient() as unknown as SupabaseAuthClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: transactionsRaw } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", user.id)
      .gte("date", currentMonth + "-01")
      .lte("date", currentMonth + "-31")
      .eq("type", "expense");

  const transactions = transactionsRaw as Transaction[] | null;

  // Fetch categories on server — always available on refresh
  const allCategories = await fetchCategories();
  const initialCategories = allCategories.filter(
    (cat: Category) => cat.type === "expense"
  );

  return (
    <BudgetClient
      transactions={(transactions ?? [])}
      initialCategories={initialCategories}
    />
  );
}

