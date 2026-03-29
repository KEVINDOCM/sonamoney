"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    LabelList
} from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { useUserData } from "@/lib/contexts/UserDataContext";
import type { Transaction, Category } from "@/types";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import StatCard from "@/components/ui/StatCard";
import { AnalyticsSummaryCards } from "./AnalyticsSummaryCards";
import { PeriodSelector } from "./PeriodSelector";
import { SpendingInsights } from "./SpendingInsights";

type PeriodOption = "1m" | "3m" | "6m" | "1y" | "all";

interface MonthData {
    key: string;
    monthYear: string;
    monthShort: string;
    income: number;
    expense: number;
}

interface CategoryExpense {
    name: string;
    amount: number;
    color: string;
}

interface ThisMonthStats {
    countThisMonth: number;
    totalThisMonth: number;
    biggestExpenseThisMonth: number;
    categoryCountsThisMonth: Record<string, number>;
}

interface Insight {
    type: "positive" | "negative" | "neutral";
    icon: string;
    message: string;
}

function filterByPeriod(transactions: Transaction[], period: PeriodOption): Transaction[] {
    if (period === "all") return transactions;

    const now = new Date();
    const cutoff = new Date();

    if (period === "1m") cutoff.setMonth(now.getMonth() - 1);
    if (period === "3m") cutoff.setMonth(now.getMonth() - 3);
    if (period === "6m") cutoff.setMonth(now.getMonth() - 6);
    if (period === "1y") cutoff.setFullYear(now.getFullYear() - 1);

    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return transactions.filter(t => t.date >= cutoffStr);
}

function getMonthsForPeriod(period: PeriodOption): { key: string; label: string; monthYear: string; monthShort: string }[] {
    const months: { key: string; label: string; monthYear: string; monthShort: string }[] = [];
    const now = new Date();

    let count = 6;
    if (period === "1m") count = 1;
    if (period === "3m") count = 3;
    if (period === "6m") count = 6;
    if (period === "1y") count = 12;
    if (period === "all") count = 12;

    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const monthYear = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        const monthShort = d.toLocaleDateString("en-US", { month: "short" });
        months.push({ key, label, monthYear, monthShort });
    }

    return months;
}

function generateInsights(
    transactions: Transaction[],
    categories: Category[],
    convertAmount: (tx: Transaction) => number,
    t: (key: string) => string,
    baseCurrency: string
): Insight[] {
    const insights: Insight[] = [];
    const now = new Date();

    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

    const currentExpenses = transactions.filter(t => t.type === "expense" && t.date.startsWith(currentMonthStr));
    const prevExpenses = transactions.filter(t => t.type === "expense" && t.date.startsWith(prevMonthStr));

    const currentTotal = currentExpenses.reduce((s, t) => s + convertAmount(t), 0);
    const prevTotal = prevExpenses.reduce((s, t) => s + convertAmount(t), 0);

    // INSIGHT 1 — Month over month spending change
    if (prevTotal > 0 && currentTotal > 0) {
        const change = ((currentTotal - prevTotal) / prevTotal) * 100;
        if (change > 10) {
            insights.push({
                type: "negative",
                icon: "📈",
                message: t("analytics.insightSpendingIncreased").replace("{percent}", Math.abs(change).toFixed(1)),
            });
        } else if (change < -10) {
            insights.push({
                type: "positive",
                icon: "📉",
                message: t("analytics.insightSpendingDecreased").replace("{percent}", Math.abs(change).toFixed(1)),
            });
        } else {
            insights.push({
                type: "neutral",
                icon: "➡️",
                message: t("analytics.insightSpendingConsistent"),
            });
        }
    }

    // INSIGHT 2 — Top spending category
    const categoryTotals = new Map<string, number>();
    currentExpenses.forEach(t => {
        const cat = categories?.find(c => c.id === t.category_id);
        const name = cat?.name ?? "Unknown";
        categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + convertAmount(t));
    });
    const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        const pct = currentTotal > 0 ? ((topCategory[1] / currentTotal) * 100).toFixed(0) : "0";
        insights.push({
            type: "neutral",
            icon: "🏆",
            message: t("analytics.insightTopCategory")
                .replace("{category}", topCategory[0])
                .replace("{percent}", pct),
        });
    }

    // INSIGHT 3 — Income vs expense balance
    const currentIncome = transactions
        .filter(t => t.type === "income" && t.date.startsWith(currentMonthStr))
        .reduce((s, t) => s + convertAmount(t), 0);

    if (currentIncome > 0 && currentTotal > 0) {
        const savingsRate = ((currentIncome - currentTotal) / currentIncome) * 100;
        if (savingsRate >= 20) {
            insights.push({
                type: "positive",
                icon: "💰",
                message: t("analytics.insightSavingsGood").replace("{percent}", savingsRate.toFixed(0)),
            });
        } else if (savingsRate < 0) {
            insights.push({
                type: "negative",
                icon: "⚠️",
                message: t("analytics.insightOverspent").replace("{amount}", formatCurrency(currentTotal - currentIncome, baseCurrency)),
            });
        } else {
            insights.push({
                type: "neutral",
                icon: "💡",
                message: t("analytics.insightSavingsLow").replace("{percent}", savingsRate.toFixed(0)),
            });
        }
    }

    // INSIGHT 4 — Transaction frequency
    const txCount = currentExpenses.length;
    if (txCount > 20) {
        insights.push({
            type: "neutral",
            icon: "🔢",
            message: t("analytics.insightTransactionCount").replace("{count}", txCount.toString()),
        });
    }

    return insights.slice(0, 3);
}

