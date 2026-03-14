"use client";

// ============================================
// CHAT PROVIDER
// Client component for chat integration
// ============================================

import { useState, useEffect, useCallback } from "react";
import { ChatButton } from "@/components/chat/ChatButton";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { OnboardingModal } from "@/components/chat/OnboardingModal";
import { LS_KEY_AI_ONBOARDING, LS_KEY_AI_ACCEPTED_DATE } from "@/lib/constants/ai";
import { translations, type Language } from "@/lib/i18n/translations";
import { LS_KEY_LANGUAGE } from "@/lib/constants/storage";

interface ChatProviderProps {
  children: React.ReactNode;
}

function useTranslation(): { t: (key: string) => string; mounted: boolean } {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem(LS_KEY_LANGUAGE) as Language | null;
    if (savedLang && (savedLang === "en" || savedLang === "id")) {
      setLang(savedLang);
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let value: unknown = translations[lang];
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key;
        }
      }
      return typeof value === "string" ? value : key;
    },
    [lang]
  );

  return { t, mounted };
}

export function ChatProvider({ children }: ChatProviderProps): React.ReactNode {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { t, mounted } = useTranslation();

  const handleChatButtonClick = useCallback(() => {
    const onboardingDone = localStorage.getItem(LS_KEY_AI_ONBOARDING);
    if (!onboardingDone) {
      setShowOnboarding(true);
    } else {
      setIsChatOpen(true);
    }
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem(LS_KEY_AI_ONBOARDING, "true");
    localStorage.setItem(LS_KEY_AI_ACCEPTED_DATE, new Date().toISOString());
    setShowOnboarding(false);
    setIsChatOpen(true);
  }, []);

  const handleOnboardingDecline = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <ChatButton
        onClick={handleChatButtonClick}
        isOpen={isChatOpen}
        t={t}
      />
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        t={t}
        mounted={mounted}
      />
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onDecline={handleOnboardingDecline}
        t={t}
      />
    </>
  );
}
