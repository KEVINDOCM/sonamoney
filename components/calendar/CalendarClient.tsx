"use client";

import { useState, useMemo, useCallback } from "react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Transaction, TransactionWithCategory } from "@/types";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CalendarClientProps {
  transactions: TransactionWithCategory[];
}

interface DayData {
  totalIncome: number;
  totalExpense: number;
  transactions: TransactionWithCategory[];
  hasIncome: boolean;
  hasExpense: boolean;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildDayMap(transactions: TransactionWithCategory[]): Map<string, DayData> {
  const map = new Map<string, DayData>();
  transactions.forEach((t) => {
    const existing = map.get(t.date) ?? {
      totalIncome: 0,
      totalExpense: 0,
      transactions: [] as TransactionWithCategory[],
      hasIncome: false,
      hasExpense: false,
    };
    if (t.type === "income") {
      existing.totalIncome += t.amount;
      existing.hasIncome = true;
    } else {
      existing.totalExpense += t.amount;
      existing.hasExpense = true;
    }
    existing.transactions.push(t);
    map.set(t.date, existing);
  });
  return map;
}

export function CalendarClient({ transactions }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { t, mounted } = useTranslation();

  const DAY_NAMES = [
    mounted ? t("calendar.daySun") : "Sun",
    mounted ? t("calendar.dayMon") : "Mon",
    mounted ? t("calendar.dayTue") : "Tue",
    mounted ? t("calendar.dayWed") : "Wed",
    mounted ? t("calendar.dayThu") : "Thu",
    mounted ? t("calendar.dayFri") : "Fri",
    mounted ? t("calendar.daySat") : "Sat",
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfMonth(year, month), [year, month]);
  const dayMap = useMemo(() => buildDayMap(transactions), [transactions]);
  const today = new Date().toISOString().slice(0, 10);

  const selectedDayData = useMemo(
    () => selectedDate ? dayMap.get(selectedDate) : null,
    [selectedDate, dayMap]
  );

  const handlePrevMonth = useCallback(
    () => setCurrentDate(new Date(year, month - 1, 1)),
    [year, month]
  );
  const handleNextMonth = useCallback(
    () => setCurrentDate(new Date(year, month + 1, 1)),
    [year, month]
  );
  const handleGoToToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().slice(0, 10));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{mounted ? t("calendar.title") : "Calendar"}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {mounted ? t("calendar.description") : "View your transactions by date."}
          </p>
        </div>
        <button
          onClick={handleGoToToday}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {mounted ? t("calendar.today") : "Today"}
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          aria-label={mounted ? t("calendar.prevMonth") : "Previous month"}
          className="h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>

        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>

        <button
          onClick={handleNextMonth}
          aria-label={mounted ? t("calendar.nextMonth") : "Next month"}
          className="h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 lg:h-20" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = formatDateKey(year, month, day);
            const dayData = dayMap.get(dateKey);
            const isToday = dateKey === today;
            const isSelected = dateKey === selectedDate;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                aria-pressed={isSelected ? true : undefined}
                aria-label={new Date(year, month, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                className={`h-16 lg:h-20 rounded-xl p-1.5 flex flex-col items-start transition-all duration-200 text-left w-full ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                    : isToday
                    ? "bg-blue-600 border border-blue-600"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                }`}
              >
                {/* Day Number */}
                <span
                  className={`text-xs font-semibold mb-1 ${
                    isToday
                      ? "text-white"
                      : isSelected
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {day}
                </span>

                {/* Dot Indicators */}
                {dayData && (
                  <div className="flex gap-0.5 mb-0.5">
                    {dayData.hasIncome && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                    {dayData.hasExpense && (
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    )}
                  </div>
                )}

                {/* Total Amounts (desktop only) */}
                {dayData && (
                  <div className="hidden lg:flex flex-col gap-0.5 w-full">
                    {dayData.hasIncome && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                        +{formatCurrency(dayData.totalIncome)}
                      </span>
                    )}
                    {dayData.hasExpense && (
                      <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium truncate">
                        -{formatCurrency(dayData.totalExpense)}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{mounted ? t("calendar.income") : "Income"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-rose-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{mounted ? t("calendar.expense") : "Expense"}</span>
        </div>
      </div>

      {/* Selected Day Panel */}
      {selectedDate && (
        <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              aria-label={mounted ? t("common.close") : "Close"}
              title={mounted ? t("common.close") : "Close"}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* No Transactions */}
          {!selectedDayData && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              {mounted ? t("calendar.noTransactions") : "No transactions on this day"}
            </p>
          )}

          {/* Transactions List */}
          {selectedDayData && (
            <>
              {/* Summary Row */}
              <div className="flex gap-3 mb-4">
                {selectedDayData.hasIncome && (
                  <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">{mounted ? t("calendar.income") : "Income"}</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      +{formatCurrency(selectedDayData.totalIncome)}
                    </p>
                  </div>
                )}
                {selectedDayData.hasExpense && (
                  <div className="flex-1 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3">
                    <p className="text-xs text-rose-500 dark:text-rose-400 mb-0.5">{mounted ? t("calendar.expense") : "Expense"}</p>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      -{formatCurrency(selectedDayData.totalExpense)}
                    </p>
                  </div>
                )}
              </div>

              {/* Transaction Items */}
              <div className="space-y-2">
                {selectedDayData.transactions.map((tx: TransactionWithCategory) => {
                  const icon = tx.categories?.icon;
                  const color = tx.categories?.color ?? "#6b7280";
                  const name = tx.categories?.name ?? "Unknown";
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          // eslint-disable-next-line react/forbid-component-props
                          style={icon ? {} : { backgroundColor: color + "20" }}
                        >
                          {icon ? (
                            <span className="text-base">{icon}</span>
                          ) : (
                            // eslint-disable-next-line react/forbid-component-props
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                          {tx.notes && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">{tx.notes}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          tx.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500 dark:text-rose-400"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
