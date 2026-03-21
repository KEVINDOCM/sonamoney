// Client-side security utilities
// DEPRECATED: HMAC signatures require server-only secrets
// Keeping function for backward compatibility but signatures are no longer valid
// Rely on Supabase session auth for request security

// Client-side signatures are DISABLED for security (secret cannot be exposed)
// Server-side validation will accept requests with empty signatures when
// authenticated via Supabase session
const CLIENT_SIGNATURE_DISABLED = true

/**
 * Generate HMAC-SHA256 signature for request body (client-side)
 * ⚠️ DEPRECATED: Returns empty string - server-side secret cannot be exposed to client
 * @returns Empty string (signatures disabled for security)
 */
export async function generateClientSignature(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _payload: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _timestamp: number
): Promise<string> {
  if (CLIENT_SIGNATURE_DISABLED) {
    console.warn("[SECURITY] Client-side request signing is disabled. Relying on Supabase session auth.")
    return ""
  }
  return ""
}

/**
 * Generate authenticated request headers
 * @param payload - Request body data
 * @returns Headers object with timestamp (signature disabled for security)
 *
 * ⚠️ NOTE: Client-side HMAC signing has been disabled to prevent secret exposure.
 * The server now validates requests primarily via Supabase session authentication.
 * The X-Request-Signature header is kept for backward compatibility but is empty.
 */
export async function generateSecureHeaders(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _payload?: Record<string, unknown>
): Promise<Record<string, string>> {
  const timestamp = Date.now().toString()

  return {
    "Content-Type": "application/json",
    "X-Request-Timestamp": timestamp,
    "X-Request-Signature": "", // Disabled - server-only secret
  }
}

/**
 * Make a secure POST request (now relies on Supabase session auth)
 * @param url - API endpoint
 * @param payload - Request body
 * @returns Fetch response
 */
export async function securePost(
  url: string,
  payload: Record<string, unknown>
): Promise<Response> {
  const headers = await generateSecureHeaders()

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })
}

/**
 * Sort object keys recursively for consistent hashing
 * @deprecated Kept for reference but not used in client-side signing
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _sortObjectKeys(_obj: unknown): unknown {
  // Implementation removed - server-side only
  return null
}
