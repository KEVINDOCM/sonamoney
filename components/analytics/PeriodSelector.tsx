"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

type PeriodOption = "1m" | "3m" | "6m" | "1y" | "all";

interface PeriodSelectorProps {
    selectedPeriod: PeriodOption;
    onPeriodChange: (period: PeriodOption) => void;
}

export function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
    const { t } = useTranslation();

    const periods: { value: PeriodOption; label: string }[] = [
        { value: "1m", label: t("analytics.period1m") },
        { value: "3m", label: t("analytics.period3m") },
        { value: "6m", label: t("analytics.period6m") },
        { value: "1y", label: t("analytics.period1y") },
        { value: "all", label: t("analytics.periodAll") },
    ];

    return (
        <div className="px-4 md:px-0 mb-4">
            <div className="
                flex gap-1.5
                overflow-x-auto scrollbar-hide
                bg-white dark:bg-gray-900
                rounded-2xl shadow-sm p-1.5
            ">
                {periods.map((period) => (
                    <button
                        key={period.value}
                        onClick={() => onPeriodChange(period.value)}
                        className={`
                            flex-1 min-w-[48px]
                            px-3 py-2
                            rounded-xl text-xs font-semibold
                            whitespace-nowrap
                            transition-all duration-200
                            active:scale-95
                            ${selectedPeriod === period.value
                                ? "bg-[#00B9A7] text-white shadow-sm"
                                : "text-[#6B7280] dark:text-gray-400 hover:text-[#1A1A2E] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                            }
                        `}
                    >
                        {period.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
