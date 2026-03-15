"use client";

// ============================================
// CHAT BUTTON
// Floating action button to open/close chat
// ============================================

import { MessageCircle, X } from "lucide-react";

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  t: (key: string) => string;
}

export function ChatButton({ onClick, isOpen, t }: ChatButtonProps): React.ReactNode {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 
                 bg-gradient-to-br from-[#00B9A7] to-[#0099A0] 
                 hover:from-[#00B9A7] hover:to-[#007A80]
                 hover:shadow-[0_8px_25px_rgba(0,185,167,0.4)]
                 text-white rounded-full shadow-lg hover:shadow-xl 
                 transition-all duration-300 ease-out
                 flex items-center justify-center z-[60]"
      aria-label={isOpen ? t("common.close") : t("ai.title")}
      type="button"
    >
      {isOpen ? (
        <X className="w-6 h-6 transition-transform duration-200" />
      ) : (
        <MessageCircle className="w-6 h-6 transition-transform duration-200" />
      )}
    </button>
  );
}
