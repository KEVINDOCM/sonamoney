// CSRF (Cross-Site Request Forgery) Protection
// Double-Submit Cookie pattern implementation

import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

const CSRF_TOKEN_COOKIE = "csrf_token"
const CSRF_HEADER_NAME = "x-csrf-token"
const CSRF_TOKEN_LENGTH = 32

// Token expiration: 24 hours
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000

/**
 * Generate a cryptographically secure CSRF token using Web Crypto API
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("")
}

/**
 * Hash token for cookie storage (prevents token theft via XSS)
 * Uses Web Crypto API (Edge Runtime compatible)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token + (process.env.REQUEST_SECRET || "fallback-secret"))
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Set CSRF token cookie
 * Stores hashed version, returns plain token for client
 */
export async function setCSRFTokenCookie(): Promise<string> {
  const token = generateCSRFToken()
  const hashedToken = await hashToken(token)

  const cookieStore = await cookies()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(cookieStore as any).set(CSRF_TOKEN_COOKIE, hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TOKEN_EXPIRY_MS / 1000,
  })

  return token
}

/**
 * Get stored CSRF token hash from cookie
 */
export async function getCSRFTokenCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookie = (cookieStore as any).get(CSRF_TOKEN_COOKIE)
  return cookie?.value || null
}

/**
 * Clear CSRF token cookie
 */
export async function clearCSRFTokenCookie(): Promise<void> {
  const cookieStore = await cookies()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(cookieStore as any).delete(CSRF_TOKEN_COOKIE)
}

/**
 * Validate CSRF token from request header
 * Implements Double-Submit Cookie pattern
 */
export async function validateCSRFToken(
  requestToken: string | null
): Promise<{ valid: boolean; reason?: string }> {
  if (!requestToken) {
    return { valid: false, reason: "CSRF token missing from request header" }
  }

  const cookieToken = await getCSRFTokenCookie()

  if (!cookieToken) {
    return { valid: false, reason: "CSRF token cookie not found" }
  }

  // Hash the submitted token and compare with cookie
  const hashedRequestToken = await hashToken(requestToken)

  // Constant-time comparison to prevent timing attacks
  if (hashedRequestToken.length !== cookieToken.length) {
    return { valid: false, reason: "CSRF token mismatch" }
  }
  
  let isValid = true
  for (let i = 0; i < hashedRequestToken.length; i++) {
    if (hashedRequestToken[i] !== cookieToken[i]) {
      isValid = false
    }
  }

  if (!isValid) {
    return { valid: false, reason: "CSRF token mismatch" }
  }

  return { valid: true }
}

/**
 * Extract CSRF token from request headers
 * Supports multiple header formats
 */
export function extractCSRFToken(
  headers: { get: (name: string) => string | null }
): string | null {
  // Check standard header
  const token = headers.get(CSRF_HEADER_NAME)
  if (token) return token

  // Check alternative header (common in some frameworks)
  const altToken = headers.get("x-xsrf-token")
  if (altToken) return altToken

  return null
}

/**
 * Check if request method requires CSRF protection
 * Only state-changing operations need protection
 */
export function requiresCSRFProtection(method: string): boolean {
  const protectedMethods = ["POST", "PUT", "PATCH", "DELETE"]
  return protectedMethods.includes(method.toUpperCase())
}

/**
 * Middleware helper to validate CSRF for API routes
 * Returns error response if validation fails
 */
export async function csrfMiddleware(
  headers: { get: (name: string) => string | null }
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  const token = extractCSRFToken(headers)
  const validation = await validateCSRFToken(token)

  if (!validation.valid) {
    return {
      success: false,
      error: `CSRF validation failed: ${validation.reason}`,
      status: 403,
    }
  }

  return { success: true }
}

/**
 * Generate CSRF meta tag content for HTML forms
 * Use this in server components to embed token in page
 */
export async function generateCSRFMetaTag(): Promise<string> {
  const token = await setCSRFTokenCookie()
  return `<meta name="csrf-token" content="${token}">`
}

/**
 * Create CSRF token for client-side JavaScript
 * Returns token that should be added to fetch headers
 */
export async function getClientCSRFToken(): Promise<string> {
  // Check if token exists in cookie
  const existingToken = await getCSRFTokenCookie()

  if (existingToken) {
    // Generate new token to return (cookie already has hashed version)
    await setCSRFTokenCookie()
    return generateCSRFToken()
  }

  // No existing token, create new one
  return setCSRFTokenCookie()
}

/**
 * Refresh CSRF token (call after successful authentication)
 */
export async function refreshCSRFToken(): Promise<string> {
  await clearCSRFTokenCookie()
  return setCSRFTokenCookie()
}

// ============================================
// CSRF PROTECTED API ROUTE WRAPPER
// ============================================

/**
 * Wrapper for API routes to add CSRF protection
 * Usage:
 *   export const POST = withCSRFProtection(async (request) => {
 *     // Your handler logic
 *   })
 */
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<Response>
): (req: NextRequest) => Promise<Response> {
  return async (request): Promise<Response> => {
    const req = request as NextRequest & { method: string; headers: { get: (name: string) => string | null } }
    // Skip CSRF for GET/HEAD/OPTIONS
    if (!requiresCSRFProtection(req.method)) {
      return handler(req)
    }

    // Validate CSRF token
    const token = extractCSRFToken(req.headers)
    const validation = await validateCSRFToken(token)

    if (!validation.valid) {
      return Response.json(
        { error: `CSRF validation failed: ${validation.reason}` },
        { status: 403 }
      )
    }

    return handler(request as NextRequest)
  }
}

/**
 * CSRF token endpoint
 * Client can fetch this to get a fresh token
 */
export async function getCSRFTokenEndpoint(): Promise<Response> {
  const token = await setCSRFTokenCookie()

  return Response.json(
    { csrfToken: token },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  )
}
