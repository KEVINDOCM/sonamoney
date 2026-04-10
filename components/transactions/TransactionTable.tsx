"use client";

import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/formatDate";
import type { Transaction, Category, Account } from "@/types";
import { Search, RefreshCw, CornerUpLeft, Pencil, Trash2, SkipForward, Square } from "lucide-react";
import { useState } from "react";

interface TransactionTableProps {
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
  dateLabel: string;
  categoryLabel: string;
  typeLabel: string;
  amountLabel: string;
  notesLabel: string;
  actionsLabel: string;
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

export default function TransactionTable({
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
  dateLabel,
  categoryLabel,
  typeLabel,
  amountLabel,
  notesLabel,
  actionsLabel,
  incomeLabel,
  expenseLabel,
  manageLabel,
  editLabel,
  deleteLabel,
  noResultsLabel,
  noResultsDescLabel,
  clearFiltersLabel,
}: TransactionTableProps) {
  const [tableDropdownPos, setTableDropdownPos] = useState<{ top: number; right: number } | null>(null);
  return (
    <div className="overflow-x-auto hidden lg:block bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
      <table id="transactions-table" className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
        <thead className="bg-[#F5F7FA] dark:bg-gray-800/50">
          <tr>
            <th className="px-3 py-3 lg:px-5 text-left text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
              {dateLabel}
            </th>
            <th className="px-3 py-3 lg:px-5 text-left text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
              {categoryLabel}
            </th>
            <th className="px-3 py-3 lg:px-5 text-left text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
              {typeLabel}
            </th>
            <th className="px-2 py-3 lg:px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">
              {amountLabel}
            </th>
            <th className="px-2 py-3 lg:px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">
              {notesLabel}
            </th>
            <th className="px-2 py-3 lg:px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {actionsLabel}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
          {hasTransactions ? (
            transactions.map((transaction: Transaction) => {
              const { payee, notes } = parsePayeeAndNotes(transaction.notes);
              return (
                <tr key={transaction.id} className={`hover:bg-[#F5F7FA] dark:hover:bg-gray-800/50 transition-colors duration-150 cursor-default min-h-12 border-b border-gray-50 dark:border-gray-800 ${activeDropdownId === transaction.id ? "relative z-50" : ""}`}>
                  <td className="px-2 py-3 lg:px-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatShortDate(transaction.date)}
                  </td>
                  <td className="px-2 py-3 lg:px-4">
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        icon={categories.find(c => c.id === transaction.category_id)?.icon}
                        color={categories.find(c => c.id === transaction.category_id)?.color}
                        size="sm"
                      />
                      <div>
                        <span className="text-sm font-semibold text-[#1A1A2E] dark:text-white">{categoryMap.get(transaction.category_id) ?? "-"}</span>
                        {transaction.is_recurring && (
                          <span className="
                            ml-1 text-[10px] font-semibold
                            bg-[#E6F7F6] text-[#00B9A7]
                            px-1.5 py-0.5 rounded-full
                            inline-flex items-center gap-0.5
                          ">
                            <RefreshCw className="w-3 h-3" />
                          </span>
                        )}
                        {transaction.recurring_parent_id && (
                          <span className="
                            ml-1 text-[10px] font-semibold
                            bg-[#F0EFFE] text-[#6366F1]
                            px-1.5 py-0.5 rounded-full
                            inline-flex items-center gap-0.5
                          ">
                            <CornerUpLeft className="w-3 h-3" />
                          </span>
                        )}
                        {transaction.account_id && accountMap.get(transaction.account_id) && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 block">{accountMap.get(transaction.account_id)}</span>
                        )}
                        {payee && !transaction.account_id && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 block">{payee}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 lg:px-4 text-sm text-gray-700 dark:text-gray-300">
                    <span
                      className={
                        transaction.type === "income"
                          ? "bg-[#E6FAF4] text-[#00C48C] text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                          : "bg-[#FFF0F0] text-[#FF5B5B] text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                      }
                    >
                      {transaction.type === "income" ? incomeLabel : expenseLabel}
                    </span>
                  </td>
                  <td className="px-2 py-3 lg:px-4 text-sm text-gray-700 dark:text-gray-300 text-right hidden lg:table-cell">
                    <div>
                      <span
                        className={
                          transaction.type === "income"
                            ? "text-[#00C48C] font-bold"
                            : "text-[#FF5B5B] font-bold"
                        }
                      >
                        {transaction.type === "income" ? "+" : "-"}{" "}
                        {formatCurrency(transaction.amount, transaction.currency ?? "IDR")}
                      </span>
                      {transaction.currency && transaction.currency !== baseCurrency && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          ≈ {formatCurrency(convert(transaction.amount, transaction.currency, baseCurrency), baseCurrency)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 lg:px-4 text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell capitalize truncate max-w-xs">
                    {notes || "-"}
                  </td>
                  <td className="px-2 py-3 lg:px-4 text-sm text-gray-700 dark:text-gray-300 text-right relative">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        className="px-3 h-8 text-xs lg:text-sm font-medium relative z-20"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const spaceBelow = window.innerHeight - rect.bottom;
                          const dropdownHeight = 96;
                          setTableDropdownPos({
                            top: spaceBelow > dropdownHeight
                              ? rect.bottom + 4
                              : rect.top - dropdownHeight - 4,
                            right: window.innerWidth - rect.right,
                          });
                          onManageClick(transaction.id);
                        }}
                        aria-label={`${manageLabel} ${categoryMap.get(transaction.category_id) ?? "transaction"}`}
                      >
                        {manageLabel}
                      </Button>

                      {activeDropdownId === transaction.id && tableDropdownPos && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => {
                              onCloseDropdown();
                              setTableDropdownPos(null);
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
                              top: tableDropdownPos.top,
                              right: tableDropdownPos.right,
                            }}
                          >
                            <button
                              onClick={() => {
                                onEdit(transaction);
                                onCloseDropdown();
                                setTableDropdownPos(null);
                              }}
                              className="
                                w-full text-left px-4 py-3
                                text-sm font-medium
                                text-[#1A1A2E] dark:text-gray-300
                                hover:bg-gray-50 dark:hover:bg-gray-800
                                flex items-center gap-3
                                transition-colors
                                border-none bg-transparent cursor-pointer
                              "
                            >
                              <Pencil className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              {editLabel}
                            </button>
                            {transaction.is_recurring && (
                              <>
                                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-3"/>
                                {/* Log now */}
                                <button
                                  onClick={() => {
                                    onLogRecurring?.(transaction.id);
                                    onCloseDropdown();
                                    setTableDropdownPos(null);
                                  }}
                                  className="
                                    w-full text-left px-4 py-2.5
                                    text-sm font-medium
                                    text-[#00B9A7]
                                    hover:bg-[#E6F7F6]
                                    dark:hover:bg-[#00B9A7]/10
                                    flex items-center gap-2
                                    transition-colors
                                    border-none bg-transparent cursor-pointer
                                  "
                                >
                                  <RefreshCw className="w-4 h-4" /> Log now
                                </button>
                                {/* Skip */}
                                <button
                                  onClick={() => {
                                    onSkipRecurring?.(transaction.id);
                                    onCloseDropdown();
                                    setTableDropdownPos(null);
                                  }}
                                  className="
                                    w-full text-left px-4 py-2.5
                                    text-sm font-medium
                                    text-[#FFB800]
                                    hover:bg-[#FFF8E6]
                                    dark:hover:bg-yellow-900/20
                                    flex items-center gap-2
                                    transition-colors
                                    border-none bg-transparent cursor-pointer
                                  "
                                >
                                  <SkipForward className="w-4 h-4" /> Skip this month
                                </button>
                                {/* Stop recurring */}
                                <button
                                  onClick={() => {
                                    onStopRecurring?.(transaction.id);
                                    onCloseDropdown();
                                    setTableDropdownPos(null);
                                  }}
                                  className="
                                    w-full text-left px-4 py-2.5
                                    text-sm font-medium
                                    text-[#FF5B5B]
                                    hover:bg-[#FFF0F0]
                                    dark:hover:bg-rose-900/20
                                    flex items-center gap-2
                                    transition-colors
                                    border-none bg-transparent cursor-pointer
                                  "
                                >
                                  <Square className="w-4 h-4" /> Stop recurring
                                </button>
                              </>
                            )}
                            <div className="h-px bg-gray-100 dark:bg-gray-800 mx-3"/>
                            <button
                              onClick={() => {
                                onDelete(transaction);
                                onCloseDropdown();
                                setTableDropdownPos(null);
                              }}
                              className="
                                w-full text-left px-4 py-3
                                text-sm font-medium
                                text-[#FF5B5B]
                                hover:bg-[#FFF0F0]
                                dark:hover:bg-rose-900/20
                                flex items-center gap-3
                                transition-colors
                                border-none bg-transparent cursor-pointer
                              "
                            >
                              <Trash2 className="w-4 h-4 text-rose-400" />
                              {deleteLabel}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-12">
                <Search className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{noResultsLabel}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{noResultsDescLabel}</p>
                <button onClick={onResetFilters} className="mt-3 text-xs text-[#00B9A7] hover:text-[#0099A0] font-medium">
                  {clearFiltersLabel}
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