function computeThisMonthStats(transactions: Transaction[], currentMonthStr: string, convertAmount: (tx: Transaction) => number): ThisMonthStats {
    let countThisMonth = 0;
    let totalThisMonth = 0;
    let biggestExpenseThisMonth = 0;
    const categoryCountsThisMonth: Record<string, number> = {};

    if (!transactions || transactions.length === 0) {
        return { countThisMonth, totalThisMonth, biggestExpenseThisMonth, categoryCountsThisMonth };
    }

    transactions.forEach((t) => {
        const tMonth = t.date.substring(0, 7);
        if (tMonth === currentMonthStr) {
            countThisMonth++;
            totalThisMonth += convertAmount(t);
            if (t.type === "expense" && convertAmount(t) > biggestExpenseThisMonth) {
                biggestExpenseThisMonth = convertAmount(t);
            }
            categoryCountsThisMonth[t.category_id] = (categoryCountsThisMonth[t.category_id] || 0) + 1;
        }
    });

    return { countThisMonth, totalThisMonth, biggestExpenseThisMonth, categoryCountsThisMonth };
}

function computeLast6Months(now: Date): MonthData[] {
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            monthYear: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            monthShort: d.toLocaleDateString("en-US", { month: "short" }),
            income: 0,
            expense: 0
        });
    }
    return months;
}

function computeChartData(transactions: Transaction[], last6Months: MonthData[], convertAmount: (tx: Transaction) => number): MonthData[] {
    if (!transactions) return last6Months;
    const data = last6Months.map((m) => ({ ...m }));

    transactions.forEach(t => {
        const tMonth = t.date.substring(0, 7);
        const monthData = data.find((m) => m.key === tMonth);
        if (monthData) {
            if (t.type === "income") monthData.income += convertAmount(t);
            else monthData.expense += convertAmount(t);
        }
    });

    return data;
}

function computeExpensesByCategory(transactions: Transaction[], categories: Category[], convertAmount: (tx: Transaction) => number): CategoryExpense[] {
    if (!transactions) return [];
    const expenses: Record<string, number> = {};
    transactions.forEach(t => {
        if (t.type === "expense") {
            expenses[t.category_id] = (expenses[t.category_id] || 0) + convertAmount(t);
        }
    });

    const data = Object.entries(expenses).map(([catId, amount]) => {
        const cat = categories?.find(c => c.id === catId);
        return {
            name: cat?.name || "Unknown",
            amount,
            color: cat?.color || "#f43f5e"
        };
    });

    return data.sort((a, b) => b.amount - a.amount);
}

