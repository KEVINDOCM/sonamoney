"use client";

// ============================================
// TYPING INDICATOR
// Animated dots showing AI is thinking
// ============================================

interface TypingIndicatorProps {
  text?: string;
}

export function TypingIndicator({
  text = "Sona is thinking...",
}: TypingIndicatorProps): React.ReactNode {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#00B9A7] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-[#6B7280] dark:text-gray-400 italic transition-all duration-500">
        {text}
      </span>
    </div>
  );
}
