"use client";

import { DollarSign, CheckCircle } from "lucide-react";
import { CURRENCY_CONFIG, SUPPORTED_CURRENCIES } from "@/lib/utils/currency";

interface CurrencySectionProps {
  currentCurrency: string;
  onCurrencyChange: (currency: string) => void;
  title: string;
  description: string;
  ratesLoading: boolean;
  rates: { IDR?: number };
}

export function CurrencySection({
  currentCurrency,
  onCurrencyChange,
  title,
  description,
  ratesLoading,
  rates,
}: CurrencySectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[#E6F7F6] dark:bg-[#00B9A7]/20 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-[#00B9A7]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {SUPPORTED_CURRENCIES.map((currency) => {
          const config = CURRENCY_CONFIG[currency];
          const isActive = currentCurrency === currency;
          return (
            <button
              key={currency}
              onClick={() => onCurrencyChange(currency)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "border-[#00B9A7] bg-[#E6F7F6] dark:bg-[#00B9A7]/20 text-[#00B9A7] shadow-sm font-semibold"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#00B9A7]/50 hover:text-[#00B9A7]"
              }`}
            >
              <span className="text-base">{config.flag}</span>
              <span>{currency}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {config.symbol}
              </span>
              {isActive && <CheckCircle className="h-3.5 w-3.5 ml-1" />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {ratesLoading
            ? "Loading rates..."
            : `1 USD = ${new Intl.NumberFormat("id-ID").format(rates.IDR ?? 16000)} IDR`
          }
        </p>
        <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Powered by Frankfurter
        </p>
      </div>
    </div>
  );
}
