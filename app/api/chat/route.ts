// ============================================
// AI CHAT API ROUTE
// Secure proxy between client and Gemini
// ============================================

import { NextRequest } from "next/server"
import { getAuthenticatedClient } from "@/lib/utils/auth"
import { buildAIContext } from "@/lib/services/contextBuilder"
import {
  checkRateLimit,
  checkPerMinuteLimit,
} from "@/lib/services/rateLimit"
import { generateAIResponse } from "@/lib/services/gemini"
import {
  estimateRequestTokens,
  isTokenSafe,
} from "@/lib/services/tokenCounter"
import { AI_MAX_TOKENS_PER_REQUEST } from "@/lib/constants/ai"
import { sanitizeUserMessage, sanitizeHistory, detectInjectionAttempt } from "@/lib/utils/sanitize"
import type { AIContext, ChatMessage, ChatResponse } from "@/lib/types/ai"
import type { AuthenticatedUser } from "@/lib/utils/auth"

interface AuthResult {
  success: true
  user: AuthenticatedUser
  supabase: SupabaseClientForAI
}

interface AuthError {
  success: false
  error: string
  status: number
}

interface SupabaseClientForAI {
  from: (table: string) => QueryBuilder
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{ error: Error | null }>
}

interface QueryBuilder {
  select: (columns: string) => FilterBuilder
  insert: (data: unknown) => Promise<{ error: Error | null }>
  update: (data: unknown) => FilterBuilder
}

interface FilterBuilder {
  eq: (column: string, value: string) => FilterBuilder & PromiseExecutor
  gte: (column: string, value: string) => FilterBuilder & PromiseExecutor
  order: (column: string, options: { ascending: boolean }) => FilterBuilder & PromiseExecutor
  limit: (count: number) => FilterBuilder & PromiseExecutor
  single: () => Promise<{ data: unknown | null; error: Error | null }>
}

interface PromiseExecutor {
  then: (onfulfilled: (value: { data: unknown | null; error: Error | null; count?: number | null }) => void) => Promise<void>
}

interface ParsedBody {
  success: true
  message: string
  history: ChatMessage[]
}

interface ParseError {
  success: false
  error: string
}

async function authenticateRequest(): Promise<AuthResult | AuthError> {
  try {
    const { user, supabase } = await getAuthenticatedClient()
    return { success: true, user, supabase: supabase as unknown as SupabaseClientForAI }
  } catch {
    return { success: false, error: "Unauthorized", status: 401 }
  }
}

async function parseRequestBody(request: NextRequest): Promise<ParsedBody | ParseError> {
  try {
    const typedRequest = request as { json: () => Promise<{ message?: unknown; history?: unknown }> }
    const body = await typedRequest.json()

    if (typeof body !== "object" || body === null) {
      return { success: false, error: "Invalid request body" }
    }

    if (typeof body.message !== "string" || body.message.trim() === "") {
      return { success: false, error: "Message is required" }
    }

    const history = Array.isArray(body.history) ? body.history : []

    return {
      success: true,
      message: body.message,
      history: history as ChatMessage[],
    }
  } catch {
    return { success: false, error: "Invalid JSON" }
  }
}

function createSuccessResponse(reply: string): Response {
  const response: ChatResponse = { reply }
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function createErrorResponse(error: string, status: number): Response {
  const response: ChatResponse = { reply: "", error }
  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function createEmptyContext(): AIContext {
  return {
    generatedAt: new Date().toISOString(),
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    netSavings: 0,
    currency: "IDR",
    accounts: [],
    topCategories: [],
    recentTransactions: [],
    budgetsOverLimit: [],
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const auth = await authenticateRequest()
  if (!auth.success) {
    return createErrorResponse(auth.error, auth.status)
  }

  const { user, supabase } = auth

  const parsed = await parseRequestBody(request)
  if (!parsed.success) {
    return createErrorResponse(parsed.error, 400)
  }

  const sanitizedMessage = sanitizeUserMessage(parsed.message)
  if (sanitizedMessage === "") {
    return createErrorResponse("Message cannot be empty", 400)
  }

  if (detectInjectionAttempt(sanitizedMessage)) {
    return createSuccessResponse(
      "Aku hanya bisa membantu dengan pertanyaan keuangan kamu 😊"
    )
  }

  const sanitizedHistory = sanitizeHistory(parsed.history)

  // Check hourly rate limit
  const rateLimit = await checkRateLimit(
    supabase,
    user.id
  )
  if (!rateLimit.allowed) {
    const minutesRemaining = Math.ceil(
      (rateLimit.resetAt.getTime() - Date.now()) /
      (60 * 1000)
    )
    return createErrorResponse(
      `Batas chat tercapai. Coba lagi dalam ${minutesRemaining} menit.`,
      429
    )
  }

  // Check per-minute rate limit
  const withinMinuteLimit = await checkPerMinuteLimit(
    supabase,
    user.id
  )
  if (!withinMinuteLimit) {
    return createErrorResponse(
      "Terlalu cepat! Tunggu sebentar sebelum kirim pesan lagi.",
      429
    )
  }

  let context: AIContext
  try {
    context = await buildAIContext(supabase, user.id)
  } catch (contextError) {
    console.error("Context build error:", contextError)
    context = createEmptyContext()
  }

  // Estimate tokens before calling Gemini
  const estimatedTokens = estimateRequestTokens(
    sanitizedMessage,
    sanitizedHistory,
    context
  )

  if (process.env.NODE_ENV === "development") {
    console.log(`[TOKEN] Estimated: ${estimatedTokens} tokens`)
  }

  if (!isTokenSafe(estimatedTokens, AI_MAX_TOKENS_PER_REQUEST)) {
    return createErrorResponse(
      "Pesan terlalu panjang. Coba mulai chat baru.",
      429
    )
  }

  try {
    const reply = await generateAIResponse(sanitizedMessage, sanitizedHistory, context)
    return createSuccessResponse(reply)
  } catch {
    return createErrorResponse("Sona sedang tidak tersedia. Coba lagi.", 500)
  }
}
