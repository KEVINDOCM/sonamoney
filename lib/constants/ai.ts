// ============================================
// Model — use stable v1 endpoint compatible model
export const AI_MODEL = "gemini-2.5-flash"
export const AI_MODEL_FALLBACK = "gemini-1.5-flash-001"

// Token limits
export const AI_MAX_TOKENS_PER_REQUEST = 900000
export const AI_TOKEN_WARNING_THRESHOLD = 0.8
export const AI_TOKEN_SAFETY_MARGIN = 50000

// Rate limits — match Gemini free tier
export const AI_MAX_REQUESTS_PER_MINUTE = 12
export const AI_MAX_REQUESTS_PER_HOUR = 100
export const AI_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
export const AI_RATE_LIMIT_MINUTE_MS = 60 * 1000

// General API rate limits
export const API_MAX_REQUESTS_PER_MINUTE = 60
export const API_RATE_LIMIT_WINDOW_MS = 60 * 1000

// Context optimization
export const AI_MAX_TRANSACTIONS_CONTEXT = 10 // reduced from 30
export const AI_MAX_CATEGORIES_CONTEXT = 5 // top 5 only
export const AI_CONTEXT_DAYS = 10 // last 10 days only

// Retry
export const AI_RETRY_MAX_ATTEMPTS = 2
export const AI_RETRY_DELAY_MS = 10000

// Other constants
export const AI_MAX_MESSAGE_LENGTH = 500
export const AI_MAX_HISTORY_MESSAGES = 10
export const AI_CONTEXT_CURRENCY_DEFAULT = "IDR"

export const LS_KEY_AI_ONBOARDING = "sona_ai_onboarding_done"
export const LS_KEY_AI_ACCEPTED_DATE = "sona_ai_accepted_date"
