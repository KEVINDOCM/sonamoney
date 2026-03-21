/**
 * Unified Security Module - Barrel Export
 * 
 * This file exports all security utilities organized by concern.
 * 
 * Usage Guide:
 * ─────────────────────────────────────────────────────────────────
 * 
 * 1. CLIENT COMPONENTS (Browser-only):
 *    import { generateSecureHeaders } from "@/lib/security/client"
 *    
 *    ⚠️ Client-side HMAC is DISABLED to prevent secret exposure.
 *    Authentication is via Supabase session only.
 * 
 * 2. SERVER COMPONENTS/API ROUTES (Node.js only):
 *    import { verifyRequestSignature } from "@/lib/security/server"
 *    import { checkRateLimit } from "@/lib/security/rateLimiter"
 *    
 *    ⚠️ These modules use server-side secrets and crypto APIs.
 * 
 * 3. UNIVERSAL UTILITIES (Safe everywhere):
 *    import { sanitizeXSS, isRequestFresh } from "@/lib/security"
 *    import { REQUEST_TIMEOUT_MS } from "@/lib/security/config"
 * 
 * Architecture:
 * ─────────────────────────────────────────────────────────────────
 * 
 * lib/security/
 * ├── index.ts         ← You are here (barrel exports)
 * ├── config.ts        Environment variables & constants
 * ├── server.ts        Server-only HMAC/crypto operations
 * ├── client.ts        Client-side headers (signatures disabled)
 * ├── validation.ts    Input validation & anti-replay
 * ├── sanitization.ts  XSS/injection protection
 * ├── rateLimiter.ts   Distributed Redis rate limiting
 * └── ARCHITECTURE.md  Full documentation
 * 
 * Deprecated:
 * - lib/utils/requestSecurity.ts → Use lib/security/server.ts
 * - lib/utils/clientSecurity.ts  → Use lib/security/client.ts
 */

// Config & Constants
export {
  REQUEST_SECRET,
  REQUEST_TIMEOUT_MS,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_WINDOW_MS,
  LOCKOUT_DURATION_MS,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_EMAIL_LENGTH,
  validateSecurityConfig,
} from "./config"

// Validation (Universal)
export {
  emailSchema,
  passwordSchema,
  loginSchema,
  signupSchema,
  isRequestFresh,
  getTimestamp,
  secureRequestSchema,
  type SecureRequest,
} from "./validation"

// Sanitization (Universal)
export {
  sanitizeXSS,
  stripHtml,
  sanitizeEmail,
  sanitizeFilename,
  escapeRegex,
} from "./sanitization"

// Re-export server-side validation utilities that API routes need
export { validateRequest, getClientIp, whitelistFields, TransactionWhitelist } from "./server"

// Rate Limiting Types
export type { RateLimitResult, RateLimitConfig } from "./rateLimiter"
