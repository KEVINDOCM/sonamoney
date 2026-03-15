"use client";

import { useState } from "react";
import type { Account } from "@/types";

interface AccountCardListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onSetDefault?: (id: string) => void;
  defaultAccountId?: string | null;
  mounted: boolean;
  t: (key: string) => string;
  baseCurrency: string;
  convert: (amount: number, from: string, to: string) => number;
  isLoading?: boolean;
}

export function AccountCardList({
  accounts,
  onEdit,
  onDelete,
  onSetDefault,
  mounted,
  t,
  baseCurrency,
  convert,
  isLoading,
}: AccountCardListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div>
      {/* Mobile: horizontal scroll */}
      <div className="
        block lg:hidden
        flex gap-3
        overflow-x-auto scrollbar-hide
        pb-2 -mx-4 px-4
      ">
        {isLoading ? (
          /* Mobile skeleton */
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="
                  min-w-[200px] shrink-0
                  rounded-2xl h-[120px]
                  skeleton
                "
              />
            ))}
          </>
        ) : accounts.length === 0 ? (
          <div className="
            w-full bg-white dark:bg-gray-900
            rounded-2xl shadow-sm p-8
            flex flex-col items-center
            text-center min-w-full
          ">
            <span className="text-4xl mb-3">💳</span>
            <p className="
              text-sm font-semibold
              text-[#1A1A2E] dark:text-white
            ">
              {t("accounts.noAccounts")}
            </p>
          </div>
        ) : (
          accounts.map((account, index) => {
            const GRADIENTS = [
              "from-[#00B9A7] to-[#0099A0]",
              "from-[#6366F1] to-[#4F46E5]",
              "from-[#FFB800] to-[#F59E0B]",
              "from-[#00C48C] to-[#059669]",
              "from-[#FF5B5B] to-[#DC2626]",
            ]
            const gradient =
              GRADIENTS[index % GRADIENTS.length]
            const convertedBalance = convert(
              account.balance,
              account.currency,
              baseCurrency
            )

            return (
              <div
                key={account.id}
                className={`
                  bg-gradient-to-br ${gradient}
                  rounded-2xl p-4 shadow-sm
                  min-w-[200px] shrink-0
                  hover:shadow-md
                  hover:-translate-y-0.5
                  transition-all duration-200
                  relative
                `}
              >
                {/* Default badge */}
                {account.is_default && (
                  <span className="
                    absolute top-3 right-3
                    bg-white/30 text-white
                    text-[10px] font-bold
                    px-2 py-0.5 rounded-full
                  ">
                    Default
                  </span>
                )}

                {/* Icon + name */}
                <div className="
                  flex items-center gap-2 mb-4
                ">
                  <span className="text-2xl">
                    {account.icon ?? "💳"}
                  </span>
                  <span className="
                    text-white/90 text-sm
                    font-semibold truncate
                  ">
                    {account.name}
                  </span>
                </div>

                {/* Balance */}
                <p className="
                  text-white font-extrabold
                  text-xl leading-tight
                ">
                  {mounted
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: baseCurrency,
                        maximumFractionDigits: 0,
                      }).format(convertedBalance)
                    : "—"}
                </p>
                <p className="
                  text-white/60 text-[10px]
                  mt-0.5 uppercase tracking-wide
                ">
                  {account.currency} •{" "}
                  {mounted ? t(`accounts.type.${account.type}`) : account.type}
                </p>

                {/* Actions */}
                <div className="
                  flex gap-2 mt-4
                ">
                  <button
                    onClick={() => onEdit(account)}
                    className="
                      flex-1 h-8 rounded-xl
                      bg-white/20 text-white
                      text-xs font-semibold
                      hover:bg-white/30
                      active:scale-95
                      transition-all duration-200
                    "
                  >
                    {mounted ? t("common.edit") : "Edit"}
                  </button>
                  <button
                    onClick={() => onDelete(account)}
                    className="
                      h-8 px-3 rounded-xl
                      bg-white/20 text-white
                      text-xs font-semibold
                      hover:bg-red-500/40
                      active:scale-95
                      transition-all duration-200
                    "
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop: grid 3 cols */}
      <div className="
        hidden lg:grid
        lg:grid-cols-3 gap-4
      ">
        {isLoading ? (
          /* Desktop skeleton */
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="
                  rounded-2xl h-[160px]
                  skeleton
                "
              />
            ))}
          </>
        ) : accounts.length === 0 ? (
          <div className="
            lg:col-span-3
            bg-white dark:bg-gray-900
            rounded-2xl shadow-sm p-8
            flex flex-col items-center
            text-center
          ">
            <span className="text-4xl mb-3">💳</span>
            <p className="
              text-sm font-semibold
              text-[#1A1A2E] dark:text-white
            ">
              {t("accounts.noAccounts")}
            </p>
          </div>
        ) : (
          accounts.map((account) => {
            const convertedBalance = convert(
              account.balance,
              account.currency,
              baseCurrency
            )

            return (
              <div
                key={account.id}
                className="
                  bg-white dark:bg-gray-900
                  rounded-2xl shadow-sm p-5
                  hover:shadow-md
                  hover:-translate-y-1
                  transition-all duration-200
                  relative
                "
              >
                {/* Default badge */}
                {account.is_default && (
                  <span className="
                    absolute top-3 right-3
                    bg-[#E6F7F6] text-[#00B9A7]
                    text-[10px] font-bold
                    px-2 py-0.5 rounded-full
                  ">
                    Default
                  </span>
                )}

                {/* Header */}
                <div className="
                  flex items-center gap-3 mb-4
                ">
                  <div className="
                    h-11 w-11 rounded-xl
                    bg-[#F5F7FA] dark:bg-gray-800
                    flex items-center justify-center
                    text-2xl
                  ">
                    {account.icon ?? "💳"}
                  </div>
                  <div>
                    <p className="
                      text-sm font-bold
                      text-[#1A1A2E] dark:text-white
                    ">
                      {account.name}
                    </p>
                    <p className="
                      text-xs text-[#6B7280]
                      dark:text-gray-400
                    ">
                      {mounted
                        ? t(`accounts.type.${account.type}`)
                        : account.type}
                      {" • "}{account.currency}
                    </p>
                  </div>
                </div>

                {/* Balance */}
                <div className="mb-4">
                  <p className="
                    text-xs text-[#6B7280]
                    uppercase tracking-wide mb-0.5
                  ">
                    {mounted ? t("accounts.balance") : "Balance"}
                  </p>
                  <p className="
                    text-xl font-extrabold
                    text-[#1A1A2E] dark:text-white
                  ">
                    {mounted
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: baseCurrency,
                          maximumFractionDigits: 0,
                        }).format(convertedBalance)
                      : "—"}
                  </p>
                </div>

                {/* Actions menu */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === account.id
                          ? null
                          : account.id
                      )
                    }
                    className="
                      w-full h-9 rounded-xl
                      border border-gray-200
                      dark:border-gray-700
                      text-xs font-medium
                      text-[#6B7280]
                      hover:border-[#00B9A7]
                      hover:text-[#00B9A7]
                      transition-all duration-200
                      flex items-center
                      justify-center gap-1
                    "
                  >
                    ⋯ {mounted ? t("common.manage") : "Manage"}
                  </button>

                  {openMenuId === account.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="
                        absolute bottom-full mb-1
                        left-0 right-0
                        bg-white dark:bg-gray-900
                        rounded-2xl shadow-lg
                        border border-gray-100
                        dark:border-gray-800
                        py-2 z-50
                        animate-scaleIn
                      ">
                        <button
                          onClick={() => {
                            onEdit(account)
                            setOpenMenuId(null)
                          }}
                          className="
                            w-full text-left
                            px-4 py-2.5 text-sm
                            text-[#1A1A2E] dark:text-gray-300
                            hover:bg-gray-50
                            dark:hover:bg-gray-800
                            flex items-center gap-2
                            transition-colors
                          "
                        >
                          ✏️ {mounted ? t("common.edit") : "Edit"}
                        </button>
                        {onSetDefault &&
                          !account.is_default && (
                          <button
                            onClick={() => {
                              onSetDefault(account.id)
                              setOpenMenuId(null)
                            }}
                            className="
                              w-full text-left
                              px-4 py-2.5 text-sm
                              text-[#00B9A7]
                              hover:bg-[#E6F7F6]
                              dark:hover:bg-[#00B9A7]/10
                              flex items-center gap-2
                              transition-colors
                            "
                          >
                            ⭐ {mounted
                              ? t("accounts.setDefault")
                              : "Set as default"}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onDelete(account)
                            setOpenMenuId(null)
                          }}
                          className="
                            w-full text-left
                            px-4 py-2.5 text-sm
                            text-[#FF5B5B]
                            hover:bg-[#FFF0F0]
                            dark:hover:bg-rose-900/20
                            flex items-center gap-2
                            transition-colors
                          "
                        >
                          🗑️ {mounted ? t("common.delete") : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
