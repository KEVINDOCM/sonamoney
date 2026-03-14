// ============================================
// MESSAGE SANITIZATION
// Strip HTML, normalize whitespace, enforce length
// Detect prompt injection attempts
// ============================================

import { AI_MAX_MESSAGE_LENGTH, AI_MAX_HISTORY_MESSAGES } from "@/lib/constants/ai"
import type { ChatMessage } from "@/lib/types/ai"

const HTML_TAG_PATTERN = /<[^>]*>/g
const WHITESPACE_PATTERN = /\s+/g

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /system\s*:/i,
  /assistant\s*:/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /you\s+are\s+now/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /act\s+as\s+(a\s+different|another)/i,
]

export function sanitizeUserMessage(message: string): string {
  let sanitized = message

  sanitized = sanitized.replace(HTML_TAG_PATTERN, "")
  sanitized = sanitized.replace(WHITESPACE_PATTERN, " ")
  sanitized = sanitized.trim()
  sanitized = sanitized.slice(0, AI_MAX_MESSAGE_LENGTH)

  return sanitized
}

export function detectInjectionAttempt(message: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(message))
}

export function sanitizeHistory(history: ChatMessage[]): ChatMessage[] {
  const recentHistory = history.slice(-AI_MAX_HISTORY_MESSAGES)

  return recentHistory.map((msg) => ({
    role: msg.role,
    content: sanitizeUserMessage(msg.content),
    timestamp: msg.timestamp,
    isError: msg.isError,
  }))
}
