import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CalendarClient } from "@/components/calendar/CalendarClient";
import type { TransactionWithCategory } from "@/types";

// Force dynamic rendering since this page uses cookies for auth
export const dynamic = "force-dynamic";

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: Error | null }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options: { ascending: boolean }) => Promise<{
          data: TransactionWithCategory[] | null;
          error: Error | null;
        }>;
      };
    };
  };
}

export default async function CalendarPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const typedSupabase = supabase as unknown as SupabaseAuthClient;

    const {
      data: { user },
    } = await typedSupabase.auth.getUser();

    if (!user) {
      console.error("CalendarPage: No authenticated user found");
      return (
        <div className="
          bg-[#F5F7FA] dark:bg-[#0F172A]
          min-h-screen pb-6
        ">
          <div className="p-8 text-center">
            <p className="text-red-500">Please log in to view the calendar.</p>
          </div>
        </div>
      );
    }

    const { data: transactions, error: txError } = await typedSupabase
      .from("transactions")
      .select("*, categories(name, color, type, icon)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (txError) {
      console.error("CalendarPage: Error fetching transactions:", txError);
    }

    return (
      <div className="
        bg-[#F5F7FA] dark:bg-[#0F172A]
        min-h-screen pb-6
      ">
        <CalendarClient transactions={transactions ?? []} />
      </div>
    );
  } catch (error) {
    console.error("CalendarPage: Unexpected error:", error);
    return (
      <div className="
        bg-[#F5F7FA] dark:bg-[#0F172A]
        min-h-screen pb-6
      ">
        <div className="p-8 text-center">
          <p className="text-red-500">Failed to load calendar. Please try refreshing.</p>
        </div>
      </div>
    );
  }
}
