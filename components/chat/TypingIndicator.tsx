"use client";

// ============================================
// TYPING INDICATOR
// Animated dots showing AI is thinking
// ============================================

interface TypingIndicatorProps {
  label: string;
}

export function TypingIndicator({ label }: TypingIndicatorProps): React.ReactNode {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm max-w-[80%]">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
