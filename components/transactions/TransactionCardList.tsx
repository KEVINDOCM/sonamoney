"use client";

import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/formatDate";
import type { Transaction, Category, Account } from "@/types";
import { Search } from "lucide-react";
import { useState } from "react";

interface TransactionCardListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  hasTransactions: boolean;
  activeDropdownId: string | null;
  categoryMap: Map<string, string>;
  accountMap: Map<string, string>;
  baseCurrency: string;
  convert: (amount: number, from: string, to: string) => number;
  onManageClick: (transactionId: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onCloseDropdown: () => void;
  onResetFilters: () => void;
  // Recurring handlers
  onLogRecurring?: (id: string) => void;
  onSkipRecurring?: (id: string) => void;
  onStopRecurring?: (id: string) => void;
  // Pre-translated labels
  incomeLabel: string;
  expenseLabel: string;
  manageLabel: string;
  editLabel: string;
  deleteLabel: string;
  noResultsLabel: string;
  noResultsDescLabel: string;
  clearFiltersLabel: string;
}

function parsePayeeAndNotes(notes: string | null): { payee: string; notes: string } {
  if (!notes) return { payee: "", notes: "" };

  const payeeMatch = notes.match(/^Payee:\s*(.+?)(?:\s+Notes:\s*(.+))?$/);
  if (payeeMatch) {
    return {
      payee: payeeMatch[1]?.trim() ?? "",
      notes: payeeMatch[2]?.trim() ?? "",
    };
  }

  return { payee: "", notes: notes };
}

