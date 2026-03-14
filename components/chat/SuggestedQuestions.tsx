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
                       text-gold-700 dark:text-gold-400 
                       border border-gold-200 dark:border-gold-800 rounded-full
                       hover:bg-gold-50 dark:hover:bg-gold-900/20 
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
