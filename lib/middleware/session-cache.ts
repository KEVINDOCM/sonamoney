// Session caching for middleware to reduce Supabase auth calls
// Caches authenticated sessions for 60 seconds to improve TTFB

import { Redis } from "@upstash/redis"

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

// In-memory fallback for Edge runtime
const memoryCache = new Map<string, { userId: string; expires: number }>()

const CACHE_TTL_SECONDS = 60 // 1 minute session cache

interface CachedSession {
  userId: string
  email?: string
  role?: string
}

/**
 * Get cached session by session token
 * Returns null if not found or expired
 */
export async function getCachedSession(sessionToken: string): Promise<CachedSession | null> {
  if (!sessionToken) return null

  const cacheKey = `session:${sessionToken}`

  // Try Redis first
  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey)
      if (cached) {
        return JSON.parse(cached) as CachedSession
      }
    } catch {
      // Fall through to memory
    }
  }

  // Try memory cache (Edge runtime compatible)
  const memoryEntry = memoryCache.get(cacheKey)
  if (memoryEntry && memoryEntry.expires > Date.now()) {
    return { userId: memoryEntry.userId }
  }

  return null
}

/**
 * Cache session after successful auth verification
 */
export async function cacheSession(
  sessionToken: string,
  session: CachedSession
): Promise<void> {
  if (!sessionToken) return

  const cacheKey = `session:${sessionToken}`

  // Cache in Redis
  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(session), { ex: CACHE_TTL_SECONDS })
    } catch {
      // Silent fail - will use memory cache
    }
  }

  // Cache in memory (for Edge runtime)
  memoryCache.set(cacheKey, {
    userId: session.userId,
    expires: Date.now() + CACHE_TTL_SECONDS * 1000,
  })

  // Cleanup old memory entries periodically
  if (memoryCache.size > 1000) {
    const now = Date.now()
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expires < now) {
        memoryCache.delete(key)
      }
    }
  }
}

/**
 * Clear cached session (on logout or token refresh)
 */
export async function clearCachedSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return

  const cacheKey = `session:${sessionToken}`

  if (redis) {
    try {
      await redis.del(cacheKey)
    } catch {
      // Silent fail
    }
  }

  memoryCache.delete(cacheKey)
}
