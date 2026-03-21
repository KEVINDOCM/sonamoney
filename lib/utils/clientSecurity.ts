// Client-side request security utilities
// DEPRECATED: Client-side HMAC signing has been disabled for security
// Server-side secret cannot be exposed to client - use Supabase session auth instead

// Client-side signatures are DISABLED to prevent secret exposure
// The server validates requests via Supabase session authentication
const CLIENT_SIGNATURE_DISABLED = true

/**
 * Generate HMAC-SHA256 signature (DISABLED for security)
 * ⚠️ DEPRECATED: Returns empty string - server-side secret cannot be exposed
 * @returns Empty string (client-side signing disabled)
 */
export async function generateClientSignature(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _payload: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _timestamp: number
): Promise<string> {
  if (CLIENT_SIGNATURE_DISABLED) {
    console.warn("[SECURITY] Client-side request signing is disabled. Using Supabase session auth.")
    return ""
  }
  return ""
}

/**
 * Generate request headers with timestamp (signature disabled)
 * @returns Headers object with Content-Type and timestamp only
 */
export async function generateSecureHeaders(): Promise<Record<string, string>> {
  return {
    "Content-Type": "application/json",
    "X-Request-Timestamp": Date.now().toString(),
    "X-Request-Signature": "", // Disabled - secret cannot be exposed
  }
}

/**
 * Make a secure POST request
 * Relies on Supabase session authentication instead of HMAC signatures
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

