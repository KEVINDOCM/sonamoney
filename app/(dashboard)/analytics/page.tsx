import * as React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";
import type { Transaction } from "@/types";

export const metadata = {
    title: "Analytics",
    description: "Detailed insights into your income and expenses.",
};

function AnalyticsSkeleton() {
    return (
        <div className="
            bg-[#F5F7FA] dark:bg-[#0F172A]
            min-h-screen pb-6
        ">
            {/* Header */}
            <div className="px-4 md:px-0 mb-4">
                <div className="skeleton h-7 w-32 rounded-xl mb-2"/>
                <div className="skeleton h-4 w-48 rounded-lg"/>
            </div>

            {/* Period selector skeleton */}
            <div className="px-4 md:px-0 mb-4">
                <div className="skeleton h-11 rounded-2xl"/>
            </div>

            {/* Summary cards skeleton */}
            <div className="
                flex gap-3 overflow-x-auto
                scrollbar-hide pb-1 px-4 mb-4
                md:hidden
            ">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="
                            min-w-[140px] shrink-0
                            rounded-2xl h-[100px]
                            skeleton
                        "
                    />
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="
                grid grid-cols-1 lg:grid-cols-2
                gap-4 px-4 md:px-0
            ">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl h-[280px] skeleton"
                    />
                ))}
            </div>
        </div>
    );
}

export default async function AnalyticsPage() {
    return (
        <React.Suspense fallback={<AnalyticsSkeleton />}>
            <AnalyticsContent />
        </React.Suspense>
    );
}

async function AnalyticsContent() {
    const supabase = await createSupabaseServerClient();
    const typedSupabase = supabase as {
        auth: { getUser: () => Promise<{ data: { user: unknown } }> };
        from: (table: string) => {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    order: (column: string, options: { ascending: boolean }) => Promise<{ data: unknown[] | null }>
                }
            }
        }
    };

    const {
        data: { user },
    } = await typedSupabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: transactions } = await typedSupabase
        .from("transactions")
        .select("*")
        .eq("user_id", (user as { id: string }).id)
        .order("date", { ascending: false });

    return (
        <AnalyticsClient
            transactions={(transactions as Transaction[]) || []}
        />
    );
}
