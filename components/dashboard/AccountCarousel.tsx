"use client";

import type { Account } from "@/types";

interface AccountCarouselProps {
  accounts: Account[];
  mounted: boolean;
  t: (key: string) => string;
  baseCurrency: string;
  convert: (amount: number, from: string, to: string) => number;
  formatCurrency: (amount: number, currency: string) => string;
}

const ACCOUNT_COLORS = [
  "from-[#00B9A7] to-[#0099A0]",
  "from-[#6366F1] to-[#4F46E5]",
  "from-[#FFB800] to-[#F59E0B]",
  "from-[#00C48C] to-[#059669]",
  "from-[#FF5B5B] to-[#DC2626]",
];

export function AccountCarousel({
  accounts,
  mounted,
  baseCurrency,
  convert,
  formatCurrency,
}: AccountCarouselProps) {
  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="mt-4 mx-4 md:mx-0">
      <div className="
        flex gap-3
        overflow-x-auto scrollbar-hide
        pb-1
      ">
        {accounts.map((account, index) => {
          const colorClass =
            ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
          const convertedBalance = convert(
            account.balance,
            account.currency,
            baseCurrency
          );

          return (
            <div
              key={account.id}
              className={`
                bg-gradient-to-br ${colorClass}
                rounded-2xl p-4
                min-w-[160px] shrink-0
                shadow-sm
                hover:shadow-md
                hover:-translate-y-0.5
                transition-all duration-200
                cursor-default
              `}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">
                  {account.icon ?? "💳"}
                </span>
                <span className="
                  text-white/90 text-xs
                  font-medium truncate
                ">
                  {account.name}
                </span>
              </div>
              <p className="
                text-white font-extrabold
                text-lg leading-tight
              ">
                {mounted
                  ? formatCurrency(convertedBalance, baseCurrency)
                  : "—"}
              </p>
              <p className="
                text-white/60 text-[10px]
                mt-0.5 uppercase tracking-wide
              ">
                {account.currency}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
