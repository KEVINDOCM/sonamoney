// ============================================
// AI RATE LIMITER
// 20 requests per rolling hour per user
// Storage: Supabase ai_rate_limits table
// ============================================

import {
  AI_MAX_REQUESTS_PER_HOUR,
  AI_RATE_LIMIT_WINDOW_MS,
} from "@/lib/constants/ai"
import type { RateLimitStatus } from "@/lib/types/ai"

interface RateLimitRow {
  user_id: string
  request_count: number
  window_start: string
}

interface SupabaseAuthClient {
  from: (table: string) => QueryBuilder
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{ error: Error | null }>
}

interface QueryBuilder {
  select: (columns: string) => FilterBuilder
  insert: (data: Record<string, unknown>) => Promise<{ error: Error | null }>
  update: (data: Record<string, unknown>) => FilterBuilder
}

interface FilterBuilder {
  eq: (column: string, value: string) => FilterBuilder & PromiseExecutor
  single: () => Promise<{ data: unknown | null; error: Error | null }>
}

interface PromiseExecutor {
  then: (onfulfilled: (value: { data: unknown | null; error: Error | null }) => void) => Promise<void>
}

export async function checkRateLimit(
  supabase: SupabaseAuthClient,
  userId: string
): Promise<RateLimitStatus> {
  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() - AI_RATE_LIMIT_WINDOW_MS)

    const record = await fetchRateLimitRecord(supabase, userId)

    if (!record) {
      await createRateLimitRecord(supabase, userId, now)
      return buildStatus(true, AI_MAX_REQUESTS_PER_HOUR - 1, now)
    }

    const recordWindowStart = new Date(record.window_start)
    const isWindowExpired = recordWindowStart < windowStart

    if (isWindowExpired) {
      await resetRateLimitRecord(supabase, userId, now)
      return buildStatus(true, AI_MAX_REQUESTS_PER_HOUR - 1, now)
    }

    const remaining = AI_MAX_REQUESTS_PER_HOUR - record.request_count

    if (remaining <= 0) {
      const resetAt = new Date(recordWindowStart.getTime() + AI_RATE_LIMIT_WINDOW_MS)
      return buildStatus(false, 0, resetAt)
    }

    await incrementRateLimitRecord(supabase, userId)
    return buildStatus(true, remaining - 1, recordWindowStart)
  } catch (error) {
    console.error("Rate limit error — failing open:", error)
    return {
      allowed: true,
      remaining: AI_MAX_REQUESTS_PER_HOUR,
      resetAt: new Date(Date.now() + AI_RATE_LIMIT_WINDOW_MS),
    }
  }
}

async function fetchRateLimitRecord(
  supabase: SupabaseAuthClient,
  userId: string
): Promise<RateLimitRow | null> {
  const { data, error } = await supabase
    .from("ai_rate_limits")
    .select("user_id, request_count, window_start")
    .eq("user_id", userId)
    .single()

  if (error || !data) return null

  return data as RateLimitRow
}

async function createRateLimitRecord(
  supabase: SupabaseAuthClient,
  userId: string,
  now: Date
): Promise<void> {
  await supabase.from("ai_rate_limits").insert({
    user_id: userId,
    request_count: 1,
    window_start: now.toISOString(),
  })
}

async function resetRateLimitRecord(
  supabase: SupabaseAuthClient,
  userId: string,
  now: Date
): Promise<void> {
  await supabase
    .from("ai_rate_limits")
    .update({
      request_count: 1,
      window_start: now.toISOString(),
    })
    .eq("user_id", userId)
}

async function incrementRateLimitRecord(
  supabase: SupabaseAuthClient,
  userId: string
): Promise<void> {
  await supabase.rpc("increment_ai_rate_limit", {
    p_user_id: userId,
  })
}

function buildStatus(
  allowed: boolean,
  remaining: number,
  resetAt: Date
): RateLimitStatus {
  return {
    allowed,
    remaining,
    resetAt,
  }
}
