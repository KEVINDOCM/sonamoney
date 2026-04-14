/**
 * Cloudflare Turnstile CAPTCHA Server-Side Verification
 * 
 * This file contains server-side only code for validating Turnstile tokens.
 * It must NOT include any React/client-side code.
 */

// Server-side verification result interface
export interface TurnstileVerificationResult {
  valid: boolean
  reason?: "success" | "verification_failed" | "action_mismatch" |
            "hostname_mismatch" | "token_expired" | "missing_secret" | "network_error"
  action?: string
  hostname?: string
  tokenAge?: number
  errors?: string[]
}

// Server-side verification helper with retry logic and idempotency
export async function verifyTurnstileToken(
  token: string,
  options?: {
    remoteip?: string
    expectedAction?: string
    expectedHostname?: string
    maxTokenAge?: number  // in minutes, default 5
    maxRetries?: number   // default 3
  }
): Promise<TurnstileVerificationResult> {
  // Dev bypass
  if (!token || token === "dev-bypass-token") {
    return process.env.NODE_ENV === "development"
      ? { valid: true, reason: "success" }
      : { valid: false, reason: "verification_failed" }
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.error("[CAPTCHA] Secret key not configured")
    return { valid: false, reason: "missing_secret" }
  }

  // Generate idempotency key for this verification attempt (Node.js compatible)
  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`
  const maxRetries = options?.maxRetries ?? 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      // Use FormData as recommended by Cloudflare for better compatibility
      const formData = new FormData()
      formData.append("secret", secretKey)
      formData.append("response", token)
      formData.append("idempotency_key", idempotencyKey)
      if (options?.remoteip) {
        formData.append("remoteip", options.remoteip)
      }

      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      // If last attempt, return result regardless
      if (attempt === maxRetries && !data.success) {
        return {
          valid: false,
          reason: "verification_failed",
          errors: data["error-codes"]
        }
      }

      // If not last attempt and failed, retry
      if (!data.success) {
        const retryable = ["timeout-or-duplicate", "internal-error"]
        const shouldRetry = data["error-codes"]?.some((code: string) => retryable.includes(code))

        if (shouldRetry && attempt < maxRetries) {
          console.warn(`[CAPTCHA] Retrying after error: ${data["error-codes"]?.join(", ")}`)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          continue
        }

        return {
          valid: false,
          reason: "verification_failed",
          errors: data["error-codes"]
        }
      }

      // Success - validate additional fields
      // Validate action
      if (options?.expectedAction && data.action !== options.expectedAction) {
        console.warn(`[CAPTCHA] Action mismatch: expected ${options.expectedAction}, got ${data.action}`)
        return {
          valid: false,
          reason: "action_mismatch",
          action: data.action
        }
      }

      // Validate hostname
      if (options?.expectedHostname && data.hostname !== options.expectedHostname) {
        console.warn(`[CAPTCHA] Hostname mismatch: expected ${options.expectedHostname}, got ${data.hostname}`)
        return {
          valid: false,
          reason: "hostname_mismatch",
          hostname: data.hostname
        }
      }

      // Validate token age
      const challengeTime = new Date(data.challenge_ts)
      const now = new Date()
      const ageMinutes = (now.getTime() - challengeTime.getTime()) / (1000 * 60)
      const maxAge = options?.maxTokenAge ?? 5

      if (ageMinutes > maxAge) {
        console.warn(`[CAPTCHA] Token expired: ${ageMinutes.toFixed(1)} minutes old`)
        return {
          valid: false,
          reason: "token_expired",
          tokenAge: ageMinutes
        }
      }

      return {
        valid: true,
        reason: "success",
        action: data.action,
        hostname: data.hostname,
        tokenAge: ageMinutes
      }

    } catch (error) {
      if (attempt === maxRetries) {
        console.error("[CAPTCHA] Verification error after all retries:", error)
        return { valid: false, reason: "network_error" }
      }
      // Exponential backoff before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  // Should not reach here, but just in case
  return { valid: false, reason: "network_error" }
}
