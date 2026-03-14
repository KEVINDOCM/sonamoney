"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/formatDate";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCurrency } from "@/lib/hooks/useCurrency";
import type { Transaction, Category } from "@/types";

export interface RecentTransactionsProps {
    transactions: Transaction[];
    categories: Category[];
}

export function RecentTransactions({ transactions, categories }: RecentTransactionsProps) {
    const { t, mounted } = useTranslation();
    const { baseCurrency, convert, rates } = useCurrency();

    const safeConvert = (amount: number, fromCurrency: string): number => {
        try {
            if (fromCurrency === baseCurrency) return amount;
            if (!rates || Object.keys(rates).length === 0) return amount;
            const validCurrency = ["USD", "IDR"].includes(fromCurrency) ? fromCurrency : "IDR";
            return convert(amount, validCurrency, baseCurrency);
        } catch {
            return amount;
        }
    };

    const latestTransactions = [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 5);

    return (
        <div className="
            bg-white dark:bg-gray-900
            rounded-2xl shadow-sm
            overflow-hidden
            hover:shadow-md
            transition-shadow duration-300
        ">
            {/* Header */}
            <div className="
                flex items-center justify-between
                px-4 pt-4 pb-3
                border-b border-gray-100 dark:border-gray-800
            ">
                <div>
                    <h3 className="
                        text-sm font-bold
                        text-[#1A1A2E] dark:text-white
                    ">
                        {mounted ? t("dashboard.recentTransactions") : "Recent"}
                    </h3>
                </div>
                {transactions.length > 0 && (
                    <button
                        onClick={() => {}}
                        className="
                            text-xs font-semibold
                            text-[#00B9A7] hover:text-[#0099A0]
                            transition-colors duration-150
                        "
                    >
                        {mounted ? t("dashboard.viewAll") : "View All"} →
                    </button>
                )}
            </div>

            {/* Content */}
            {transactions.length === 0 ? (
                <div className="
                    flex flex-col items-center justify-center
                    py-10 px-4 text-center
                ">
                    <span className="text-3xl mb-3">💸</span>
                    <p className="
                        text-sm font-medium
                        text-[#1A1A2E] dark:text-white
                    ">
                        {mounted ? t("transactions.noTransactions") : "No transactions"}
                    </p>
                    <p className="
                        text-xs text-[#6B7280] mt-1
                    ">
                        {mounted ? t("transactions.noTransactionsDesc") : "Add your first transaction"}
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {transactions.map((transaction) => {
                        const category = categories.find(
                            (c) => c.id === transaction.category_id
                        );
                        const isIncome = transaction.type === "income";
                        const convertedAmount = safeConvert(
                            transaction.amount,
                            transaction.currency ?? baseCurrency
                        );

                        return (
                            <div
                                key={transaction.id}
                                className="
                                    flex items-center gap-3
                                    px-4 py-3
                                    hover:bg-gray-50 dark:hover:bg-gray-800/50
                                    transition-colors duration-150
                                    cursor-default
                                "
                            >
                                {/* Category Icon */}
                                <div className="
                                    w-10 h-10 rounded-xl shrink-0
                                    flex items-center justify-center
                                    text-lg
                                    bg-[#F5F7FA] dark:bg-gray-800
                                ">
                                    {category?.icon ?? "💰"}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="
                                        text-sm font-semibold
                                        text-[#1A1A2E] dark:text-white
                                        truncate
                                    ">
                                        {category?.name ?? "—"}
                                    </p>
                                    <p className="
                                        text-xs text-[#6B7280]
                                        dark:text-gray-400 mt-0.5
                                    ">
                                        {new Date(transaction.date)
                                            .toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                    </p>
                                </div>

                                {/* Amount */}
                                <div className="text-right shrink-0">
                                    <p className={`
                                        text-sm font-bold
                                        ${isIncome
                                            ? "text-[#00C48C]"
                                            : "text-[#FF5B5B]"
                                        }
                                    `}>
                                        {isIncome ? "+" : "-"}
                                        {mounted
                                            ? formatCurrency(convertedAmount, baseCurrency)
                                            : "—"}
                                    </p>
                                    <span className={`
                                        text-[10px] font-semibold
                                        px-2 py-0.5 rounded-full
                                        ${isIncome
                                            ? "bg-[#E6FAF4] text-[#00C48C]"
                                            : "bg-[#FFF0F0] text-[#FF5B5B]"
                                        }
                                    `}>
                                        {isIncome
                                            ? (mounted ? t("transactions.income") : "Income")
                                            : (mounted ? t("transactions.expense") : "Expense")}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
