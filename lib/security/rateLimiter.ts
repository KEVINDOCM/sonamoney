// Distributed Rate Limiting with Redis (Upstash)
// Provides scalable, persistent rate limiting across multiple server instances
// Falls back to in-memory rate limiting if Redis is unavailable

import { Redis } from "@upstash/redis"

// Redis client configuration
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Create Redis client only if credentials are configured
const redis = redisUrl && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null

// Track Redis availability
let redisAvailable = !!redis
let redisErrorCount = 0
const MAX_REDIS_ERRORS = 5

// ============================================================================
// RATE LIMIT CONFIGURATION
// ============================================================================

export interface RateLimitConfig {
  requests: number      // Max requests allowed
  windowMs: number      // Time window in milliseconds
  keyPrefix: string     // Redis key prefix for namespacing
}

export const DEFAULT_RATE_LIMITS = {
  // General API rate limit: 60 requests per minute
  GENERAL: {
    requests: 60,
    windowMs: 60 * 1000,  // 1 minute
    keyPrefix: "ratelimit:general",
  } as RateLimitConfig,

  // Auth endpoints: 10 requests per 15 minutes (stricter)
  AUTH: {
    requests: 10,
    windowMs: 15 * 60 * 1000,  // 15 minutes
    keyPrefix: "ratelimit:auth",
  } as RateLimitConfig,

  // Sensitive endpoints (scan-receipt): 5 requests per minute
  SENSITIVE: {
    requests: 5,
    windowMs: 60 * 1000,  // 1 minute
    keyPrefix: "ratelimit:sensitive",
  } as RateLimitConfig,

  // Failed attempt tracking: 5 failures per 5 minutes, block for 30 minutes
  FAILED_ATTEMPTS: {
    requests: 5,
    windowMs: 5 * 60 * 1000,  // 5 minutes
    keyPrefix: "ratelimit:failed",
  } as RateLimitConfig,
} as const

// Block duration after exceeding failed attempts
const BLOCK_DURATION_MS = 30 * 60 * 1000  // 30 minutes

// ============================================================================
// RATE LIMIT RESULT
// ============================================================================

export interface RateLimitResult {
  success: boolean       // Whether request is allowed
  limit: number         // Max requests allowed
  remaining: number     // Remaining requests in window
  resetAt: number       // Timestamp when window resets
  blocked?: boolean     // Whether IP is temporarily blocked
  blockExpires?: number // When block expires (if blocked)
}

// ============================================================================
// REDIS-BASED RATE LIMITING (Distributed)
// ============================================================================

/**
 * Check rate limit using Redis (distributed across all instances)
 * Uses sliding window algorithm with Redis sorted sets
 */
async function checkRedisRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redis || !redisAvailable) {
    throw new Error("Redis not available")
  }

  const now = Date.now()
  const windowStart = now - config.windowMs
  const key = `${config.keyPrefix}:${identifier}`

  try {
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart)

    // Count current entries in window
    const currentCount = await redis.zcard(key)

    if (currentCount >= config.requests) {
      // Get the oldest entry to calculate reset time
      const oldestEntries = await redis.zrange(key, 0, 0, { withScores: true })
      // zrange with withScores returns array in format [member, score, member, score...]
      // or object format depending on SDK version - handle both
      let oldestTimestamp = now
      if (Array.isArray(oldestEntries)) {
        // Array format: [member, score] - score is at index 1
        oldestTimestamp = oldestEntries[1] ? parseInt(String(oldestEntries[1]), 10) : now
      } else if (oldestEntries && typeof oldestEntries === "object") {
        // Object format: get first value
        const scores = Object.values(oldestEntries)
        oldestTimestamp = scores[0] ? parseInt(String(scores[0]), 10) : now
      }
      const resetAt = oldestTimestamp + config.windowMs

      return {
        success: false,
        limit: config.requests,
        remaining: 0,
        resetAt,
      }
    }

    // Add current request
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` })

    // Set expiration on the key
    await redis.expire(key, Math.ceil(config.windowMs / 1000))

    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - currentCount - 1,
      resetAt: now + config.windowMs,
    }
  } catch (error) {
    redisErrorCount++
    if (redisErrorCount >= MAX_REDIS_ERRORS) {
      redisAvailable = false
      console.error("[RATE LIMIT] Redis error threshold exceeded, falling back to memory")
    }
    throw error
  }
}

/**
 * Check if IP is blocked due to failed attempts (Redis)
 */
async function checkRedisBlocked(identifier: string): Promise<{ blocked: boolean; expires?: number }> {
  if (!redis || !redisAvailable) {
    throw new Error("Redis not available")
  }

  const blockKey = `ratelimit:blocked:${identifier}`

  try {
    const blockExpires = await redis.get<number>(blockKey)

    if (blockExpires) {
      const now = Date.now()
      if (now < blockExpires) {
        return { blocked: true, expires: blockExpires }
      } else {
        // Block expired, remove it
        await redis.del(blockKey)
        return { blocked: false }
      }
    }

    return { blocked: false }
  } catch (error) {
    throw error
  }
}

/**
 * Record failed attempt and potentially block IP (Redis)
 */
async function recordRedisFailedAttempt(identifier: string): Promise<{ blocked: boolean; expires?: number }> {
  if (!redis || !redisAvailable) {
    throw new Error("Redis not available")
  }

  const config = DEFAULT_RATE_LIMITS.FAILED_ATTEMPTS
  const now = Date.now()
  const windowStart = now - config.windowMs
  const key = `${config.keyPrefix}:${identifier}`

  try {
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart)

    // Add current failed attempt
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` })
    await redis.expire(key, Math.ceil(config.windowMs / 1000))

    // Count attempts
    const count = await redis.zcard(key)

    if (count >= config.requests) {
      // Block the IP
      const blockKey = `ratelimit:blocked:${identifier}`
      const blockExpires = now + BLOCK_DURATION_MS
      await redis.set(blockKey, blockExpires, { ex: Math.ceil(BLOCK_DURATION_MS / 1000) })

      console.error(`[SECURITY] IP ${identifier} blocked for ${BLOCK_DURATION_MS / 60000}m due to failed attempts`)

      return { blocked: true, expires: blockExpires }
    }

    return { blocked: false }
  } catch (error) {
    throw error
  }
}