export default function TransactionCardList({
  transactions,
  categories,
  accounts,
  hasTransactions,
  activeDropdownId,
  categoryMap,
  accountMap,
  baseCurrency,
  convert,
  onManageClick,
  onEdit,
  onDelete,
  onCloseDropdown,
  onResetFilters,
  onLogRecurring,
  onSkipRecurring,
  onStopRecurring,
  incomeLabel,
  expenseLabel,
  manageLabel,
  editLabel,
  deleteLabel,
  noResultsLabel,
  noResultsDescLabel,
  clearFiltersLabel,
}: TransactionCardListProps) {
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  // Group transactions by date
  const groupedTransactions = transactions.reduce<Record<string, typeof transactions>>(
    (groups, transaction) => {
      const date = transaction.date.split("T")[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {}
  );

  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  function formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split("T")[0]) {
      return "Hari ini";
    }
    if (dateStr === yesterday.toISOString().split("T")[0]) {
      return "Kemarin";
    }
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div className="block lg:hidden">
      {!hasTransactions ? (
        /* Empty / No results state */
        <div className="
          mx-4 bg-white dark:bg-gray-900
          rounded-2xl shadow-sm
          flex flex-col items-center
          justify-center py-12 px-4 text-center
        ">
          <span className="text-4xl mb-3">🔍</span>
          <p className="
            text-sm font-semibold
            text-[#1A1A2E] dark:text-white
          ">
            {noResultsLabel}
          </p>
          <p className="
            text-xs text-[#6B7280] mt-1
          ">
            {noResultsDescLabel}
          </p>
          <button
            onClick={onResetFilters}
            className="
              mt-4 text-xs font-semibold
              text-[#00B9A7] hover:text-[#0099A0]
              transition-colors
            "
          >
            {clearFiltersLabel}
          </button>
        </div>
      ) : (
        /* Grouped transaction list */
        <div className="space-y-0">
          {sortedDates.map((dateStr) => (
            <div key={dateStr}>
              {/* Sticky date header */}
              <div className="
                sticky top-[108px] z-[5]
                bg-[#F5F7FA] dark:bg-[#0F172A]
                px-4 py-2
              ">
                <span className="
                  text-[11px] font-bold
                  text-[#6B7280] dark:text-gray-400
                  uppercase tracking-wider
                ">
                  {formatDateHeader(dateStr)}
                </span>
              </div>

              {/* Transaction cards for this date */}
              <div className="px-4 space-y-2 pb-2">
                {groupedTransactions[dateStr].map(
                  (transaction, index) => {
                    const categoryName =
                      categoryMap.get(transaction.category_id) ?? "—";
                    const accountName = transaction.account_id
                      ? accountMap.get(transaction.account_id)
                      : null;
                    const isIncome = transaction.type === "income";
                    const convertedAmount = convert(
                      transaction.amount,
                      transaction.currency ?? baseCurrency,
                      baseCurrency
                    );
                    const isLastInGroup =
                      index ===
                      groupedTransactions[dateStr].length - 1;

                    return (
                      <div
                        key={transaction.id}
                        className={`
                          bg-white dark:bg-gray-900
                          rounded-2xl shadow-sm
                          hover:shadow-md
                          hover:-translate-y-0.5
                          transition-all duration-200
                          animate-slideUp
                          ${activeDropdownId === transaction.id ? "relative z-50" : ""}
                        `}
                      >
                        <div className="
                          flex items-center gap-3 p-4
                        ">
                          {/* Category icon */}
                          <div className="
                            w-10 h-10 rounded-xl shrink-0
                            flex items-center justify-center
                            text-lg
                            bg-[#F5F7FA] dark:bg-gray-800
                          ">
                            {categoryName.charAt(0)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="
                              text-sm font-semibold
                              text-[#1A1A2E] dark:text-white
                              truncate
                            ">
                              {categoryName}
                            </p>
                            <div className="
                              flex items-center gap-2 mt-0.5
                              flex-wrap
                            ">
                              {accountName && (
                                <span className="
                                  text-[10px]
                                  text-[#6B7280] dark:text-gray-400
                                ">
                                  {accountName}
                                </span>
                              )}
                              {transaction.notes && (
                                <span className="
                                  text-[10px]
                                  text-[#6B7280] dark:text-gray-400
                                  truncate
                                ">
                                  {transaction.notes}
                                </span>
                              )}
                              {transaction.is_recurring && (
                                <span className="
                                  text-[10px] font-semibold
                                  bg-[#E6F7F6] text-[#00B9A7]
                                  dark:bg-[#00B9A7]/20
                                  px-2 py-0.5 rounded-full
                                  flex items-center gap-0.5
                                  shrink-0
                                ">
                                  🔄 Recurring
                                </span>
                              )}
                              {transaction.recurring_parent_id && (
                                <span className="
                                  text-[10px] font-semibold
                                  bg-[#F0EFFE] text-[#6366F1]
                                  dark:bg-[#6366F1]/20
                                  px-2 py-0.5 rounded-full
                                  flex items-center gap-0.5
                                  shrink-0
                                ">
                                  ↩ Auto
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Amount + badge */}
                          <div className="
                            text-right shrink-0
                            flex flex-col items-end gap-1
                          ">
                            <p className={`
                              text-sm font-bold
                              ${isIncome
                                ? "text-[#00C48C]"
                                : "text-[#FF5B5B]"
                              }
                            `}>
                              {isIncome ? "+" : "-"}
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: baseCurrency,
                                maximumFractionDigits: 0,
                              }).format(convertedAmount)}
                            </p>
                            <span className={`
                              text-[10px] font-semibold
                              px-2 py-0.5 rounded-full
                              ${isIncome
                                ? "bg-[#E6FAF4] text-[#00C48C]"
                                : "bg-[#FFF0F0] text-[#FF5B5B]"
                              }
                            `}>
                              {isIncome ? incomeLabel : expenseLabel}
                          </span>
                        </div>

                        <div className="relative shrink-0 ml-1">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const dropdownHeight = 96;
                              setDropdownPos({
                                top: spaceBelow > dropdownHeight
                                  ? rect.bottom + 4
                                  : rect.top - dropdownHeight - 4,
                                right: window.innerWidth - rect.right,
                              });
                              onManageClick(transaction.id);
                            }}
                            className="
                              w-8 h-8 rounded-lg
                              flex items-center justify-center
                              text-[#6B7280] dark:text-gray-400
                              hover:bg-gray-100 dark:hover:bg-gray-800
                              transition-colors duration-150
                            "
                          >
                            ⋯
                          </button>

                          {activeDropdownId === transaction.id && dropdownPos && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => {
                                  onCloseDropdown();
                                  setDropdownPos(null);
                                }}
                              />
                              <div
                                className="
                                  fixed z-[60]
                                  bg-white dark:bg-gray-900
                                  rounded-2xl shadow-xl
                                  border border-gray-100
                                  dark:border-gray-800
                                  py-2 min-w-[160px]
                                  animate-scaleIn
                                "
                                style={{
                                  top: dropdownPos.top,
                                  right: dropdownPos.right,
                                }}
                              >
                                <button
                                  onClick={() => {
                                    onEdit(transaction);
                                    onCloseDropdown();
                                    setDropdownPos(null);
                                  }}
                                  className="
                                    w-full text-left px-4 py-3
                                    text-sm font-medium
                                    text-[#1A1A2E] dark:text-gray-300
                                    hover:bg-gray-50 dark:hover:bg-gray-800
                                    flex items-center gap-3
                                    transition-colors
                                  "
                                >
                                  <span>✏️</span>
                                  {editLabel}
                                </button>
                                {transaction.is_recurring && (
                                  <>
                                    <div className="
                                      h-px bg-gray-100 dark:bg-gray-800 mx-3
                                    "/>
                                    {/* Log now */}
                                    <button
                                      onClick={() => {
                                        onLogRecurring?.(transaction.id);
                                        onCloseDropdown();
                                        setDropdownPos(null);
                                      }}
                                      className="
                                        w-full text-left px-4 py-2.5
                                        text-sm font-medium
                                        text-[#00B9A7]
                                        hover:bg-[#E6F7F6]
                                        dark:hover:bg-[#00B9A7]/10
                                        flex items-center gap-2
                                        transition-colors
                                      "
                                    >
                                      🔄 Log now
                                    </button>
                                    {/* Skip */}
                                    <button
                                      onClick={() => {
                                        onSkipRecurring?.(transaction.id);
                                        onCloseDropdown();
                                        setDropdownPos(null);
                                      }}
                                      className="
                                        w-full text-left px-4 py-2.5
                                        text-sm font-medium
                                        text-[#FFB800]
                                        hover:bg-[#FFF8E6]
                                        dark:hover:bg-yellow-900/20
                                        flex items-center gap-2
                                        transition-colors
                                      "
                                    >
                                      ⏭ Skip this month
                                    </button>
                                    {/* Stop recurring */}
                                    <button
                                      onClick={() => {
                                        onStopRecurring?.(transaction.id);
                                        onCloseDropdown();
                                        setDropdownPos(null);
                                      }}
                                      className="
                                        w-full text-left px-4 py-2.5
                                        text-sm font-medium
                                        text-[#FF5B5B]
                                        hover:bg-[#FFF0F0]
                                        dark:hover:bg-rose-900/20
                                        flex items-center gap-2
                                        transition-colors
                                      "
                                    >
                                      ⏹ Stop recurring
                                    </button>
                                  </>
                                )}
                                <div className="
                                  h-px bg-gray-100 dark:bg-gray-800
                                  mx-3
                                "/>
                                <button
                                  onClick={() => {
                                    onDelete(transaction);
                                    onCloseDropdown();
                                    setDropdownPos(null);
                                  }}
                                  className="
                                    w-full text-left px-4 py-3
                                    text-sm font-medium
                                    text-[#FF5B5B]
                                    hover:bg-[#FFF0F0]
                                    dark:hover:bg-rose-900/20
                                    flex items-center gap-3
                                    transition-colors
                                  "
                                >
                                  <span>🗑️</span>
                                  {deleteLabel}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
