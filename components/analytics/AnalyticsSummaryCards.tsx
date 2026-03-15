"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/utils/currency";

interface AnalyticsSummaryCardsProps {
    countThisMonth: number;
    averageTransaction: number;
    biggestExpenseThisMonth: number;
    mostUsedCategory: string;
    baseCurrency: string;
    mounted: boolean;
    t: (key: string) => string;
}

export function AnalyticsSummaryCards({
    countThisMonth,
    averageTransaction,
    biggestExpenseThisMonth,
    mostUsedCategory,
    baseCurrency,
    mounted,
    t,
}: AnalyticsSummaryCardsProps) {
    return (
        <div className="mb-4 px-4 md:px-0">
            {/* Mobile: horizontal scroll cards */}
            <div className="
                flex gap-3
                overflow-x-auto scrollbar-hide
                pb-1 -mx-4 px-4
                md:hidden
            ">
                {/* Card 1: Transactions count */}
                <div className="
                    bg-gradient-to-br
                    from-[#00B9A7] to-[#0099A0]
                    rounded-2xl p-4
                    min-w-[140px] shrink-0
                    shadow-sm
                    dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]
                ">
                    <p className="
                        text-white/70 text-[10px]
                        uppercase tracking-wide mb-1
                    ">
                        {mounted ? t("analytics.totalTransactions") : "Transactions"}
                    </p>
                    <p className="
                        text-white text-2xl
                        font-extrabold leading-tight
                    ">
                        {countThisMonth}
                    </p>
                    <p className="text-white/60 text-[10px] mt-1">
                        {mounted ? t("analytics.thisMonth") : "This month"}
                    </p>
                </div>

                {/* Card 2: Average */}
                <div className="
                    bg-gradient-to-br
                    from-[#6366F1] to-[#4F46E5]
                    rounded-2xl p-4
                    min-w-[140px] shrink-0
                    shadow-sm
                    dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]
                ">
                    <p className="
                        text-white/70 text-[10px]
                        uppercase tracking-wide mb-1
                    ">
                        {mounted ? t("analytics.avgTransaction") : "Average"}
                    </p>
                    <p className="
                        text-white text-2xl
                        font-extrabold leading-tight
                    ">
                        {mounted
                            ? new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: baseCurrency,
                                maximumFractionDigits: 0,
                                notation: "compact",
                            }).format(averageTransaction)
                            : "—"}
                    </p>
                    <p className="text-white/60 text-[10px] mt-1">
                        {mounted ? t("analytics.perTransaction") : "Per transaction"}
                    </p>
                </div>

                {/* Card 3: Biggest expense */}
                <div className="
                    bg-gradient-to-br
                    from-[#FF5B5B] to-[#DC2626]
                    rounded-2xl p-4
                    min-w-[140px] shrink-0
                    shadow-sm
                    dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]
                ">
                    <p className="
                        text-white/70 text-[10px]
                        uppercase tracking-wide mb-1
                    ">
                        {mounted ? t("analytics.biggestExpense") : "Biggest"}
                    </p>
                    <p className="
                        text-white text-2xl
                        font-extrabold leading-tight
                    ">
                        {mounted
                            ? new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: baseCurrency,
                                maximumFractionDigits: 0,
                                notation: "compact",
                            }).format(biggestExpenseThisMonth)
                            : "—"}
                    </p>
                    <p className="text-white/60 text-[10px] mt-1">
                        {mounted ? t("analytics.thisMonth") : "This month"}
                    </p>
                </div>

                {/* Card 4: Most used category */}
                <div className="
                    bg-gradient-to-br
                    from-[#FFB800] to-[#F59E0B]
                    rounded-2xl p-4
                    min-w-[140px] shrink-0
                    shadow-sm
                    dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]
                ">
                    <p className="
                        text-white/70 text-[10px]
                        uppercase tracking-wide mb-1
                    ">
                        {mounted ? t("analytics.topCategory") : "Top Category"}
                    </p>
                    <p className="
                        text-white text-base
                        font-extrabold leading-tight
                        truncate
                    ">
                        {mostUsedCategory || "—"}
                    </p>
                    <p className="text-white/60 text-[10px] mt-1">
                        {mounted ? t("analytics.mostUsed") : "Most used"}
                    </p>
                </div>
            </div>

            {/* Desktop: grid 4 columns */}
            <div className="
                hidden md:grid
                grid-cols-2 lg:grid-cols-4
                gap-4
            ">
                <StatCard
                    title={mounted ? t("analytics.totalTransactions") : "Transactions"}
                    value={String(countThisMonth)}
                    subtitle={mounted ? t("analytics.thisMonth") : "This month"}
                    borderColorClass="border-[#00B9A7]"
                />
                <StatCard
                    title={mounted ? t("analytics.avgTransaction") : "Average"}
                    value={mounted
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: baseCurrency,
                            maximumFractionDigits: 0,
                        }).format(averageTransaction)
                        : "—"}
                    borderColorClass="border-[#6366F1]"
                />
                <StatCard
                    title={mounted ? t("analytics.biggestExpense") : "Biggest"}
                    value={mounted
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: baseCurrency,
                            maximumFractionDigits: 0,
                        }).format(biggestExpenseThisMonth)
                        : "—"}
                    borderColorClass="border-[#FF5B5B]"
                />
                <StatCard
                    title={mounted ? t("analytics.topCategory") : "Top Category"}
                    value={mostUsedCategory || "—"}
                    borderColorClass="border-[#FFB800]"
                />
            </div>
        </div>
    );
}
