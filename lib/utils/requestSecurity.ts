// Request signature and anti-replay protection utilities
// Uses Web Crypto API for HMAC-SHA256

// Secret key for HMAC - should match on client and server
// In production, this should be injected at build time
const getSecretKey = (): string => {
  return process.env.NEXT_PUBLIC_REQUEST_SECRET || ""
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
  const secret = getSecretKey()
  if (!secret) {
    throw new Error("Request signature secret not configured")
  }

  // Sort keys for consistent hashing
  const sortedPayload = sortObjectKeys(payload)
  const dataString = JSON.stringify(sortedPayload) + timestamp

  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
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
    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(signature, expected)
  } catch {
    return false
  }
}

/**
 * Generate timestamp and signature for request
 * @param payload - Request body data
 * @returns Object with timestamp and signature
 */
export async function generateRequestAuth(
  payload: Record<string, unknown>
): Promise<{ timestamp: number; signature: string }> {
  const timestamp = Date.now()
  const signature = await generateRequestSignature(payload, timestamp)
  return { timestamp, signature }
}

/**
 * Check if request is within acceptable time window (anti-replay)
 * @param timestamp - Request timestamp
 * @param windowMs - Time window in milliseconds (default 30 seconds)
 * @returns boolean
 */
export function isRequestFresh(
  timestamp: number,
  windowMs: number = 30000
): boolean {
  const now = Date.now()
  const diff = now - timestamp
  return diff >= 0 && diff <= windowMs
}

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
 * Middleware function to validate request signature and freshness
 * Returns null if valid, error response if invalid
 */
export async function validateSecureRequest(
  req: Request,
  body: Record<string, unknown>
): Promise<{ error: string; status: number } | null> {
  const signature = req.headers.get("x-request-signature")
  const timestamp = req.headers.get("x-request-timestamp")

  if (!signature || !timestamp) {
    return { error: "Missing authentication headers", status: 401 }
  }

  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) {
    return { error: "Invalid timestamp", status: 400 }
  }

  // Check freshness (anti-replay)
  if (!isRequestFresh(ts)) {
    return { error: "Request expired", status: 401 }
  }

  // Verify signature
  const isValid = await verifyRequestSignature(body, ts, signature)
  if (!isValid) {
    return { error: "Invalid request signature", status: 401 }
  }

  return null
}
