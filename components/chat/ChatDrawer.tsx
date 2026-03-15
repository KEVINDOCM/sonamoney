"use client";

// ============================================
// CHAT DRAWER
// Main chat interface sliding drawer
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage as ChatMessageComponent } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { WelcomeMessage } from "./WelcomeMessage";
import { QuickActions } from "./QuickActions";
import type { ChatMessage } from "@/lib/types/ai";
import { Send, X, Trash2, ChevronDown } from "lucide-react";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
  mounted: boolean;
}

const SCROLL_THRESHOLD = 100;

export function ChatDrawer({
  isOpen,
  onClose,
  t,
  mounted,
}: ChatDrawerProps): React.ReactNode {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = useCallback((): void => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const scrolledUp = scrollHeight - scrollTop - clientHeight > SCROLL_THRESHOLD;
    setShowScrollButton(scrolledUp);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  async function sendMessage(): Promise<void> {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setHasStarted(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Unknown error");
      }

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          error instanceof Error ? error.message : t("ai.errorGeneral"),
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function handleSuggestedQuestion(question: string): void {
    setInputValue(question);
    sendMessage();
  }

  function handleQuickAction(action: string): void {
    setInputValue(action);
    sendMessage();
  }

  function clearChat(): void {
    setMessages([]);
    setHasStarted(false);
  }

  const isLastMessageFromAI = messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[65] sm:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Chat Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-96 h-full bg-white dark:bg-gray-900 shadow-2xl
                   transform transition-transform duration-300 ease-in-out flex flex-col
                   z-[70] sm:z-50 sm:rounded-l-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-gradient-to-br from-[#00B9A7] to-[#0099A0] text-white shrink-0">
          <div>
            <h2 className="text-lg font-semibold">{t("ai.title")}</h2>
            <p className="text-xs text-white/80">{t("ai.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasStarted && (
              <button
                onClick={clearChat}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label={t("ai.clearChat")}
                type="button"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label={t("common.close")}
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area - flex-1 with overflow */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        >
          {!hasStarted && (
            <>
              <WelcomeMessage mounted={mounted} t={t} />
              <SuggestedQuestions
                onSelect={handleSuggestedQuestion}
                mounted={mounted}
                t={t}
              />
            </>
          )}

          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              <ChatMessageComponent
                message={message}
                isLatest={index === messages.length - 1}
              />
              {index === messages.length - 1 &&
                message.role === "assistant" &&
                !isLoading && (
                  <QuickActions
                    onSelect={handleQuickAction}
                    mounted={mounted}
                    t={t}
                  />
                )}
            </div>
          ))}

          {isLoading && <TypingIndicator label={t("ai.thinking")} />}

          <div ref={messagesEndRef} />

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-24 sm:bottom-20 right-4 w-8 h-8 bg-white dark:bg-gray-800 
                         border border-gray-200 dark:border-gray-700 shadow-md rounded-full
                         flex items-center justify-center text-gray-600 dark:text-gray-400
                         hover:text-[#00B9A7] dark:hover:text-[#00B9A7]
                         transition-all duration-200 animate-in fade-in z-20"
              aria-label="Scroll to bottom"
              type="button"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sticky Input Area */}
        <div className="sticky bottom-0 p-4 pb-safe-bottom sm:pb-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("ai.placeholder")}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent 
                       focus:border-[#00B9A7] focus:ring-2 focus:ring-[#00B9A7]/20 dark:focus:ring-[#00B9A7]/20
                       rounded-full text-sm text-gray-900 dark:text-gray-100 
                       placeholder-gray-500 dark:placeholder-gray-400 outline-none transition-all"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 bg-[#00B9A7] hover:bg-[#0099A0] disabled:opacity-50 
                         disabled:cursor-not-allowed text-white rounded-full 
                         shadow-sm hover:shadow-md
                         transition-all duration-200 shrink-0"
            aria-label={t("ai.send")}
            type="button"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
