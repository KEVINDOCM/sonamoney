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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-gold-600" />
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
                  ? "border-gold-500 bg-gold-50 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
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
