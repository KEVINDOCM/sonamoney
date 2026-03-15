import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CalendarClient } from "@/components/calendar/CalendarClient";
import type { TransactionWithCategory } from "@/types";

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options: { ascending: boolean }) => Promise<{
          data: TransactionWithCategory[] | null;
        }>;
      };
    };
  };
}

export default async function CalendarPage() {
  const supabase = await createSupabaseServerClient();
  const typedSupabase = supabase as unknown as SupabaseAuthClient;

  const {
    data: { user },
  } = await typedSupabase.auth.getUser();

  const { data: transactions } = await typedSupabase
    .from("transactions")
    .select("*, categories(name, color, type, icon)")
    .eq("user_id", user?.id ?? "")
    .order("date", { ascending: false });

  return (
    <div className="
      bg-[#F5F7FA] dark:bg-[#0F172A]
      min-h-screen pb-6
    ">
      <CalendarClient transactions={transactions ?? []} />
    </div>
  );
}
