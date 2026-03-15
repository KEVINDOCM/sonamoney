"use client";

// ============================================
// CHAT MESSAGE
// Single message bubble with markdown rendering
// ============================================

import { useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/lib/types/ai";
import { Copy, Check, RefreshCw } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest?: boolean;
  onRegenerate?: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

function renderMarkdown(content: string): string {
  // STEP 1: Escape ALL HTML first
  // This prevents XSS from user input or AI response
  let html = escapeHtml(content)

  // STEP 2: Apply safe markdown conversions
  // Only after escaping — order matters!

  // Code blocks: ```code```
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-xl text-xs font-mono overflow-x-auto my-1">$1</pre>'
  );

  // Inline code: `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>'
  );

  // Bold: **text** → <strong>text</strong>
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  )

  // Unordered list items: * item
  html = html.replace(
    /^\*\s+(.+)$/gm,
    "<li>$1</li>"
  )
  html = html.replace(
    /(<li>.+<\/li>\n?)+/g,
    "<ul class='list-disc pl-4 space-y-1'>$&</ul>"
  )

  // Ordered list items: 1. item
  html = html.replace(
    /^\d+\.\s+(.+)$/gm,
    "<li>$1</li>"
  )
  html = html.replace(
    /(<li>.+<\/li>\n?)+/g,
    (match) => {
      if (match.includes("<ul")) return match
      return `<ol class='list-decimal pl-4 space-y-1'>${match}</ol>`
    }
  )

  // Line breaks
  html = html.replace(/\n/g, "<br>")

  return html
}

export function ChatMessage({ message, isLatest, onRegenerate }: ChatMessageProps): React.ReactNode {
  const isUser = message.role === "user";
  const timeString = formatTime(message.timestamp);
  const [copied, setCopied] = useState(false);

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div
          className="max-w-[85%] sm:max-w-[80%] px-4 py-3 bg-[#00B9A7] text-white rounded-2xl rounded-br-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">{timeString}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs text-[#6B7280] dark:text-gray-400 font-medium ml-1">Sona</span>
      <div
        className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 bg-gray-100 dark:bg-gray-800 text-[#1A1A2E] dark:text-gray-100 rounded-2xl rounded-bl-sm ${
          message.isError ? "border border-[#FF5B5B]/30" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-1 ml-1">
        {/* Copy button */}
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#00B9A7] transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-[#E6F7F6]"
        >
          {copied
            ? <Check className="w-3 h-3 text-[#00C48C]"/>
            : <Copy className="w-3 h-3"/>
          }
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>

        {/* Regenerate button — only on latest AI msg */}
        {isLatest && !message.isError && onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#00B9A7] transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-[#E6F7F6]"
          >
            <RefreshCw className="w-3 h-3"/>
            <span>Regenerate</span>
          </button>
        )}
      </div>

      <span className="text-xs text-[#6B7280] dark:text-gray-500 ml-1">{timeString}</span>
    </div>
  );
}
