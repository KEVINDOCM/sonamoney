"use client";

import { BarChart3, Banknote, Target, Lightbulb, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================
// SUGGESTED QUESTIONS
// Categorized question chips with icons
// ============================================

interface SuggestedQuestion {
  id: string;
  label: string;
  icon: LucideIcon;
  category: "spending" | "budget" | "savings" | "general";
}

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  mounted: boolean;
  t: (key: string) => string;
}

export function SuggestedQuestions({
  onSelect,
  mounted,
  t,
}: SuggestedQuestionsProps): React.ReactNode {
  if (!mounted) return null;

  const questions: SuggestedQuestion[] = [
    {
      id: "q1",
      icon: BarChart3,
      label: mounted
        ? t("ai.suggestedQ1")
        : "How am I doing this month?",
      category: "general",
    },
    {
      id: "q2",
      icon: Banknote,
      label: mounted
        ? t("ai.suggestedQ2")
        : "Where am I overspending?",
      category: "spending",
    },
    {
      id: "q3",
      icon: Target,
      label: mounted
        ? t("ai.suggestedQ3")
        : "Which budgets need attention?",
      category: "budget",
    },
    {
      id: "q4",
      icon: Lightbulb,
      label: mounted
        ? t("ai.suggestedQ4")
        : "Give me 3 money saving tips",
      category: "savings",
    },
    {
      id: "q5",
      icon: TrendingUp,
      label: mounted
        ? t("ai.suggestedQ5")
        : "Compare this month vs last month",
      category: "general",
    },
  ];

  return (
    <div className="flex flex-col gap-3 px-4 py-3 animate-in fade-in duration-300">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        {t("ai.suggestedTitle")}
      </span>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question.id}
            onClick={() => onSelect(question.label)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1A1A2E] dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:border-[#00B9A7] hover:text-[#00B9A7] hover:bg-[#E6F7F6] dark:hover:bg-[#00B9A7]/10 active:scale-95 transition-all duration-200 text-left"
            type="button"
          >
            <question.icon className="w-3.5 h-3.5" />
            <span>{question.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
