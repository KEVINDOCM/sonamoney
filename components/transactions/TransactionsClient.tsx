"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Transaction, Category, Account, TransactionWithCategory } from "@/types";
import { Button } from "@/components/ui/Button";
import { CURRENCY_CONFIG, SUPPORTED_CURRENCIES, formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/formatDate";
import { EditTransactionModal } from "./EditTransactionModal";
import { DeleteTransactionModal } from "./DeleteTransactionModal";
import { NewTransactionModal } from "./NewTransactionModal";
import { useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { Search, SlidersHorizontal, X, Receipt, Repeat, Plus, CheckCircle, ChevronDown } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { createTransactionApi, updateTransactionApi, deleteTransactionApi } from "@/lib/api/transactions";
import { logRecurringTransaction, skipRecurringOccurrence, stopRecurring } from "@/lib/actions/transactions";
import PaginationControls from "./PaginationControls";
import TransactionTable from "./TransactionTable";
import TransactionCardList from "./TransactionCardList";
import { ExportTransactionsButtons } from "./ExportTransactionsButtons";

export interface TransactionsClientProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  total: number;
  page: number;
  pageSize: number;
}

function filterTransactions(
  transactions: Transaction[],
  searchQuery: string,
  filterType: string,
  filterCategory: string,
  filterDateFrom: string,
  filterDateTo: string,
  categoryMap: Map<string, string>
): Transaction[] {
  let result = transactions;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((t) => {
      const categoryName = categoryMap.get(t.category_id)?.toLowerCase() ?? "";
      const notes = t.notes?.toLowerCase() ?? "";
      return categoryName.includes(q) || notes.includes(q);
    });
  }

  if (filterType !== "all") {
    result = result.filter((t) => t.type === filterType);
  }

  if (filterCategory !== "all") {
    result = result.filter((t) => t.category_id === filterCategory);
  }

  if (filterDateFrom) {
    result = result.filter((t) => t.date >= filterDateFrom);
  }

  if (filterDateTo) {
    result = result.filter((t) => t.date <= filterDateTo);
  }

  return result;
}

function parsePayeeAndNotes(notes: string | null): { payee: string; notes: string } {
  if (!notes) return { payee: "", notes: "" }

  const payeeMatch = notes.match(/^Payee:\s*(.+?)(?:\s+Notes:\s*(.+))?$/)
  if (payeeMatch) {
    return {
      payee: payeeMatch[1]?.trim() ?? "",
      notes: payeeMatch[2]?.trim() ?? "",
    }
  }

  return { payee: "", notes: notes }
}

