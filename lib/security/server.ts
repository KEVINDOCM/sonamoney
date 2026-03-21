// Server-side HMAC Cryptography Utilities
// ⚠️ SERVER-ONLY: This module uses server-side secrets and should never be imported in client components

import { REQUEST_SECRET } from "./config"

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
import { REQUEST_TIMEOUT_MS } from "./config"
import { sanitizeXSS } from "./sanitization"
import { isRequestFresh } from "./validation"

export interface ValidationResult {
  success: boolean
  error?: string
  status?: number
  data?: Record<string, unknown>
}

/**
 * Main request validation function - combines all security checks
 * Call this in every API route to validate:
 * 1. Request timestamp (anti-replay)
 * 2. Optional HMAC signature
 * 3. Input sanitization (XSS/injection)
 * 4. Zod schema validation
 */
export async function validateRequest(
  req: Request,
  body: Record<string, unknown>,
  schema?: z.ZodSchema
): Promise<ValidationResult> {
  // 1. Check timestamp header exists (required for anti-replay)
  const signature = req.headers.get("x-request-signature")
  const timestamp = req.headers.get("x-request-timestamp")

  if (!timestamp) {
    return {
      success: false,
      error: "Invalid request",
      status: 401,
    }
  }

  // 2. Check timestamp is valid number
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) {
    return {
      success: false,
      error: "Invalid request",
      status: 400,
    }
  }

  // 3. Anti-replay: Check freshness (always required)
  if (!isRequestFresh(ts)) {
    return {
      success: false,
      error: "Request expired",
      status: 401,
    }
  }

  // 4. Verify HMAC signature if provided (optional for backward compat)
  if (signature) {
    const isValid = await verifyRequestSignature(body, ts, signature)
    if (!isValid) {
      return {
        success: false,
        error: "Invalid signature",
        status: 401,
      }
    }
  }

  // 5. Check for XSS in string fields
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      const sanitized = sanitizeXSS(value)
      if (sanitized !== value.trim()) {
        return {
          success: false,
          error: "Invalid input",
          status: 400,
        }
      }
      // Update body with sanitized value
      body[key] = sanitized
    }
  }

  // 6. Zod schema validation (if provided)
  if (schema) {
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input",
        status: 400,
      }
    }
    return {
      success: true,
      data: parsed.data as Record<string, unknown>,
    }
  }

  return {
    success: true,
    data: body,
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
