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
        {transfers.map((transfer) => {
          const fromAccount = accounts.find(
            (a) => a.id === transfer.from_account_id
          )
          const toAccount = accounts.find(
            (a) => a.id === transfer.to_account_id
          )

          const fromCurrency =
            transfer.from_currency ??
            fromAccount?.currency ??
            "IDR"
          const toCurrency =
            transfer.to_currency ??
            toAccount?.currency ??
            "IDR"
          const isCrossCurrency =
            fromCurrency !== toCurrency

          const formattedDate = new Date(
            transfer.date
          ).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })

          return (
            <div
              key={transfer.id}
              className="
                flex items-center justify-between
                p-4 bg-white dark:bg-gray-900
                rounded-2xl shadow-sm
                hover:shadow-md
                hover:-translate-y-0.5
                transition-all duration-200
              "
            >
              {/* Left */}
              <div className="flex items-center gap-3">
                <div className="
                  h-9 w-9 rounded-xl shrink-0
                  bg-[#E6F7F6] dark:bg-[#00B9A7]/20
                  flex items-center justify-center
                ">
                  <ArrowLeftRight className="
                    h-4 w-4 text-[#00B9A7]
                  "/>
                </div>
                <div>
                  <p className="
                    text-sm font-semibold
                    text-[#1A1A2E] dark:text-white
                  ">
                    <span>{transfer.from_account?.icon} </span>
                    <span>{transfer.from_account?.name}</span>
                    <span className="
                      text-[#6B7280] mx-1
                    "> → </span>
                    <span>{transfer.to_account?.icon} </span>
                    <span>{transfer.to_account?.name}</span>
                  </p>
                  <div className="
                    flex items-center gap-2 mt-0.5
                  ">
                    <p className="
                      text-xs text-[#6B7280]
                      dark:text-gray-400
                    ">
                      {formattedDate}
                    </p>
                    {transfer.notes && (
                      <>
                        <span className="
                          text-[#6B7280] text-xs
                        ">·</span>
                        <p className="
                          text-xs text-[#6B7280]
                          dark:text-gray-400
                          truncate max-w-[120px]
                        ">
                          {transfer.notes}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="
                flex items-center gap-3 shrink-0
              ">
                <div className="text-right">
                  <p className="
                    text-sm font-bold text-[#00B9A7]
                  ">
                    {mounted
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: fromCurrency,
                          maximumFractionDigits: 0,
                        }).format(transfer.amount)
                      : "—"}
                  </p>
                  {/* Show converted amount for cross-currency */}
                  {isCrossCurrency &&
                    transfer.converted_amount && (
                    <p className="
                      text-[10px] text-[#6B7280]
                      dark:text-gray-400
                    ">
                      ≈ {mounted
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: toCurrency,
                            maximumFractionDigits: 0,
                          }).format(transfer.converted_amount)
                        : "—"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(transfer.id)}
                  title={mounted ? t("common.delete") : "Delete transfer"}
                  className="
                    p-1.5 rounded-lg
                    text-gray-300 dark:text-gray-600
                    hover:text-[#FF5B5B]
                    hover:bg-[#FFF0F0]
                    dark:hover:bg-rose-900/20
                    active:scale-95
                    transition-all duration-200
                  "
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
