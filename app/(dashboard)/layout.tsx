// @ts-nocheck
import { Sidebar } from "@/components/layout/Sidebar"; // @ts-nocheck
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserDataProvider } from "@/lib/contexts/UserDataContext";
import { ChatProvider } from "@/components/chat";

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Fetch categories with transactions to compute budget warnings
  const { data: budgetCategories } = await supabase
    .from("categories")
    .select("*, transactions(amount, type)")
    .eq("user_id", session?.user?.id ?? "")
    .eq("type", "expense")
    .not("budget_limit", "is", null);

  // Compute budget warnings (70%+ of budget)
  const budgetWarningCount: number = budgetCategories?.filter((cat: any) => {
    const spent = (cat.transactions ?? [])
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
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
