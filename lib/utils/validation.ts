import { z } from "zod"

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

// Currency validation
export const currencySchema = z
  .enum(["USD", "IDR"])
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
