// Client-side request security utilities
// Uses Web Crypto API for HMAC-SHA256

// Get secret from environment - injected at build time
const getClientSecret = (): string => {
  return process.env.NEXT_PUBLIC_REQUEST_SECRET || ""
}
/**
 * Generate HMAC-SHA256 signature for request body (client-side)
 * @param payload - The request body data
 * @param timestamp - Request timestamp
 * @returns HMAC-SHA256 hex string
 */
export async function generateClientSignature(
  payload: Record<string, unknown>,
  timestamp: number
): Promise<string> {
  const secret = getClientSecret()
  if (!secret) {
    console.warn("Request signature secret not configured")
    return ""
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
 * Generate authenticated request headers
 * @param payload - Request body data
 * @returns Headers object with signature and timestamp
 */
export async function generateSecureHeaders(
  payload: Record<string, unknown>
): Promise<Record<string, string>> {
  const timestamp = Date.now().toString()
  const signature = await generateClientSignature(payload, parseInt(timestamp, 10))

  return {
    "Content-Type": "application/json",
    "X-Request-Timestamp": timestamp,
    "X-Request-Signature": signature,
  }
}

/**
 * Make a secure POST request with signature
 * @param url - API endpoint
 * @param payload - Request body
 * @returns Fetch response
 */
export async function securePost(
  url: string,
  payload: Record<string, unknown>
): Promise<Response> {
  const headers = await generateSecureHeaders(payload)

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })
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
