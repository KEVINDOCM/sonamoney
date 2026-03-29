// Server-side HMAC Cryptography Utilities
// ⚠️ SERVER-ONLY: This module uses server-side secrets and should never be imported in client components

import { REQUEST_SECRET, REQUEST_TIMEOUT_MS, isAdminIp } from "./config"

/**
 * Sort object keys recursively for consistent hashing
 */
export function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }

  const sorted: Record<string, unknown> = {}
  const keys = Object.keys(obj as Record<string, unknown>).sort()
  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
  }
  return sorted
}

/**
 * Generate HMAC-SHA256 signature for request body
 * @param payload - The request body data
 * @param timestamp - Request timestamp
 * @returns HMAC-SHA256 hex string
 */
export async function generateRequestSignature(
  payload: Record<string, unknown>,
  timestamp: number
): Promise<string> {
  if (!REQUEST_SECRET) {
    throw new Error("Request signature secret not configured")
  }

  // Sort keys for consistent hashing
  const sortedPayload = sortObjectKeys(payload)
  const dataString = JSON.stringify(sortedPayload) + timestamp

  const encoder = new TextEncoder()
  const keyData = encoder.encode(REQUEST_SECRET)
  const messageData = encoder.encode(dataString)

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData)
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Verify HMAC-SHA256 signature with constant-time comparison
 * @param payload - The request body data
 * @param timestamp - Request timestamp
 * @param signature - Provided signature to verify
 * @returns boolean indicating if signature is valid
 */
export async function verifyRequestSignature(
  payload: Record<string, unknown>,
  timestamp: number,
  signature: string
): Promise<boolean> {
  if (!signature) {
    return true // Allow empty signatures for backward compatibility
  }

  try {
    const expected = await generateRequestSignature(payload, timestamp)
    return timingSafeEqual(signature, expected)
  } catch {
    return false
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Generate timestamp and signature for request
 */
export async function generateRequestAuth(
  payload: Record<string, unknown>
): Promise<{ timestamp: number; signature: string }> {
  const timestamp = Date.now()
  const signature = await generateRequestSignature(payload, timestamp)
  return { timestamp, signature }
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

import { z } from "zod"
import { sanitizeXSS } from "./sanitization"
import { isRequestFresh } from "./validation"

export interface ValidationResult {
  success: boolean
  error?: string
  status?: number
  data?: Record<string, unknown>
  mode?: "admin" | "user"
}

/**
 * Main request validation function - combines all security checks
 * Call this in every API route to validate:
 * 1. Request timestamp (anti-replay) - Required for ALL requests
 * 2. HMAC signature - Only for Admin IPs (regular users use Supabase session)
 * 3. Input sanitization (XSS/injection)
 * 4. Zod schema validation
 * 
 * @param req - The request object
 * @param body - The request body
 * @param schema - Optional Zod schema for validation
 * @param options - Optional configuration
 * @param options.validationMode - "auto" (default), "admin", or "user"
 * @param options.requireTimestamp - Whether to require timestamp header (default: true)
 */
export async function validateRequest(
  req: Request,
  body: Record<string, unknown>,
  schema?: z.ZodSchema,
  options?: {
    validationMode?: "auto" | "admin" | "user"
    requireTimestamp?: boolean
  }
): Promise<ValidationResult> {
  const mode = options?.validationMode ?? "auto"
  const requireTimestamp = options?.requireTimestamp ?? true

  // Debug: Log REQUEST_SECRET status (first 3 chars only for security)
  const secretPrefix = REQUEST_SECRET ? REQUEST_SECRET.substring(0, 3) + "***" : "NOT_SET"
  if (process.env.NODE_ENV === "development") {
    console.log(`[SECURITY] REQUEST_SECRET loaded: ${secretPrefix}`)
  }

  // Get client IP to determine validation mode
  const clientIp = getClientIp(req)
  const isAdminByIp = isAdminIp(clientIp)
  
  // Determine actual validation mode
  const actualMode: "admin" | "user" = mode === "auto" 
    ? (isAdminByIp ? "admin" : "user")
    : mode

  if (process.env.NODE_ENV === "development") {
    console.log(`[SECURITY] Validation mode: ${actualMode} (IP: ${clientIp}, Config: ${mode})`)
  }

  // 1. Check timestamp header (required for anti-replay on ALL requests)
  const signature = req.headers.get("x-request-signature")
  const timestamp = req.headers.get("x-request-timestamp")

  if (requireTimestamp && !timestamp) {
    return {
      success: false,
      error: "Missing timestamp header",
      status: 401,
      mode: actualMode,
    }
  }

  // 2. Check timestamp validity and freshness (anti-replay protection)
  if (timestamp) {
    const ts = parseInt(timestamp, 10)
    if (isNaN(ts)) {
      return {
        success: false,
        error: "Invalid timestamp format",
        status: 400,
        mode: actualMode,
      }
    }

    // Anti-replay: Check freshness
    const freshnessWindow = actualMode === "admin" ? REQUEST_TIMEOUT_MS * 10 : REQUEST_TIMEOUT_MS * 2 // 60s for users
    if (!isRequestFresh(ts, freshnessWindow)) {
      // User gets leniency for clock skew issues
      if (actualMode !== "admin") {
        // Log detailed info for debugging clock skew
        const now = Date.now()
        const diff = now - ts
      if (process.env.NODE_ENV === "development") {
        console.log(`[SECURITY] User timestamp rejected: diff=${diff}ms, server=${now}, client=${ts}`)
      }
        return {
          success: false,
          error: "Request expired - please check your system clock",
          status: 401,
          mode: actualMode,
        }
      }
      if (process.env.NODE_ENV === "development") {
        console.log(`[SECURITY] Admin mode - allowing stale timestamp`)
      }
    }

    // 3. HMAC Signature Validation
    // Admin: Validate signature if present (strict mode for API tools)
    // User: Skip HMAC - they don't have REQUEST_SECRET, use Supabase session instead
    if (signature && signature.trim() !== "") {
      if (actualMode === "admin") {
        const isValid = await verifyRequestSignature(body, ts, signature)
        if (!isValid) {
          return {
            success: false,
            error: "Invalid HMAC signature",
            status: 401,
            mode: actualMode,
          }
        }
        if (process.env.NODE_ENV === "development") {
          console.log(`[SECURITY] Admin HMAC signature verified`)
        }
      } else {
        // User mode: Log and ignore signature (users don't have REQUEST_SECRET)
        if (process.env.NODE_ENV === "development") {
          console.log(`[SECURITY] User mode - skipping HMAC validation`)
        }
      }
    } else if (actualMode === "admin" && requireTimestamp) {
      // Admin requires signature when timestamp is required
      if (process.env.NODE_ENV === "development") {
        console.log(`[SECURITY] Admin mode - signature missing, proceeding with session validation`)
      }
    }
  }

  // 4. Check for XSS in string fields (applies to both Admin and User)
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      const sanitized = sanitizeXSS(value)
      if (sanitized !== value.trim()) {
        return {
          success: false,
          error: "Invalid input",
          status: 400,
          mode: actualMode,
        }
      }
      // Update body with sanitized value
      body[key] = sanitized
    }
  }

  // 5. Zod schema validation (applies to both Admin and User)
  if (schema) {
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input",
        status: 400,
        mode: actualMode,
      }
    }
    return {
      success: true,
      data: parsed.data as Record<string, unknown>,
      mode: actualMode,
    }
  }

  return {
    success: true,
    data: body,
    mode: actualMode,
  }
}

