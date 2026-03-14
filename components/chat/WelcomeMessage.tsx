"use client";

// ============================================
// WELCOME MESSAGE
// Greeting shown when chat first opens
// ============================================

interface WelcomeMessageProps {
  mounted: boolean;
  t: (key: string) => string;
}

export function WelcomeMessage({ mounted, t }: WelcomeMessageProps): React.ReactNode {
  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center text-center gap-4 py-8 px-4">
      {/* Avatar */}
      <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-700 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-2xl font-bold text-white">S</span>
      </div>

      {/* Greeting */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {t("ai.welcomeGreeting")}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
        {t("ai.welcomeDesc")}
      </p>

      {/* Prompt */}
      <p className="text-xs text-gold-600 dark:text-gold-400 font-medium">
        {t("ai.welcomePrompt")}
      </p>
    </div>
  );
}
