"use client";

import { Globe, CheckCircle } from "lucide-react";

interface LanguageSectionProps {
  currentLanguage: string;
  onLanguageChange: (lang: "en" | "id") => void;
  title: string;
  description: string;
}

export function LanguageSection({
  currentLanguage,
  onLanguageChange,
  title,
  description,
}: LanguageSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Globe className="h-5 w-5 text-emerald-600" />
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

      <div className="flex gap-2">
        <button
          onClick={() => onLanguageChange("en")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
            currentLanguage === "en"
              ? "border-gold-500 bg-gold-50 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <span className="text-base">🇺🇸</span>
          <span>English</span>
          {currentLanguage === "en" && <CheckCircle className="h-3.5 w-3.5 ml-1" />}
        </button>

        <button
          onClick={() => onLanguageChange("id")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
            currentLanguage === "id"
              ? "border-gold-500 bg-gold-50 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <span className="text-base">🇮🇩</span>
          <span>Indonesia</span>
          {currentLanguage === "id" && <CheckCircle className="h-3.5 w-3.5 ml-1" />}
        </button>
      </div>
    </div>
  );
}
