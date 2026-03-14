// ============================================
// EXCHANGE RATES
// ============================================
export const FALLBACK_IDR_RATE = 16000
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  IDR: FALLBACK_IDR_RATE,
}

// ============================================
// CACHE
// ============================================
export const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

// ============================================
// TOAST
// ============================================
export const TOAST_DURATION_MS = 4000

// ============================================
// PAGINATION
// ============================================
export const TRANSACTIONS_PAGE_SIZE = 20
export const TRANSFERS_PAGE_SIZE = 20

// ============================================
// BUDGET THRESHOLDS
// ============================================
export const BUDGET_WARNING_THRESHOLD = 70  // percentage
export const BUDGET_DANGER_THRESHOLD = 100  // percentage

// ============================================
// RECURRING TRANSACTIONS
// ============================================
export const DEFAULT_RECURRING_INTERVAL = 1
export const DEFAULT_RECURRING_UNIT = "month"

// ============================================
// CURRENCY
// ============================================
export const DEFAULT_CURRENCY = "IDR"
export const BASE_CURRENCY_USD = "USD"

// ============================================
// BARREL EXPORTS
// ============================================
export * from "./storage"
export * from "./colors"
export * from "./ai"
