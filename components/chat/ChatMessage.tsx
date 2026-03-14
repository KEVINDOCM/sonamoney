"use client";

// ============================================
// CHAT MESSAGE
// Single message bubble with markdown rendering
// ============================================

import type { ChatMessage as ChatMessageType } from "@/lib/types/ai";

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest?: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function renderMarkdown(content: string): string {
  let html = content;

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  html = html.replace(/^\*\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.+<\/li>\n?)+/g, "<ul>$&</ul>");

  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.+<\/li>\n?)+/g, (match) => {
    if (match.includes("<ul>")) return match;
    return `<ol>${match}</ol>`;
  });

  html = html.replace(/\n/g, "<br>");

  return html;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps): React.ReactNode {
  const isUser = message.role === "user";
  const timeString = formatTime(message.timestamp);

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div
          className="max-w-[85%] sm:max-w-[80%] px-4 py-3 bg-gold-600 text-white rounded-2xl rounded-br-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">{timeString}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Sona</span>
      <div
        className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-sm ${
          message.isError ? "border border-rose-200 dark:border-rose-800" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
      />
      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{timeString}</span>
    </div>
  );
}
