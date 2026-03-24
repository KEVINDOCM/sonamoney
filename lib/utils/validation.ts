import { z } from "zod"
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency"

// UUID validation
export const uuidSchema = z.string().uuid("Invalid ID format")

// Amount validation
export const amountSchema = z
  .number()
  .positive("Amount must be positive")
  .finite("Amount must be finite")

// Date validation (YYYY-MM-DD)
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")

// Currency validation — derives from SUPPORTED_CURRENCIES so schema stays in sync
export const currencySchema = z
  .enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]])
  .default("IDR")

// Display name validation
export const displayNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or less")
  .trim()

// Validate and return parsed data or throw
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Validation failed"
    throw new Error(message)
  }
  return result.data
}

// Password schema with strength requirements
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(
    /[^A-Za-z0-9]/,
    "Must contain a special character"
  )

// Login schema (less strict — just format)
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(254, "Email too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
})

// Signup schema (strict password) - includes honeypot field
export const signupSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(254, "Email too long"),
  password: passwordSchema,
  website: z.string().optional(), // Honeypot field - bots will fill this
})

// Enhanced XSS sanitization - removes dangerous characters
export function sanitizeXSS(input: string): string {
  return input
    .replace(/[<>]/g, "")     // Remove < and > (script tags)
    .replace(/[\"']/g, "")   // Remove quotes (attributes)
    .replace(/\//g, "")       // Remove forward slashes
    .replace(/\\/g, "")       // Remove backslashes
    .replace(/&/g, "&amp;")   // Escape ampersands
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "")  // Remove event handlers (onclick, onerror, etc)
    .trim()
}

// UUID validation helper
export function validateUUID(id: unknown): string {
  const result = uuidSchema.safeParse(id)
  if (!result.success) throw new Error("Invalid ID")
  return result.data
}

// Text sanitization utils
export function sanitizeText(input: string, maxLength: number = 255): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, "")
}

export function sanitizeNotes(input: string | null | undefined): string | null {
  if (!input) return null
  return input
    .trim()
    .slice(0, 500)
    .replace(/[<>]/g, "")
}
