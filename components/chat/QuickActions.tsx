"use client";

// ============================================
// QUICK ACTIONS
// Follow-up action chips after AI response
// ============================================

interface QuickAction {
  id: string;
  icon: string;
  label: string;
}

interface QuickActionsProps {
  onSelect: (action: string) => void;
  mounted: boolean;
  t: (key: string) => string;
}

export function QuickActions({ onSelect, mounted, t }: QuickActionsProps): React.ReactNode {
  if (!mounted) return null;

  const actions: QuickAction[] = [
    { id: "more", icon: "🔍", label: t("ai.quickActionMore") },
    { id: "tips", icon: "💡", label: t("ai.quickActionTips") },
    { id: "breakdown", icon: "📋", label: t("ai.quickActionBreakdown") },
    { id: "savings", icon: "💰", label: t("ai.quickActionSavings") },
  ];

  return (
    <div className="flex flex-wrap gap-2 pl-4 pr-4 pb-2 animate-in fade-in duration-300 delay-100">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onSelect(action.label)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs 
                     text-gray-600 dark:text-gray-400
                     border border-gray-200 dark:border-gray-700 rounded-full
                     hover:border-gold-300 hover:text-gold-600 dark:hover:text-gold-400
                     hover:bg-gold-50 dark:hover:bg-gold-900/10
                     transition-all duration-200"
          type="button"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
