import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Transaction {
  type: string;
  amount: number;
}

interface Category {
  budget_limit: number | null;
  transactions?: Transaction[];
}

export async function GET(): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient() as {
      auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            eq: (column: string, value: string) => {
              not: (column: string, operator: string, value: null) => Promise<{ data: Category[] | null }>;
            };
          };
        };
      };
    };
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ count: 0 }, { status: 401 });
    }

    // Fetch categories with budget limits and their transactions
    const { data: categories } = await supabase
      .from("categories")
      .select("*, transactions(amount, type)")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .not("budget_limit", "is", null);

    // Calculate warnings (70%+ of budget used)
    const warningCount = categories?.filter((cat: Category) => {
      const spent = (cat.transactions ?? [])
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const budget = cat.budget_limit ?? 0;
      const pct = budget > 0 ? (spent / budget) * 100 : 0;
      return pct >= 70;
    }).length ?? 0;

    return Response.json({ count: warningCount });
  } catch (error) {
    console.error("Budget warnings API error:", error);
    return Response.json({ count: 0 }, { status: 500 });
  }
}
