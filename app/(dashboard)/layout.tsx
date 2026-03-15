import { Sidebar } from "@/components/layout/Sidebar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserDataProvider } from "@/lib/contexts/UserDataContext";
import { ChatProvider } from "@/components/chat";
import type { Category, Transaction } from "@/types";

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          not: (column: string, operator: string, value: null) => Promise<{ data: unknown[] | null }>;
        };
      };
    };
  };
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createSupabaseServerClient() as unknown as SupabaseAuthClient;
  const { data: { user } } = await supabase.auth.getUser();

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Fetch categories with transactions to compute budget warnings
  const { data: budgetCategoriesRaw } = await supabase
    .from("categories")
    .select("*, transactions(amount, type)")
    .eq("user_id", user?.id ?? "")
    .eq("type", "expense")
    .not("budget_limit", "is", null);

  const budgetCategories = budgetCategoriesRaw as (Category & { transactions?: Transaction[] })[] | null;

  // Compute budget warnings (70%+ of budget)
  const budgetWarningCount: number = budgetCategories?.filter((cat) => {
    const spent = (cat.transactions ?? [])
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const budget = cat.budget_limit ?? 0;
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    return pct >= 70;
  }).length ?? 0;

  return (
    <UserDataProvider>
      <Sidebar budgetWarningCount={budgetWarningCount}>
        <ChatProvider>
          {children}
        </ChatProvider>
      </Sidebar>
    </UserDataProvider>
  );
}