export function TransactionsClient({
  transactions: initialTransactions,
  categories,
  accounts,
  total,
  page,
  pageSize
}: TransactionsClientProps) {
  const { toast, toasts, removeToast } = useToast();
  const { t, mounted } = useTranslation();
  const { baseCurrency, convert, rates } = useCurrency();
  const [localTransactions, setLocalTransactions] = useState<TransactionWithCategory[]>(initialTransactions as TransactionWithCategory[]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTransactionMenuId, setActiveTransactionMenuId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const ITEMS_PER_PAGE = 20;
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync local transactions when prop changes
  useEffect(() => {
    setLocalTransactions(initialTransactions as TransactionWithCategory[]);
  }, [initialTransactions]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset visible count when filters or search change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, filterType, filterCategory, filterDateFrom, filterDateTo]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(
      localTransactions,
      debouncedSearch,
      filterType,
      filterCategory,
      filterDateFrom,
      filterDateTo,
      categoryMap
    ),
    [localTransactions, debouncedSearch, filterType, filterCategory, filterDateFrom, filterDateTo, categoryMap]
  );

  // Pagination logic
  const paginatedTransactions = useMemo(
    () => filteredTransactions.slice(0, visibleCount),
    [filteredTransactions, visibleCount]
  );
  const hasMore = filteredTransactions.length > visibleCount;
  const remaining = filteredTransactions.length - visibleCount;

  const activeFilterCount = [
    filterType !== "all",
    filterCategory !== "all",
    filterDateFrom !== "",
    filterDateTo !== "",
  ].filter(Boolean).length;

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setIsFilterOpen(false);
  }, []);

  // Handle log recurring transaction
  const handleLogRecurring = useCallback(async (parentId: string) => {
    const result = await logRecurringTransaction(parentId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("transactions.loggedSuccess"));
    }
  }, [toast, t]);

  const handleSkipRecurring = useCallback(
    async (parentId: string) => {
      const result = await skipRecurringOccurrence(parentId);
      if (result.success) {
        toast.success("Occurrence skipped");
      } else {
        toast.error(result.error ?? "Failed to skip");
      }
    },
    [toast]
  );

  const handleStopRecurring = useCallback(
    async (parentId: string) => {
      const result = await stopRecurring(parentId);
      if (result.success) {
        setLocalTransactions((prev) =>
          prev.map((t) =>
            t.id === parentId
              ? { ...t, is_recurring: false }
              : t
          )
        );
        toast.success("Recurring stopped");
      } else {
        toast.error(result.error ?? "Failed to stop");
      }
    },
    [toast]
  );

  const hasTransactions = filteredTransactions.length > 0;

  // Optimistic ADD handler
  const handleAddTransaction = async (data: {
    date: string;
    type: "income" | "expense";
    categoryId: string;
    amount: number;
    notes: string | null;
    is_recurring: boolean;
    recurring_interval: number | null;
    recurring_unit: string | null;
    recurring_next_date: string | null;
    account_id?: string | null;
    tax_rate?: number | null;
    commission_rate?: number | null;
    currency?: string;
  }) => {
    const tempId = "temp-" + Math.random().toString(36).slice(2);
    const category = categories.find(c => c.id === data.categoryId);
    
    // Get currency from form data or selected account (default to IDR)
    const selectedAccount = accounts.find(a => a.id === data.account_id);
    const txCurrency = data.currency ?? selectedAccount?.currency ?? "IDR";
    const rateAtTime = txCurrency === "USD" ? 1 : (rates[txCurrency] ?? 16000);
    
    const optimisticTx: TransactionWithCategory = {
      id: tempId,
      user_id: "",
      category_id: data.categoryId,
      account_id: data.account_id,
      type: data.type,
      amount: data.amount,
      date: data.date,
      notes: data.notes,
      created_at: new Date().toISOString(),
      is_recurring: data.is_recurring,
      recurring_interval: data.recurring_interval,
      recurring_unit: data.recurring_unit,
      recurring_next_date: data.recurring_next_date,
      recurring_parent_id: null,
      tax_rate: data.tax_rate,
      commission_rate: data.commission_rate,
      currency: txCurrency,
      exchange_rate_at_time: rateAtTime,
      categories: {
        name: category?.name ?? "",
        color: category?.color ?? "#6b7280",
        type: data.type,
        icon: category?.icon ?? null,
      }
    };

    // Optimistic update
    setLocalTransactions(prev => [optimisticTx, ...prev]);
    setIsAddOpen(false);
    setIsSubmitting(true);

    const result = await createTransactionApi({
      category_id: data.categoryId,
      amount: data.amount,
      type: data.type,
      date: data.date,
      notes: data.notes ?? undefined,
      is_recurring: data.is_recurring,
      recurring_interval: data.recurring_interval ?? undefined,
      recurring_unit: data.recurring_unit ?? undefined,
      recurring_next_date: data.recurring_next_date ?? undefined,
      account_id: data.account_id ?? undefined,
      tax_rate: data.tax_rate ?? undefined,
      commission_rate: data.commission_rate ?? undefined,
      currency: txCurrency,
      exchange_rate_at_time: rateAtTime,
    });

    setIsSubmitting(false);

    if (result.error) {
      // Revert on error
      setLocalTransactions(prev => prev.filter(t => t.id !== tempId));
      toast.error(typeof result.error === "string" ? result.error : t("common.error"));
      return { success: false, error: result.error };
    }

    toast.success(t("transactions.addedSuccess"));
    return { success: true };
  };

  // Optimistic EDIT handler
  const handleEditTransaction = async (data: {
    id: string;
    date: string;
    type: "income" | "expense";
    categoryId: string;
    amount: number;
    notes: string | null;
    currency?: string;
  }) => {
    const previousTransactions = localTransactions;
    const category = categories.find(c => c.id === data.categoryId);
    const existingTx = localTransactions.find(t => t.id === data.id);

    // Use currency from form data or preserve from existing transaction
    const txCurrency = data.currency ?? existingTx?.currency ?? "IDR";
    const rateAtTime = txCurrency === "USD" ? 1 : (rates[txCurrency] ?? 16000);

    // Optimistic update - use currency from form data
    setLocalTransactions(prev => prev.map(t =>
      t.id === data.id
        ? {
            ...t,
            category_id: data.categoryId,
            type: data.type,
            amount: data.amount,
            date: data.date,
            notes: data.notes,
            // Use currency from form data
            currency: txCurrency,
            exchange_rate_at_time: rateAtTime,
          }
        : t
    ));
    setIsEditOpen(false);
    setIsSubmitting(true);

    const result = await updateTransactionApi(data.id, {
      category_id: data.categoryId,
      amount: data.amount,
      type: data.type,
      date: data.date,
      notes: data.notes ?? undefined,
      // Use currency from form data
      currency: txCurrency,
      exchange_rate_at_time: rateAtTime,
    });

    setIsSubmitting(false);

    if (result.error || !result.success) {
      // Revert on error
      setLocalTransactions(previousTransactions);
      toast.error(typeof result.error === "string" ? result.error : t("common.error"));
      return { success: false, error: result.error };
    }

    toast.success(t("transactions.updatedSuccess"));
    return { success: true };
  };

  // Optimistic DELETE handler
  const handleDeleteTransaction = async (id: string) => {
    const previousTransactions = localTransactions;

    // Optimistic update
    setLocalTransactions(prev => prev.filter(t => t.id !== id));
    setIsDeleteOpen(false);
    setIsSubmitting(true);

    const result = await deleteTransactionApi(id);

    setIsSubmitting(false);

    if (result.error || !result.success) {
      // Revert on error
      setLocalTransactions(previousTransactions);
      toast.error(typeof result.error === "string" ? result.error : t("common.error"));
      return { success: false, error: result.error };
    }

    toast.success(t("transactions.deletedSuccess"));
    return { success: true };
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(page * pageSize, total);
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));

  const previousPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <div className="bg-[#F5F7FA] dark:bg-[#0F172A] min-h-screen pb-6 overflow-x-hidden">
      {/* Sticky Header - Enterprise Style */}
      <div className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 px-4 pt-4 pb-3 md:static md:px-0 md:pt-0">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="page-title">
              {mounted ? t("nav.transactions") : "Transactions"}
            </h1>
            <p className="section-subtitle mt-0.5">
              {mounted ? t("transactions.description") : "Manage your income and expenses"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportTransactionsButtons items={filteredTransactions} />
            {/* Desktop add button */}
            <div className="hidden md:block">
              <Button
                onClick={() => setIsAddOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                {mounted ? t("common.add") : "Add"}
              </Button>
            </div>
          </div>
        </div>

        {/* Search bar - Enterprise Style */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={mounted ? t("common.search") : "Search transactions..."}
            className="input-enterprise pl-11 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter chips - Enterprise Style */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {/* All chip */}
          <button
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "chip-active" : "chip-inactive"}
          >
            {mounted ? t("common.filter") : "All"}
          </button>

          {/* Income chip */}
          <button
            onClick={() => setFilterType("income")}
            className={filterType === "income" ? "chip-active" : "chip-inactive"}
          >
            {mounted ? t("transactions.income") : "Income"}
          </button>

          {/* Expense chip */}
          <button
            onClick={() => setFilterType("expense")}
            className={filterType === "expense" ? "chip-active" : "chip-inactive"}
          >
            {mounted ? t("transactions.expense") : "Expense"}
          </button>

          {/* Category chips */}
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(
                filterCategory === cat.id ? "all" : cat.id
              )}
              className={filterCategory === cat.id ? "chip-active" : "chip-inactive"}
            >
              {cat.name}
            </button>
          ))}

          {/* Advanced filter toggle */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`chip-inactive shrink-0 ${isFilterOpen ? "border-teal-500 text-teal-600" : ""}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
            {mounted ? t("common.filter") : "Filter"}
          </button>
        </div>
      </div>

      {/* Filter Panel with animation */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isFilterOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 mx-4 md:mx-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{mounted ? t("transactions.type") : "Type"}</label>
              <div className="flex gap-1">
                {["all", "income", "expense"].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type as "all" | "income" | "expense")}
                    className={`flex-1 h-8 rounded-lg text-xs font-medium capitalize transition-colors duration-200 ${
                      filterType === type
                        ? 'bg-gold-600 text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type === "all" ? (mounted ? t("transactions.all") : "All") : type === "income" ? (mounted ? t("transactions.income") : "Income") : (mounted ? t("transactions.expense") : "Expense")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">{mounted ? t("transactions.category") : "Category"}</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full h-8 border border-gray-200 dark:border-gray-700 rounded-lg text-xs px-2 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                title={mounted ? t("transactions.category") : "Filter by category"}
              >
                <option value="all">{mounted ? t("transactions.all") : "All"} {mounted ? t("transactions.category") : "categories"}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full h-8 border border-gray-200 dark:border-gray-700 rounded-lg text-xs px-2 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                title={mounted ? t("transactions.date") : "Filter from date"}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full h-8 border border-gray-200 dark:border-gray-700 rounded-lg text-xs px-2 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                title={mounted ? t("transactions.date") : "Filter to date"}
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                {mounted ? t("common.cancel") : "Reset"} {mounted ? t("common.filter") : "filters"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 px-0 md:px-0">
        {/* Desktop layout wrapper */}
        <div className="hidden lg:block mx-0 rounded-2xl shadow-sm">
          <TransactionTable
            transactions={paginatedTransactions}
            categories={categories}
            accounts={accounts}
            hasTransactions={hasTransactions}
            activeDropdownId={activeTransactionMenuId}
            categoryMap={categoryMap}
            accountMap={accountMap}
            baseCurrency={baseCurrency}
            convert={convert}
            onManageClick={(id) => setActiveTransactionMenuId(current => current === id ? null : id)}
            onEdit={(transaction) => {
              setSelectedTransaction(transaction);
              setIsEditOpen(true);
              setActiveTransactionMenuId(null);
            }}
            onDelete={(transaction) => {
              setSelectedTransaction(transaction);
              setIsDeleteOpen(true);
              setActiveTransactionMenuId(null);
            }}
            onCloseDropdown={() => setActiveTransactionMenuId(null)}
            onResetFilters={handleResetFilters}
            onLogRecurring={handleLogRecurring}
            onSkipRecurring={handleSkipRecurring}
            onStopRecurring={handleStopRecurring}
            dateLabel={mounted ? t("transactions.date") : "Date"}
            categoryLabel={mounted ? t("transactions.category") : "Category"}
            typeLabel={mounted ? t("transactions.type") : "Type"}
            amountLabel={mounted ? t("transactions.amount") : "Amount"}
            notesLabel={mounted ? t("transactions.notes") : "Notes"}
            actionsLabel={mounted ? t("common.manage") : "Actions"}
            incomeLabel={mounted ? t("transactions.income") : "Income"}
            expenseLabel={mounted ? t("transactions.expense") : "Expense"}
            manageLabel={mounted ? t("common.manage") : "Manage"}
            editLabel={mounted ? t("common.edit") : "Edit"}
            deleteLabel={mounted ? t("common.delete") : "Delete"}
            noResultsLabel={mounted ? t("transactions.noResults") : "No transactions found"}
            noResultsDescLabel={mounted ? t("transactions.noResults") : "Try adjusting your search or filters"}
            clearFiltersLabel={`${mounted ? t("common.cancel") : "Clear"} ${mounted ? t("common.filter") : "filters"}`}
          />
        </div>

        {/* Mobile layout */}
        <div className="block lg:hidden">
          <TransactionCardList
            transactions={paginatedTransactions}
            categories={categories}
            accounts={accounts}
            hasTransactions={hasTransactions}
            activeDropdownId={activeTransactionMenuId}
            categoryMap={categoryMap}
            accountMap={accountMap}
            baseCurrency={baseCurrency}
            convert={convert}
            onManageClick={(id) => setActiveTransactionMenuId(current => current === id ? null : id)}
            onEdit={(transaction) => {
              setSelectedTransaction(transaction);
              setIsEditOpen(true);
              setActiveTransactionMenuId(null);
            }}
            onDelete={(transaction) => {
              setSelectedTransaction(transaction);
              setIsDeleteOpen(true);
              setActiveTransactionMenuId(null);
            }}
            onCloseDropdown={() => setActiveTransactionMenuId(null)}
            onResetFilters={handleResetFilters}
            onLogRecurring={handleLogRecurring}
            onSkipRecurring={handleSkipRecurring}
            onStopRecurring={handleStopRecurring}
            incomeLabel={mounted ? t("transactions.income") : "Income"}
            expenseLabel={mounted ? t("transactions.expense") : "Expense"}
            manageLabel={mounted ? t("common.manage") : "Manage"}
            editLabel={mounted ? t("common.edit") : "Edit"}
            deleteLabel={mounted ? t("common.delete") : "Delete"}
            noResultsLabel={mounted ? t("transactions.noResults") : "No transactions found"}
            noResultsDescLabel={mounted ? t("transactions.noResults") : "Try adjusting your search or filters"}
            clearFiltersLabel={`${mounted ? t("common.cancel") : "Clear"} ${mounted ? t("common.filter") : "filters"}`}
          />
        </div>
      </div>

      <PaginationControls
        visibleCount={visibleCount}
        totalCount={filteredTransactions.length}
        hasMore={hasMore}
        remaining={remaining}
        itemsPerPage={ITEMS_PER_PAGE}
        onLoadMore={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
        loadMoreLabel={mounted ? t("transactions.loadMore") : "Load more"}
        showingLabel={mounted ? t("transactions.showing") : "Showing"}
        ofLabel={mounted ? t("transactions.of") : "of"}
        transactionsLabel={mounted ? t("transactions.title") : "transactions"}
        allLoadedLabel={mounted ? t("transactions.allLoaded") : "All transactions loaded"}
      />

      <div className="flex flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          {mounted ? t("transactions.showing") : "Showing"} {Math.min(visibleCount, filteredTransactions.length)} {mounted ? t("transactions.of") : "of"} {filteredTransactions.length} {mounted ? t("transactions.title") : "transactions"}
        </p>
        <div className="flex flex-row items-center justify-between w-full sm:w-auto gap-2">
          <Button
            variant="ghost"
            className="px-3"
            disabled={!previousPage}
          >
            {previousPage ? (
              <a href={`/transactions?page=${previousPage}`}>{mounted ? t("common.back") : "Previous"}</a>
            ) : (
              <span>{mounted ? t("common.back") : "Previous"}</span>
            )}
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {page} {mounted ? t("transactions.of") : "of"} {totalPages}
          </span>
          <Button
            variant="ghost"
            className="px-3"
            disabled={!nextPage}
          >
            {nextPage ? (
              <a href={`/transactions?page=${nextPage}`}>{mounted ? t("common.next") : "Next"}</a>
            ) : (
              <span>{mounted ? t("common.next") : "Next"}</span>
            )}
          </Button>
        </div>
      </div>

      <EditTransactionModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        transaction={selectedTransaction}
        categories={categories}
        onSubmit={handleEditTransaction}
        isLoading={isSubmitting}
      />

      <DeleteTransactionModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        transactionId={selectedTransaction?.id || null}
        onConfirm={handleDeleteTransaction}
        isLoading={isSubmitting}
      />

      <NewTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        categories={categories}
        accounts={accounts}
        onSubmit={handleAddTransaction}
        isLoading={isSubmitting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}