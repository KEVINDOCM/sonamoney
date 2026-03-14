"use client";

import { CategoryType } from "@/types";

interface TypeToggleProps {
  value: CategoryType;
  onChange: (value: CategoryType) => void;
  incomeLabel?: string;
  expenseLabel?: string;
}

export default function TypeToggle({
  value,
  onChange,
  incomeLabel = "Income",
  expenseLabel = "Expense",
}: TypeToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Type</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("income")}
          className={`flex-1 h-10 py-0 text-sm font-medium border rounded-xl transition-all duration-200 active:scale-95 ${value === "income"
            ? "bg-[#E6FAF4] text-[#00C48C] border-[#00C48C] font-semibold shadow-sm"
            : "bg-white dark:bg-gray-800 text-[#6B7280] dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
        >
          {incomeLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange("expense")}
          className={`flex-1 h-10 py-0 text-sm font-medium border rounded-xl transition-all duration-200 active:scale-95 ${value === "expense"
            ? "bg-[#FFF0F0] text-[#FF5B5B] border-[#FF5B5B] font-semibold shadow-sm"
            : "bg-white dark:bg-gray-800 text-[#6B7280] dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
        >
          {expenseLabel}
        </button>
      </div>
    </div>
  );
}