interface BudgetActualItem {
    name: string;
    budget: number;
    actual: number;
    color: string;
    percentage: number;
}

function computeBudgetVsActual(
    transactions: Transaction[],
    budgetCategories: Category[],
    period: PeriodOption,
    convertAmount: (tx: Transaction) => number
): BudgetActualItem[] {
    if (budgetCategories.length === 0) return [];

    const expenseTransactions = transactions.filter(t => t.type === "expense");

    return budgetCategories.map(cat => {
        const actual = expenseTransactions
            .filter(t => t.category_id === cat.id)
            .reduce((sum, t) => sum + convertAmount(t), 0);

        const budget = cat.budget_limit ?? 0;
        const percentage = budget > 0 ? Math.min((actual / budget) * 100, 150) : 0;

        return {
            name: cat.name,
            budget,
            actual,
            color: cat.color ?? "#6b7280",
            percentage,
        };
    }).sort((a, b) => b.percentage - a.percentage);
}

export interface AnalyticsClientProps {
    transactions: Transaction[];
}

export function AnalyticsView({ transactions }: AnalyticsClientProps) {
    const { categories } = useUserData();
    const budgetCategories = useMemo(() => 
        categories.filter(c => c.type === "expense" && c.budget_limit !== null),
        [categories]
    );
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("1m");
    const { baseCurrency, convert, rates } = useCurrency();
    useEffect(() => setMounted(true), []);

    // Chart legend labels
    const incomeLabel: string = mounted ? t("transactions.income") : "Income";
    const expenseLabel: string = mounted ? t("transactions.expense") : "Expense";

    // Helper to convert transaction amount to base currency
    const convertAmount = useCallback((tx: Transaction): number => {
        const txCurrency = tx.currency ?? "USD";
        return convert(tx.amount, txCurrency, baseCurrency);
    }, [convert, baseCurrency]);

    const filteredTransactions = useMemo(
        () => filterByPeriod(transactions, selectedPeriod),
        [transactions, selectedPeriod]
    );

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const thisMonthStats = useMemo(
        () => computeThisMonthStats(filteredTransactions, currentMonthStr, convertAmount),
        [filteredTransactions, currentMonthStr, convertAmount]
    );

    const {
        countThisMonth,
        totalThisMonth,
        biggestExpenseThisMonth,
        categoryCountsThisMonth,
    } = thisMonthStats;

    const averageTransaction = countThisMonth > 0 ? totalThisMonth / countThisMonth : 0;

    let mostUsedCategoryId = "";
    let maxCount = 0;
    Object.entries(categoryCountsThisMonth).forEach(([catId, count]: [string, number]) => {
        if (count > maxCount) {
            maxCount = count;
            mostUsedCategoryId = catId;
        }
    });

    const mostUsedCategory = categories?.find((c) => c.id === mostUsedCategoryId)?.name || "-";

    const monthsForPeriod = useMemo(
        () => getMonthsForPeriod(selectedPeriod),
        [selectedPeriod]
    );
    const last6Months = useMemo(
        () => computeLast6Months(now),
        [now]
    );
    const chartMonths = useMemo(
        () => selectedPeriod === "6m" ? last6Months : monthsForPeriod.map(m => ({ ...m, income: 0, expense: 0 })),
        [selectedPeriod, last6Months, monthsForPeriod]
    );
    const chart1And3Data = useMemo(
        () => computeChartData(filteredTransactions, chartMonths, convertAmount),
        [filteredTransactions, chartMonths, convertAmount]
    );

    const expensesByCategory = useMemo(
        () => computeExpensesByCategory(filteredTransactions, categories, convertAmount),
        [filteredTransactions, categories, convertAmount]
    );

    const top5Expenses = expensesByCategory.slice(0, 5);

    const insights = useMemo(
        () => generateInsights(filteredTransactions, categories, convertAmount, t, baseCurrency),
        [filteredTransactions, categories, convertAmount, t, baseCurrency]
    );

    const budgetVsActualData = useMemo(
        () => computeBudgetVsActual(
            filteredTransactions,
            budgetCategories,
            selectedPeriod,
            convertAmount
        ),
        [filteredTransactions, budgetCategories, selectedPeriod, convertAmount]
    );

    const formatYAxisShort = useCallback((value: number): string => {
        if (baseCurrency === "IDR") {
            if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
            if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
            return `Rp ${value}`;
        }
        // USD format
        if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
        if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
        return `$${value}`;
    }, [baseCurrency]);

    if (!transactions || transactions.length === 0) {
        return (
            <div className="page-container">
                <div className="px-4 pt-4 pb-0 md:px-0 md:pt-0 mb-4">
                    <h1 className="page-title">
                        {mounted ? t("nav.analytics") : "Analytics"}
                    </h1>
                    <p className="section-subtitle mt-0.5">
                        {mounted ? t("analytics.description") : "Detailed insights into your finances"}
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-4xl mb-3">📊</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        No data yet
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Add transactions to see analytics
                    </p>
                </div>
            </div>
        );
    }

    const renderEmptyChart = () => (
        <div className="flex items-center justify-center h-full text-sm text-gray-500">
            {mounted ? t("analytics.noData") : "No expense data available"}
        </div>
    );

    return (
        <div className="page-container">
            <div className="px-4 pt-4 pb-0 md:px-0 md:pt-0 mb-4">
                <h1 className="page-title">
                    {mounted ? t("nav.analytics") : "Analytics"}
                </h1>
                <p className="section-subtitle mt-0.5">
                    {mounted ? t("analytics.description") : "Detailed insights into your finances"}
                </p>
            </div>

            <PeriodSelector
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
            />

            <SpendingInsights insights={insights} />

            <AnalyticsSummaryCards
                countThisMonth={countThisMonth}
                averageTransaction={averageTransaction}
                biggestExpenseThisMonth={biggestExpenseThisMonth}
                mostUsedCategory={mostUsedCategory}
                baseCurrency={baseCurrency}
                mounted={mounted}
                t={t}
            />

            <div className="
                grid grid-cols-1 lg:grid-cols-2
                gap-4 lg:gap-6
                px-4 md:px-0
            ">
                {/* CHART 1: Income vs Expense by Month */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 lg:p-6 lg:col-span-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default animate-fadeIn">
                    <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white">{mounted ? t("analytics.incomeVsExpense") : "Income vs Expense"}</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5 mb-4">{mounted ? t("analytics.monthlyComparison") : "Monthly comparison"}</p>
                    <div className="h-48 lg:h-72 w-full">
                        {!mounted ? <div className="h-full w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart1And3Data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" vertical={false} />
                                <XAxis dataKey="monthYear" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                                <YAxis tickFormatter={formatYAxisShort} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} width={80} />
                                <Tooltip
                                    formatter={(value: unknown) => [formatCurrency(Number(value), baseCurrency), ""]}
                                    contentStyle={{ backgroundColor: "white", border: "none", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                                <Bar dataKey="income" name={incomeLabel} fill="#00C48C" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name={expenseLabel} fill="#FF5B5B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                        {mounted ? `${t("common.convertedTo")} ${baseCurrency}` : `Converted to ${baseCurrency}`}
                    </p>
                </div>

                {/* CHART 2: Expense by Category */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 lg:p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default animate-fadeIn">
                    <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white">{mounted ? t("analytics.expenseByCategory") : "Expense by Category"}</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5 mb-4">{mounted ? t("analytics.distributionSpending") : "Distribution of your spending"}</p>
                    <div className="h-56 lg:h-72 w-full">
                        {!mounted ? <div className="h-full w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" /> :
                        expensesByCategory.length === 0 ? renderEmptyChart() : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip
                                        formatter={(value: unknown) => [formatCurrency(Number(value), baseCurrency), ""]}
                                        contentStyle={{ backgroundColor: "white", border: "none", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
                                    />
                                    <Pie
                                        data={expensesByCategory}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius="80%"
                                        dataKey="amount"
                                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {expensesByCategory.map((entry: { name: string; color: string }, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                        {mounted ? `${t("common.convertedTo")} ${baseCurrency}` : `Converted to ${baseCurrency}`}
                    </p>
                </div>

                {/* CHART 4: Top 5 Expense Categories */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 lg:p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default animate-fadeIn">
                    <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white">{mounted ? t("analytics.topSpending") : "Top Spending"}</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5 mb-4">{mounted ? t("analytics.top5Categories") : "Your 5 highest expense categories"}</p>
                    <div className="h-48 lg:h-64 w-full">
                        {!mounted ? <div className="h-full w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" /> :
                        top5Expenses.length === 0 ? renderEmptyChart() : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top5Expenses} layout="vertical" margin={{ top: 10, right: 60, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" horizontal={false} vertical={false} />
                                    <XAxis type="number" tickFormatter={formatYAxisShort} tick={{ fontSize: 11, fill: "#6b7280" }} />
                                    <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                                    <Tooltip
                                        formatter={(value: unknown) => [formatCurrency(Number(value), baseCurrency), ""]}
                                        contentStyle={{ backgroundColor: "white", border: "none", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
                                    />
                                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                        {top5Expenses.map((entry: { color: string }, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                        <LabelList dataKey="amount" position="right" formatter={(val: unknown) => formatCurrency(Number(val), baseCurrency)} style={{ fontSize: 12, fill: "#6b7280" }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                        {mounted ? `${t("common.convertedTo")} ${baseCurrency}` : `Converted to ${baseCurrency}`}
                    </p>
                </div>

                {/* CHART 5: Budget vs Actual */}
                {budgetVsActualData.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 lg:p-6 lg:col-span-1 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default animate-fadeIn">
                        <h2 className="text-sm font-bold text-[#1A1A2E] dark:text-white">{mounted ? t("analytics.budgetVsActual") : "Budget vs Actual"}</h2>
                        <p className="text-xs text-[#6B7280] mt-0.5 mb-4">{mounted ? t("analytics.budgetVsActualDesc") : "How your spending compares to set limits"}</p>

                        <div className="h-48 lg:h-64">
                            {!mounted ? <div className="h-full w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={budgetVsActualData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={formatYAxisShort}
                                        tick={{ fontSize: 11, fill: "#6b7280" }}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={100}
                                        tick={{ fontSize: 12, fill: "#6b7280" }}
                                    />
                                    <Tooltip
                                        formatter={(value: unknown, name?: string): [string, string] => [
                                            formatCurrency(Number(value), baseCurrency),
                                            name === "budget" ? "Budget" : "Actual"
                                        ]}
                                        contentStyle={{ backgroundColor: "white", border: "none", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
                                    />
                                    <Legend />
                                    <Bar dataKey="budget" name="Budget" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]}>
                                        {budgetVsActualData.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={entry.percentage >= 100 ? "#FF5B5B" : entry.color}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            )}
                        </div>

                        {/* OVER BUDGET WARNING */}
                        {budgetVsActualData.some(d => d.percentage >= 100) && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-rose-500">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                    {budgetVsActualData.filter(d => d.percentage >= 100).length} {mounted ? t("budget.categories") : "categories"} {mounted ? t("analytics.overBudget") : "over budget"}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* CHART 3: 6 Month Trend */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 lg:p-6 lg:col-span-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default animate-fadeIn">
                    <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white">{mounted ? t("analytics.trend") : "6 Month Trend"}</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5 mb-4">{mounted ? t("analytics.incomeExpenseOverTime") : "Income and expense over time"}</p>
                    <div className="h-48 lg:h-64 w-full">
                        {!mounted ? <div className="h-full w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chart1And3Data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" vertical={false} />
                                <XAxis dataKey="monthShort" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                                <YAxis tickFormatter={formatYAxisShort} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} width={80} />
                                <Tooltip
                                    formatter={(value: unknown) => [formatCurrency(Number(value), baseCurrency), ""]}
                                    contentStyle={{ backgroundColor: "white", border: "none", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                                <Line type="monotone" dataKey="income" name={incomeLabel} stroke="#00C48C" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="expense" name={expenseLabel} stroke="#FF5B5B" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                        {mounted ? `${t("common.convertedTo")} ${baseCurrency}` : `Converted to ${baseCurrency}`}
                    </p>
                </div>
            </div>
        </div>
    );
}