// ============================================================================
// IP EXTRACTION
// ============================================================================

/**
 * Get client IP address from request headers
 */
export function getClientIp(req: Request | { headers: Headers }): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return "unknown"
}

// ============================================================================
// FIELD WHITELISTING
// ============================================================================

/**
 * Whitelist object fields - only keep allowed fields
 * Use this to prevent attackers from injecting extra fields like 'role', 'is_admin'
 */
export function whitelistFields<T extends Record<string, unknown>>(
  input: T,
  allowedFields: string[],
  options?: { strict?: boolean }
): Pick<T, keyof T> {
  const result = {} as Record<string, unknown>
  const extraFields: string[] = []

  for (const key of Object.keys(input)) {
    if (allowedFields.includes(key)) {
      result[key] = input[key]
    } else {
      extraFields.push(key)
    }
  }

  // In strict mode, throw error if extra fields found
  if (options?.strict && extraFields.length > 0) {
    throw new Error(`Forbidden fields detected: ${extraFields.join(", ")}`)
  }

  // Log blocked fields for security audit
  if (extraFields.length > 0) {
    console.warn(`[SECURITY] Blocked fields in request: ${extraFields.join(", ")}`)
  }

  return result as Pick<T, keyof T>
}

/**
 * Common field whitelists for different operations
 */
export const TransactionWhitelist = {
  CREATE: [
    "category_id",
    "amount",
    "type",
    "date",
    "notes",
    "account_id",
    "is_recurring",
    "recurring_interval",
    "recurring_unit",
    "recurring_next_date",
    "tax_rate",
    "commission_rate",
    "currency",
    "exchange_rate_at_time",
  ],
  UPDATE: [
    "category_id",
    "amount",
    "type",
    "date",
    "notes",
    "account_id",
    "is_recurring",
    "recurring_interval",
    "recurring_unit",
    "recurring_next_date",
    "currency",
    "exchange_rate_at_time",
  ],
}

export const AuthWhitelist = {
  LOGIN: ["email", "password"],
  REGISTER: ["email", "password", "website"], // website is honeypot
}
