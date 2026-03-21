// Centralized Security Configuration
// All environment variables and security settings in one place

// Request signing secret - SERVER-SIDE ONLY (not NEXT_PUBLIC_)
// This secret is used for HMAC-SHA256 request signing and must never be exposed to the client
export const REQUEST_SECRET = process.env.REQUEST_SECRET || ""

// Admin IPs for maintenance/testing grace period (comma-separated)
export const MAINTENANCE_ADMIN_IPS = (process.env.MAINTENANCE_ADMIN_IPS || "")
  .split(",")
  .map(ip => ip.trim())
  .filter(Boolean)

// Check if an IP is an admin IP for validation leniency
export function isAdminIp(ip: string): boolean {
  return MAINTENANCE_ADMIN_IPS.includes(ip)
}

// Anti-replay settings
export const REQUEST_TIMEOUT_MS = 30000 // 30 seconds

// Rate limiting
export const MAX_LOGIN_ATTEMPTS = 5
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// Password settings
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

// Validation settings
export const MAX_EMAIL_LENGTH = 254

// Check if required secrets are configured
export function validateSecurityConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  if (!REQUEST_SECRET || REQUEST_SECRET.length < 16) {
    missing.push("REQUEST_SECRET (must be at least 16 characters, server-side only)")
  }

  return { valid: missing.length === 0, missing }
}
