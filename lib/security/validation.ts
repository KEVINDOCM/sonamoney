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

// Anti-replay timestamp check
export const REQUEST_TIMEOUT_MS = 30000 // 30 seconds

export function isRequestFresh(timestamp: number, windowMs: number = REQUEST_TIMEOUT_MS): boolean {
  const now = Date.now()
  const diff = now - timestamp
  // Allow small negative diff for clock skew (max 5 seconds)
  return diff >= -5000 && diff <= windowMs
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
