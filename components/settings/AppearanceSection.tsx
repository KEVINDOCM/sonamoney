"use client";

import { Sun, Moon } from "lucide-react";

interface AppearanceSectionProps {
  isDark: boolean;
  onToggle: () => void;
  title: string;
  description: string;
}

export function AppearanceSection({
  isDark,
  onToggle,
  title,
  description,
}: AppearanceSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {isDark
              ? <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              : <Sun className="h-5 w-5 text-gray-600" />
            }
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-gray-400">
              {description}
            </p>
          </div>
        </div>

        <button
          onClick={onToggle}
          title="Toggle dark mode"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
            isDark ? "bg-gold-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
              isDark ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
