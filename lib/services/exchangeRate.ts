"use client"

import {
  FALLBACK_IDR_RATE,
  DEFAULT_EXCHANGE_RATES,
  CACHE_DURATION_MS,
} from "@/lib/constants"
import { LS_KEY_EXCHANGE_RATES } from "@/lib/constants/storage"

interface RateCache {
  rates: Record<string, number>
  timestamp: number
  base: string
}

const CACHE_KEY = LS_KEY_EXCHANGE_RATES
const CACHE_DURATION = CACHE_DURATION_MS // 24 hours

export async function getExchangeRates(base: string = "USD"): Promise<Record<string, number>> {
  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed: RateCache = JSON.parse(cached)
      const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION
      const isSameBase = parsed.base === base
      if (!isExpired && isSameBase) {
        return parsed.rates
      }
    }
  } catch {
    // ignore cache errors
  }

  // Fetch from Frankfurter API
  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${base}&to=IDR` 
    )
    if (!response.ok) throw new Error("Failed to fetch rates")
    const data = await response.json()
    const rates: Record<string, number> = {
      ...data.rates,
      [base]: 1, // base currency rate is always 1
    }

    // Save to cache
    const cache: RateCache = {
      rates,
      timestamp: Date.now(),
      base,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    return rates
  } catch {
    // Return fallback rates if API fails
    return DEFAULT_EXCHANGE_RATES
  }
}

export function getRateFromCache(base: string = "USD"): Record<string, number> | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const parsed: RateCache = JSON.parse(cached)
    if (parsed.base !== base) return null
    return parsed.rates
  } catch {
    return null
  }
}
