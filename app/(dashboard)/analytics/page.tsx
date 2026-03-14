import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";
import type { Transaction } from "@/types";

export const metadata = {
    title: "Analytics",
    description: "Detailed insights into your income and expenses.",
};

export default async function AnalyticsPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await (supabase as any).auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: transactions } = await (supabase as any)
        .from("transactions")
        .select("*")
        .eq("user_id", (user as any).id)
        .order("date", { ascending: false });

    return (
        <AnalyticsClient
            transactions={(transactions as Transaction[]) || []}
        />
    );
}
