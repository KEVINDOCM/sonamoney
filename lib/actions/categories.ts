"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { revalidateCategoryPaths } from "@/lib/utils/revalidate";
import { ActionResult, CreateCategoryPayload, UpdateCategoryPayload } from "@/lib/types/actions";
import {
  INCOME_COLOR_PALETTE,
  EXPENSE_COLOR_PALETTE,
  DEFAULT_CATEGORY_COLOR,
} from "@/lib/constants/colors"
import { z } from "zod"
import { validateUUID, sanitizeText } from "@/lib/utils/validation"
import type { Category, CategoryType } from "@/types";

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } }>;
  };
  from?: (table: string) => QueryBuilder;
}

interface QueryBuilder {
  select: (columns: string, options?: { count?: string; head?: boolean }) => FilterBuilder;
  insert: (data: unknown | unknown[]) => Promise<{ error: Error | null }>;
  update: (data: unknown) => FilterBuilder;
  delete: () => FilterBuilder;
}

interface FilterBuilder {
  eq: (column: string, value: string | number | boolean) => FilterBuilder & PromiseExecutor;
  single: () => Promise<{ data: unknown | null; error: Error | null }>;
  order: (column: string, options: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: Error | null }>;
}

interface PromiseExecutor {
  then: (onfulfilled: (value: { data: unknown | null; error: { message: string; code?: string } | null }) => void) => Promise<void>;
}

const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  type: z.enum(["income", "expense"]),
  color: z.string().max(20).optional(),
  budget_limit: z.number().positive().nullable().optional(),
})

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).trim().optional(),
  type: z.enum(["income", "expense"]).optional(),
  color: z.string().max(20).optional(),
  budget_limit: z.number().positive().nullable().optional(),
})

export async function fetchCategories(): Promise<Category[]> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Category[];
}

export async function createCategory(payload: CreateCategoryPayload): Promise<ActionResult> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  // Validate payload with Zod
  const validationResult = createCategorySchema.safeParse(payload)
  if (!validationResult.success) {
    return { success: false, error: "Invalid category data" }
  }
  const safePayload = validationResult.data

  // Auto assign color logic based on type and existing count
  const INCOME_COLORS = INCOME_COLOR_PALETTE.slice(0, 3);
  const EXPENSE_COLORS = EXPENSE_COLOR_PALETTE.slice(0, 3);
  const colorsArray = safePayload.type === "income" ? INCOME_COLORS : EXPENSE_COLORS;

  // Get count of existing categories of the same type for this user
  const { data: countData, error: countError } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", safePayload.type);

  if (countError) {
    return { success: false, error: "Failed to count categories" };
  }

  const count = Array.isArray(countData) ? countData.length : 0;
  const assignedColor = safePayload.color ?? colorsArray[count % colorsArray.length] ?? DEFAULT_CATEGORY_COLOR;

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: sanitizeText(safePayload.name, 50),
    type: safePayload.type,
    color: assignedColor,
    budget_limit: safePayload.budget_limit ?? null,
  });

  if (error) {
    return { success: false, error: "Failed to create category. Please try again." }
  }

  revalidateCategoryPaths();
  return { success: true };
}

export async function updateCategory(payload: UpdateCategoryPayload): Promise<ActionResult> {
  // Validate UUID at start
  try {
    validateUUID(payload.id)
  } catch {
    return { success: false, error: "Invalid category ID" }
  }

  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  // Validate payload with Zod
  const validationResult = updateCategorySchema.safeParse(payload)
  if (!validationResult.success) {
    return { success: false, error: "Invalid category data" }
  }

  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.name = sanitizeText(payload.name, 50);
  if (payload.type !== undefined) updates.type = payload.type;
  if (payload.color !== undefined) updates.color = payload.color;
  if (payload.budget_limit !== undefined) updates.budget_limit = payload.budget_limit;

  const { error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", payload.id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Failed to update category. Please try again." };
  }

  revalidateCategoryPaths();
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  // Validate UUID at start
  try {
    validateUUID(id)
  } catch {
    return { success: false, error: "Invalid category ID" }
  }

  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Failed to delete category. Please try again." };
  }

  revalidateCategoryPaths();
  return { success: true };
}

export async function seedDefaultCategories(userId: string): Promise<void> {
  const { supabase: rawSupabase } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) return;

  const { data: countData } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const count = Array.isArray(countData) ? countData.length : 0;
  if (count > 0) return;

  const defaultCategories = [
    {
      name: "Salary",
      type: "income",
      color: INCOME_COLOR_PALETTE[0],
      user_id: userId,
      icon: "💼",
    },
    {
      name: "Freelance",
      type: "income",
      color: INCOME_COLOR_PALETTE[1],
      user_id: userId,
      icon: "💻",
    },
    {
      name: "Investment",
      type: "income",
      color: INCOME_COLOR_PALETTE[2],
      user_id: userId,
      icon: "📈",
    },
    {
      name: "Food",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[0],
      user_id: userId,
      icon: "🍔",
    },
    {
      name: "Transport",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[1],
      user_id: userId,
      icon: "🚗",
    },
    {
      name: "Shopping",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[2],
      user_id: userId,
      icon: "🛍️",
    },
    {
      name: "Bills",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[3],
      user_id: userId,
      icon: "📝",
    },
    {
      name: "Entertainment",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[4],
      user_id: userId,
      icon: "🎬",
    },
    {
      name: "Health",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[5] ?? DEFAULT_CATEGORY_COLOR,
      user_id: userId,
      icon: "❤️",
    },
    {
      name: "Education",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[6] ?? DEFAULT_CATEGORY_COLOR,
      user_id: userId,
      icon: "📚",
    },
    {
      name: "Housing",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[7] ?? DEFAULT_CATEGORY_COLOR,
      user_id: userId,
      icon: "🏠",
    },
    {
      name: "Travel",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[8] ?? DEFAULT_CATEGORY_COLOR,
      user_id: userId,
      icon: "✈️",
    },
    {
      name: "Savings",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[9] ?? DEFAULT_CATEGORY_COLOR,
      user_id: userId,
      icon: "💰",
    },
    {
      name: "Gifts",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[10] ?? DEFAULT_CATEGORY_COLOR,
      user_id: userId,
      icon: "🎁",
    },
    {
      name: "Subscriptions",
      type: "expense",
      color: EXPENSE_COLOR_PALETTE[11] ?? DEFAULT_CATEGORY_COLOR,
      user_id: userId,
      icon: "📺",
    },
    {
      name: "Others",
      type: "expense",
      color: "#95A5A6",
      user_id: userId,
      icon: "📦",
    },
  ];

  await supabase.from("categories").insert(defaultCategories);
}

export async function updateBudgetLimit(
  categoryId: string,
  budgetLimit: number | null
): Promise<ActionResult> {
  // Validate UUID at start
  try {
    validateUUID(categoryId)
  } catch {
    return { success: false, error: "Invalid category ID" }
  }

  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  if (!categoryId || typeof categoryId !== "string") {
    return { success: false, error: "Invalid category ID" };
  }

  if (budgetLimit !== null && (typeof budgetLimit !== "number" || budgetLimit < 0)) {
    return { success: false, error: "Invalid budget limit" };
  }

  const { error } = await supabase
    .from("categories")
    .update({ budget_limit: budgetLimit })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Failed to update budget" };
  }

  revalidateCategoryPaths();
  return { success: true };
}