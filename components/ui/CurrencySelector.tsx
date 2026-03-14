"use client";

import { CURRENCY_CONFIG, SUPPORTED_CURRENCIES } from "@/lib/utils/currency";

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  currencies?: readonly string[];
  label?: string;
}

export default function CurrencySelector({
  value,
  onChange,
  currencies = SUPPORTED_CURRENCIES,
  label = "Currency",
}: CurrencySelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <div className="flex gap-2">
        {currencies.map((currency) => {
          const config = CURRENCY_CONFIG[currency as keyof typeof CURRENCY_CONFIG];
          const isActive = value === currency;
          return (
            <button
              key={currency}
              type="button"
              onClick={() => onChange(currency)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span>{config.flag}</span>
              <span>{currency}</span>
              <span className="text-gray-400">{config.symbol}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
