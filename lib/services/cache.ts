// Simple Redis Caching Service for Hot Queries
// Uses Upstash Redis with in-memory fallback

import { Redis } from "@upstash/redis"

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

// In-memory fallback cache (per-request only, not shared)
const memoryCache = new Map<string, { value: unknown; expires: number }>()

interface CacheOptions {
  ttl: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

const DEFAULT_TTL = 60 // 1 minute default

/**
 * Generate cache key from user ID and query identifier
 */
function generateCacheKey(userId: string, queryType: string, params?: Record<string, unknown>): string {
  const paramsHash = params ? JSON.stringify(params) : ""
  return `cache:${userId}:${queryType}:${paramsHash}`
}

/**
 * Get cached value or compute if not found
 * Simple pattern: check cache → fetch → store → return
 */
export async function withCache<T>(
  userId: string,
  queryType: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = { ttl: DEFAULT_TTL }
): Promise<T> {
  const key = generateCacheKey(userId, queryType)
  const ttl = options.ttl

  // Try Redis first
  if (redis) {
    try {
      const cached = await redis.get<string>(key)
      if (cached) {
        return JSON.parse(cached) as T
      }
    } catch {
      // Redis error - proceed to fetch
    }
  }

  // Try memory cache
  const memoryEntry = memoryCache.get(key)
  if (memoryEntry && memoryEntry.expires > Date.now()) {
    return memoryEntry.value as T
  }

  // Fetch fresh data
  const data = await fetchFn()

  // Store in Redis
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(data), { ex: ttl })
    } catch {
      // Redis error - silent fail
    }
  }

  // Store in memory cache
  memoryCache.set(key, { value: data, expires: Date.now() + ttl * 1000 })

  return data
}

/**
 * Invalidate cache for a user by query type
 */
export async function invalidateCache(userId: string, queryType?: string): Promise<void> {
  const pattern = queryType ? `cache:${userId}:${queryType}:*` : `cache:${userId}:*`

  // Clear memory cache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(pattern.replace("*", ""))) {
      memoryCache.delete(key)
    }
  }

  // Clear Redis cache
  if (!redis) return

  try {
    // Use scan to find keys matching pattern
    let cursor = "0"
    const keysToDelete: string[] = []

    do {
      const result = await redis.scan(cursor, { match: pattern, count: 100 })
      cursor = result[0]
      keysToDelete.push(...result[1])
    } while (cursor !== "0")

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete)
    }
  } catch {
    // Redis error - silent fail
  }
}

/**
 * Cache TTL presets for common queries
 */
export const CACHE_TTL = {
  DASHBOARD_SUMMARY: 30,    // 30 seconds - changes frequently
  CATEGORIES: 300,          // 5 minutes - changes rarely
  TRANSACTIONS: 60,         // 1 minute
  GOALS: 60,              // 1 minute
  BUDGET_DATA: 60,        // 1 minute
} as const