// ============================================================================
// IN-MEMORY FALLBACK (When Redis unavailable)
// ============================================================================

// In-memory stores (same as original middleware.ts but isolated here)
interface MemoryRateLimitEntry {
  count: number
  resetAt: number
}

const memoryRateLimits = new Map<string, MemoryRateLimitEntry>()
const memoryBlockedIPs = new Map<string, number>()  // IP -> blockExpires timestamp

// Cleanup counters
let cleanupCounter = 0
const CLEANUP_INTERVAL = 100

function cleanupMemoryStores(): void {
  cleanupCounter++
  if (cleanupCounter < CLEANUP_INTERVAL) return
  cleanupCounter = 0

  const now = Date.now()

  // Clean expired rate limit entries
  for (const [key, entry] of memoryRateLimits.entries()) {
    if (now > entry.resetAt) {
      memoryRateLimits.delete(key)
    }
  }

  // Clean expired blocks
  for (const [ip, expires] of memoryBlockedIPs.entries()) {
    if (now > expires) {
      memoryBlockedIPs.delete(ip)
    }
  }
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkMemoryRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  cleanupMemoryStores()

  const now = Date.now()
  const key = `${config.keyPrefix}:${identifier}`
  const entry = memoryRateLimits.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    memoryRateLimits.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })

    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      resetAt: now + config.windowMs,
    }
  }

  if (entry.count >= config.requests) {
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++

  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Check if IP is blocked (memory fallback)
 */
function checkMemoryBlocked(identifier: string): { blocked: boolean; expires?: number } {
  const expires = memoryBlockedIPs.get(identifier)

  if (expires) {
    const now = Date.now()
    if (now < expires) {
      return { blocked: true, expires }
    } else {
      memoryBlockedIPs.delete(identifier)
      return { blocked: false }
    }
  }

  return { blocked: false }
}

/**
 * Record failed attempt (memory fallback)
 */
function recordMemoryFailedAttempt(identifier: string): { blocked: boolean; expires?: number } {
  const config = DEFAULT_RATE_LIMITS.FAILED_ATTEMPTS
  const result = checkMemoryRateLimit(identifier, config)

  // Check if we just exceeded the limit
  if (!result.success) {
    const now = Date.now()
    const expires = now + BLOCK_DURATION_MS
    memoryBlockedIPs.set(identifier, expires)

    console.error(`[SECURITY] IP ${identifier} blocked for ${BLOCK_DURATION_MS / 60000}m due to failed attempts`)

    return { blocked: true, expires }
  }

  return { blocked: false }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check general API rate limit for an IP
 * Uses Redis if available, falls back to memory
 */
export async function checkGeneralRateLimit(ip: string): Promise<RateLimitResult> {
  if (redisAvailable) {
    try {
      return await checkRedisRateLimit(ip, DEFAULT_RATE_LIMITS.GENERAL)
    } catch {
      // Fall through to memory
    }
  }
  return checkMemoryRateLimit(ip, DEFAULT_RATE_LIMITS.GENERAL)
}

/**
 * Check auth endpoint rate limit (stricter)
 */
export async function checkAuthRateLimit(ip: string): Promise<RateLimitResult> {
  if (redisAvailable) {
    try {
      return await checkRedisRateLimit(ip, DEFAULT_RATE_LIMITS.AUTH)
    } catch {
      // Fall through to memory
    }
  }
  return checkMemoryRateLimit(ip, DEFAULT_RATE_LIMITS.AUTH)
}

/**
 * Check sensitive endpoint rate limit (strictest)
 */
export async function checkSensitiveRateLimit(ip: string): Promise<RateLimitResult> {
  if (redisAvailable) {
    try {
      return await checkRedisRateLimit(ip, DEFAULT_RATE_LIMITS.SENSITIVE)
    } catch {
      // Fall through to memory
    }
  }
  return checkMemoryRateLimit(ip, DEFAULT_RATE_LIMITS.SENSITIVE)
}

/**
 * Check if IP is temporarily blocked due to suspicious activity
 */
export async function isBlocked(ip: string): Promise<{ blocked: boolean; expires?: number }> {
  if (redisAvailable) {
    try {
      return await checkRedisBlocked(ip)
    } catch {
      // Fall through to memory
    }
  }
  return checkMemoryBlocked(ip)
}

/**
 * Record a failed security attempt (may trigger temporary block)
 */
export async function recordFailedAttempt(ip: string, _reason: string): Promise<void> {
  if (redisAvailable) {
    try {
      await recordRedisFailedAttempt(ip)
      return
    } catch {
      // Fall through to memory
    }
  }
  recordMemoryFailedAttempt(ip)
}

/**
 * Check Redis health status
 */
export function isRedisHealthy(): boolean {
  return redisAvailable
}

/**
 * Get rate limiting statistics (for monitoring)
 */
export async function getRateLimitStats(): Promise<{
  redisConnected: boolean
  memoryEntries: number
  memoryBlocked: number
}> {
  return {
    redisConnected: redisAvailable,
    memoryEntries: memoryRateLimits.size,
    memoryBlocked: memoryBlockedIPs.size,
  }
}
