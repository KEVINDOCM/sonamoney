// Centralized Security Utilities
// Hashing, timestamp checking, and input validation

import { z } from "zod"
import { REQUEST_SECRET, REQUEST_TIMEOUT_MS } from "./config"

// ============================================================================
// HASHING & SIGNATURE
// ============================================================================

/**
 * Generate HMAC-SHA256 signature for request body
 * @param payload - The request body data (must be serializable)
 * @param timestamp - Request timestamp in milliseconds
 * @returns HMAC-SHA256 hex string
 */
export async function generateRequestSignature(
  payload: Record<string, unknown>,
  timestamp: number
): Promise<string> {
  if (!REQUEST_SECRET) {
    throw new Error("Request secret not configured")
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
 * Verify HMAC-SHA256 signature
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
  try {
    const expected = await generateRequestSignature(payload, timestamp)
    return timingSafeEqual(signature, expected)
  } catch {
    return false
  }
}

// ============================================================================
// ANTI-REPLAY PROTECTION
// ============================================================================

/**
 * Check if request timestamp is within acceptable window
 * @param timestamp - Request timestamp in milliseconds
 * @returns boolean - true if request is fresh
 */
export function isRequestFresh(timestamp: number): boolean {
  const now = Date.now()
  const diff = now - timestamp
  // Allow small negative diff for clock skew (max 5 seconds)
  return diff >= -5000 && diff <= REQUEST_TIMEOUT_MS
}

/**
 * Get current timestamp for request signing
 */
export function getTimestamp(): number {
  return Date.now()
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Remove dangerous characters to prevent XSS and injection attacks
 * Removes: < > / \\ ' " javascript: on* event handlers
 */
export function sanitizeXSS(input: string): string {
  if (!input) return input
  return input
    .replace(/[<>]/g, "")           // Remove < and > (script tags)
    .replace(/[\\"']/g, "")        // Remove backslashes and quotes
    .replace(/\//g, "")            // Remove forward slashes
    .replace(/&/g, "&amp;")        // Escape ampersands
    .replace(/javascript:/gi, "")  // Remove javascript: protocol
    .replace(/on\w+=/gi, "")        // Remove event handlers (onclick, onerror, etc)
    .trim()
}

/**
 * Sanitize email address - lowercase, trim, and basic validation
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 254)
}

/**
 * Check if string contains suspicious/injection patterns
 * Returns true if suspicious characters detected
 */
export function containsSuspiciousChars(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /select\s+.*from/i,  // SQL injection
    /insert\s+into/i,
    /delete\s+from/i,
    /drop\s+table/i,
    /union\s+select/i,
    /--/,
    /;/,
  ]
  return suspiciousPatterns.some((pattern) => pattern.test(input))
}

// ============================================================================
// VALIDATION SCHEMAS - With strict type checking to prevent injection
// ============================================================================

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(254, "Email too long")
  // Reject if it looks like an object or array was passed
  .refine((val) => typeof val === "string" && !val.includes("[") && !val.includes("{"), {
    message: "Email must be a string",
  })

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character")
  // Reject if it looks like an object or array was passed
  .refine((val) => typeof val === "string" && !val.includes("[") && !val.includes("{"), {
    message: "Password must be a string",
  })

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long")
    .refine((val) => typeof val === "string" && !val.includes("[") && !val.includes("{"), {
      message: "Password must be a string",
    }),
})

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  website: z.string().optional(), // Honeypot field
})

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export interface ValidationResult {
  success: boolean
  error?: string
  status?: number
  data?: Record<string, unknown>
}

/**
 * Main request validation function - combines all security checks
 * Call this in every API route to validate:
 * 1. Request signature (HMAC)
 * 2. Timestamp freshness (anti-replay)
 * 3. Input sanitization (XSS/injection)
 * 4. Zod schema validation
 *
 * @param req - The Request object
 * @param body - Parsed request body
 * @param schema - Optional Zod schema for additional validation
 * @returns ValidationResult with success flag and parsed data or error
 *
 * Example usage:
 * ```ts
 * export async function POST(req: Request) {
 *   const body = await req.json()
 *   const result = await validateRequest(req, body, signupSchema)
 *   if (!result.success) {
 *     return Response.json({ error: result.error }, { status: result.status })
 *   }
 *   // Continue with validated result.data
 * }
 * ```
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
      error: "Invalid request",
      status: 401,
    }
  }

  // 4. Verify HMAC signature if provided (optional for backward compat)
  // Client-side signing disabled to prevent secret exposure
  // Primary auth is now via Supabase session
  if (signature) {
    const isValid = await verifyRequestSignature(body, ts, signature)
    if (!isValid) {
      return {
        success: false,
        error: "Invalid request",
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

/**
 * Security configuration exports
 */
export { REQUEST_TIMEOUT_MS, REQUEST_SECRET, validateSecurityConfig } from "./config"
export { generateClientSignature, generateSecureHeaders } from "./client"

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sort object keys recursively for consistent hashing
 */
function sortObjectKeys(obj: unknown): unknown {
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
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
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
// FIELD WHITELISTING - Prevent mass assignment attacks
// ============================================================================

/**
 * Whitelist object fields - only keep allowed fields
 * Use this to prevent attackers from injecting extra fields like 'role', 'is_admin'
 * @param input - The input object
 * @param allowedFields - Array of allowed field names
 * @returns Object with only allowed fields
 * @throws Error if extra fields are detected (optional strict mode)
 *
 * Example:
 * const safeData = whitelistFields(req.body, ['email', 'password', 'name'])
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

// ============================================================================
// ATOMIC OPERATIONS - Race condition prevention
// ============================================================================

/**
 * Build atomic increment operation for database
 * Use this instead of calculating balances in code
 * @param amount - Amount to add (positive for income, negative for expense)
 * @returns Database increment operation object
 *
 * Example with Supabase:
 * await supabase.from('accounts')
 *   .update({ balance: atomicIncrement(100) })
 *   .eq('id', accountId)
 */
export function atomicIncrement(amount: number): { increment: number } {
  return { increment: amount }
}

/**
 * Build atomic decrement operation
 * @param amount - Amount to subtract
 */
export function atomicDecrement(amount: number): { increment: number } {
  return { increment: -amount }
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Default security headers for all responses
 */
export const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://*.supabase.co; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=self, microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
}
