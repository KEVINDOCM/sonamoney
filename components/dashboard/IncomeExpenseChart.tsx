"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "@/lib/recharts-config";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCurrency } from "@/lib/hooks/useCurrency";
import type { DashboardSeriesPoint } from "@/lib/actions/transactions";
import { formatShortDate } from "@/lib/utils/formatDate";

export interface IncomeExpenseChartProps {
  data: DashboardSeriesPoint[];
}

interface ChartDatum {
  dateLabel: string;
  income: number;
  expense: number;
}

function formatSeries(points: DashboardSeriesPoint[]): ChartDatum[] {
  return points.map((point) => ({
    dateLabel: formatShortDate(point.date),
    income: point.income,
    expense: point.expense,
  }));
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const { t, mounted } = useTranslation();
  const { baseCurrency } = useCurrency();

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {mounted ? t("analytics.noDataDesc") : "No data available yet. Add some transactions to see your income and expenses over time."}
      </p>
    );
  }

  const chartData = formatSeries(data);

  const formatYAxis = (value: number): string => {
    if (baseCurrency === "IDR") {
      if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
      if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
      return `Rp ${value}`;
    }
    // USD format
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value}`;
  };

  return (
    <div className="w-full h-48 lg:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            fontSize={10}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            width={60}
            fontSize={10}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            wrapperClassName="bg-white border border-gray-200 rounded-lg shadow-sm text-sm"
          />
          <div className="hidden lg:block">
            <Legend verticalAlign="bottom" layout="horizontal" />
          </div>
          <Bar dataKey="income" name={mounted ? t("transactions.income") : "Income"} fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name={mounted ? t("transactions.expense") : "Expense"} fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

