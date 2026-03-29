/**
 * Shared Validation Schemas
 * Single source of truth for all form and API validation
 * Used by both client and server for consistency
 */

import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency";

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid("Invalid ID format");

export const amountSchema = z
  .number()
  .positive("Amount must be positive")
  .finite("Amount must be finite")
  .max(999999999999, "Amount too large");

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const currencySchema = z
  .enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]])
  .default("IDR");

export const displayNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or less")
  .trim();

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

export const createCategorySchema = z.object({
  name: displayNameSchema,
  type: z.enum(["income", "expense"]),
  color: z.string().max(20).optional(),
  budget_limit: z.number().positive().nullable().optional(),
  icon: z.string().max(10).optional(),
});

export const updateCategorySchema = z.object({
  id: uuidSchema,
  name: displayNameSchema.optional(),
  type: z.enum(["income", "expense"]).optional(),
  color: z.string().max(20).optional(),
  budget_limit: z.number().positive().nullable().optional(),
  icon: z.string().max(10).optional(),
});

export const deleteCategorySchema = z.object({
  id: uuidSchema,
});

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const createTransactionSchema = z.object({
  category_id: uuidSchema,
  amount: amountSchema,
  type: z.enum(["income", "expense"]),
  date: dateSchema,
  notes: z.string().max(500).nullable().optional(),
  account_id: uuidSchema.nullable().optional(),
  tax_rate: z.number().min(0).max(100).nullable().optional(),
  commission_rate: z.number().min(0).max(100).nullable().optional(),
  currency: z.string().max(10).default("IDR"),
  exchange_rate_at_time: z.number().positive().default(1),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.number().int().positive().nullable().optional(),
  recurring_unit: z.enum(["day", "week", "month"]).nullable().optional(),
  recurring_next_date: dateSchema.nullable().optional(),
});

export const updateTransactionSchema = z.object({
  id: uuidSchema,
  category_id: uuidSchema.optional(),
  amount: amountSchema.optional(),
  type: z.enum(["income", "expense"]).optional(),
  date: dateSchema.optional(),
  notes: z.string().max(500).nullable().optional(),
  account_id: uuidSchema.nullable().optional(),
  currency: z.string().max(10).optional(),
  exchange_rate_at_time: z.number().positive().optional(),
  is_recurring: z.boolean().optional(),
  recurring_interval: z.number().int().positive().nullable().optional(),
  recurring_unit: z.enum(["day", "week", "month"]).nullable().optional(),
  recurring_next_date: dateSchema.nullable().optional(),
});

export const transactionIdSchema = z.object({
  id: uuidSchema,
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character");

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").max(254, "Email too long"),
  password: z.string().min(1, "Password is required").max(128, "Password too long"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address").max(254, "Email too long"),
  password: passwordSchema,
  website: z.string().optional(), // Honeypot field
});

// ============================================================================
// GOAL SCHEMAS
// ============================================================================

export const createGoalSchema = z.object({
  name: displayNameSchema,
  target_amount: amountSchema,
  target_date: dateSchema,
  category_id: uuidSchema.optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const updateGoalSchema = z.object({
  id: uuidSchema,
  name: displayNameSchema.optional(),
  target_amount: amountSchema.optional(),
  target_date: dateSchema.optional(),
  current_amount: z.number().min(0).optional(),
  category_id: uuidSchema.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Validation failed";
    throw new Error(message);
  }
  return result.data;
}
