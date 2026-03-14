"use client";

import type { TransferWithAccounts, Account } from "@/types";
import { formatCurrency } from "@/lib/utils/currency";
import { ArrowLeftRight, Trash2 } from "lucide-react";

interface TransferHistoryListProps {
  transfers: TransferWithAccounts[];
  accounts: Account[];
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  mounted: boolean;
  t: (key: string) => string;
}

export function TransferHistoryList({
  transfers,
  accounts,
  onDelete,
  mounted,
  t,
}: TransferHistoryListProps) {
  if (transfers.length === 0) return null;

  return (
    <div className="mt-6 px-4 md:px-0">
      <h2 className="text-sm font-bold text-[#1A1A2E] dark:text-white mb-3 flex items-center gap-2">
        <ArrowLeftRight className="h-4 w-4 text-[#00B9A7]" />
        {mounted ? t("accounts.recentTransfers") : "Recent Transfers"}
      </h2>
      <div className="space-y-2 stagger-children">
        {transfers.map(transfer => {
          const fromAccount = accounts.find(a => a.id === transfer.from_account_id);
          return (
            <div key={transfer.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#E6F7F6] dark:bg-[#00B9A7]/20 flex items-center justify-center">
                  <ArrowLeftRight className="h-4 w-4 text-[#00B9A7]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
                    {transfer.from_account?.icon} {transfer.from_account?.name}
                    {" → "}
                    {transfer.to_account?.icon} {transfer.to_account?.name}
                  </p>
                  <p className="text-xs text-[#6B7280] dark:text-gray-400">
                    {transfer.date}
                    {transfer.notes && ` · ${transfer.notes}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#00B9A7]">
                  {formatCurrency(transfer.amount, fromAccount?.currency ?? "USD")}
                </span>
                <button
                  onClick={() => onDelete(transfer.id)}
                  title={mounted ? t("common.delete") : "Delete transfer"}
                  className="p-1.5 rounded-lg hover:bg-[#FFF0F0] dark:hover:bg-rose-900/20 text-gray-300 dark:text-gray-600 hover:text-[#FF5B5B] transition-all duration-200 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
