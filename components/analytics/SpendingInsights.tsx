"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import type { LucideIcon } from "lucide-react";

type InsightType = "positive" | "negative" | "neutral";

interface Insight {
    type: InsightType;
    icon: LucideIcon;
    message: string;
}

interface SpendingInsightsProps {
    insights: Insight[];
}

export function SpendingInsights({ insights }: SpendingInsightsProps) {
    const { t } = useTranslation();

    if (insights.length === 0) return null;

    return (
        <div className="mb-4 px-4 md:px-0">
            <h2 className="text-sm font-bold text-[#1A1A2E] dark:text-white mb-3">{t("analytics.spendingInsights")}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 stagger-children">
                {insights.map((insight, i) => (
                    <div key={i}>
                        {insight.type === "positive" ? (
                            <div className="
                                bg-[#E6FAF4] dark:bg-emerald-900/20
                                rounded-2xl p-4
                                flex gap-3 items-start
                                shadow-sm
                                hover:shadow-md
                                hover:-translate-y-0.5
                                transition-all duration-200
                                animate-slideUp
                            ">
                                <div className="
                                    w-9 h-9 rounded-xl shrink-0
                                    flex items-center justify-center
                                    bg-[#00C48C]/20
                                ">
                                    <insight.icon className="w-5 h-5 text-[#00C48C]" />
                                </div>
                                <p className="
                                    text-xs leading-relaxed
                                    text-[#00C48C] dark:text-emerald-400
                                    font-medium
                                ">
                                    {insight.message}
                                </p>
                            </div>
                        ) : insight.type === "negative" ? (
                            <div className="
                                bg-[#FFF0F0] dark:bg-rose-900/20
                                rounded-2xl p-4
                                flex gap-3 items-start
                                shadow-sm
                                hover:shadow-md
                                hover:-translate-y-0.5
                                transition-all duration-200
                                animate-slideUp
                            ">
                                <div className="
                                    w-9 h-9 rounded-xl shrink-0
                                    flex items-center justify-center
                                    bg-[#FF5B5B]/20
                                ">
                                    <insight.icon className="w-5 h-5 text-[#FF5B5B]" />
                                </div>
                                <p className="
                                    text-xs leading-relaxed
                                    text-[#FF5B5B] dark:text-rose-400
                                    font-medium
                                ">
                                    {insight.message}
                                </p>
                            </div>
                        ) : (
                            <div className="
                                bg-[#FFF8E6] dark:bg-yellow-900/20
                                rounded-2xl p-4
                                flex gap-3 items-start
                                shadow-sm
                                hover:shadow-md
                                hover:-translate-y-0.5
                                transition-all duration-200
                                animate-slideUp
                            ">
                                <div className="
                                    w-9 h-9 rounded-xl shrink-0
                                    flex items-center justify-center
                                    bg-[#FFB800]/20
                                ">
                                    <insight.icon className="w-5 h-5 text-[#FFB800]" />
                                </div>
                                <p className="
                                    text-xs leading-relaxed
                                    text-[#FFB800] dark:text-yellow-400
                                    font-medium
                                ">
                                    {insight.message}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
