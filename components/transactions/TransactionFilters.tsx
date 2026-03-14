"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/types";

interface TransactionFiltersProps {
  // State values (read only in this component)
  searchQuery: string;
  filterType: string;
  filterCategory: string;
  filterDateFrom: string;
  filterDateTo: string;
  categories: Category[];
  isFilterOpen: boolean;
  activeFilterCount: number;
  // Pre-translated labels
  searchPlaceholder: string;
  filterLabel: string;
  allLabel: string;
  incomeLabel: string;
  expenseLabel: string;
  categoryLabel: string;
  fromLabel: string;
  toLabel: string;
  resetFiltersLabel: string;
  // Handlers (callbacks to parent)
  onSearchChange: (value: string) => void;
  onTypeChange: (value: "all" | "income" | "expense") => void;
  onCategoryChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onToggleFilter: () => void;
  onReset: () => void;
  onClearSearch: () => void;
}

export default function TransactionFilters({
  searchQuery,
  filterType,
  filterCategory,
  filterDateFrom,
  filterDateTo,
  categories,
  isFilterOpen,
  activeFilterCount,
  searchPlaceholder,
  filterLabel,
  allLabel,
  incomeLabel,
  expenseLabel,
  categoryLabel,
  fromLabel,
  toLabel,
  resetFiltersLabel,
  onSearchChange,
  onTypeChange,
  onCategoryChange,
  onDateFromChange,
  onDateToChange,
  onToggleFilter,
  onReset,
  onClearSearch,
}: TransactionFiltersProps) {
  return (
    <>
      {/* Search Bar - Mobile Optimized */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 h-10 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              title="Clear search"
            >
              <X className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={onToggleFilter}
          className={`w-auto flex items-center justify-center gap-2 px-3 h-10 rounded-lg border text-sm font-medium transition-colors duration-200 ${
            activeFilterCount > 0
              ? 'bg-gold-50 dark:bg-gold-900/30 border-gold-200 dark:border-gold-800 text-gold-600 dark:text-gold-400'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          title={filterLabel}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden lg:inline">{filterLabel}</span>
          {activeFilterCount > 0 && (
            <span className="bg-gold-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel with animation */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isFilterOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{categoryLabel}</label>
              <div className="flex gap-1">
                {["all", "income", "expense"].map(type => (
                  <button
                    key={type}
                    onClick={() => onTypeChange(type as "all" | "income" | "expense")}
                    className={`flex-1 h-8 rounded-lg text-xs font-medium capitalize transition-colors duration-200 ${
                      filterType === type
                        ? 'bg-gold-600 text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type === "all" ? allLabel : type === "income" ? incomeLabel : expenseLabel}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{categoryLabel}</label>
              <select
                value={filterCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full h-8 border border-gray-200 dark:border-gray-700 rounded-lg text-xs px-2 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                title={categoryLabel}
              >
                <option value="all">{allLabel} {categoryLabel}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{fromLabel}</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="w-full h-8 border border-gray-200 dark:border-gray-700 rounded-lg text-xs px-2 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                title={fromLabel}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{toLabel}</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="w-full h-8 border border-gray-200 dark:border-gray-700 rounded-lg text-xs px-2 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                title={toLabel}
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={onReset}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                {resetFiltersLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
