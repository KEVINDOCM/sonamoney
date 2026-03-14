// @ts-nocheck
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CalendarClient } from "@/components/calendar/CalendarClient";

export default async function CalendarPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, categories(name, color, type, icon)")
    .eq("user_id", user?.id)
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <CalendarClient transactions={transactions ?? []} />
    </div>
  );
}
