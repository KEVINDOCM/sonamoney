"use client";

// ============================================
// SUGGESTED QUESTIONS
// Categorized question chips with icons
// ============================================

interface SuggestedQuestion {
  id: string;
  label: string;
  icon: string;
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
      icon: "📊",
      label: mounted ? t("ai.suggestedQ1") : "How am I doing financially this month?",
      category: "general",
    },
    {
      id: "q2",
      icon: "💸",
      label: mounted ? t("ai.suggestedQ2") : "Which category am I spending the most on?",
      category: "spending",
    },
    {
      id: "q3",
      icon: "🎯",
      label: mounted ? t("ai.suggestedQ3") : "Are my budgets on track?",
      category: "budget",
    },
    {
      id: "q4",
      icon: "💰",
      label: mounted ? t("ai.suggestedQ4") : "How can I save more money?",
      category: "savings",
    },
    {
      id: "q5",
      icon: "📈",
      label: mounted ? t("ai.suggestedQ5") : "What are my spending trends?",
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm 
                       text-[#00B9A7] dark:text-[#00B9A7] 
                       border border-[#00B9A7]/30 dark:border-[#00B9A7]/30 rounded-full
                       hover:bg-[#E6F7F6] dark:hover:bg-[#00B9A7]/10 
                       hover:border-[#00B9A7]
                       active:scale-95
                       transition-all duration-200 text-left"
            type="button"
          >
            <span>{question.icon}</span>
            <span>{question.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
