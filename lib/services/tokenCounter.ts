// ============================================
// TOKEN COUNTER
// Estimates token usage before API calls.
// Prevents quota exhaustion.
// Rule of thumb: 1 token ≈ 4 characters
// ============================================

import type { ChatMessage, AIContext } from "@/lib/types/ai"

const CHARS_PER_TOKEN = 4
const REQUEST_OVERHEAD_TOKENS = 500

export function estimateTokenCount(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export function estimateRequestTokens(
  message: string,
  history: ChatMessage[],
  context: AIContext
): number {
  const messageTokens = estimateTokenCount(message)

  const historyTokens = history.reduce(
    (sum, msg) => sum + estimateTokenCount(msg.content),
    0
  )

  const contextTokens = estimateTokenCount(
    JSON.stringify(context)
  )

  return (
    messageTokens +
    historyTokens +
    contextTokens +
    REQUEST_OVERHEAD_TOKENS
  )
}

export function isTokenSafe(
  estimatedTokens: number,
  maxTokens: number
): boolean {
  return estimatedTokens < maxTokens
}
