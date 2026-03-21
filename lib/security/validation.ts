// Input validation utilities
import { z } from "zod"

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(254, "Email too long")

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")

// Anti-replay timestamp check - more lenient for user experience
export const REQUEST_TIMEOUT_MS = 60000 // 60 seconds (was 30 seconds)

export function isRequestFresh(timestamp: number, windowMs: number = REQUEST_TIMEOUT_MS): boolean {
  const now = Date.now()
  const diff = now - timestamp
  // Allow 120 seconds of clock skew in BOTH directions (client ahead or behind)
  // This handles users with fast/slow system clocks without compromising security
  return diff >= -120000 && diff <= windowMs
}

export function getTimestamp(): number {
  return Date.now()
}

// Request validation schema
export const secureRequestSchema = z.object({
  timestamp: z.number(),
  signature: z.string().optional(),
})

export type SecureRequest = z.infer<typeof secureRequestSchema>

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
})

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  website: z.string().optional(), // Honeypot field
})
