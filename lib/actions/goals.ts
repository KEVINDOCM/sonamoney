"use server"

import { getAuthenticatedClient } from "@/lib/utils/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { validateUUID, sanitizeText, sanitizeNotes, validateOrThrow } from "@/lib/utils/validation"

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  currency: string
  deadline: string | null
  icon: string
  color: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

const goalSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name too long"),
  target_amount: z
    .number()
    .positive("Target must be positive"),
  current_amount: z
    .number()
    .min(0, "Amount cannot be negative")
    .default(0),
  currency: z.string().default("IDR"),
  deadline: z.string().nullable().optional(),
  icon: z.string().default("🎯"),
  color: z.string().default("#00B9A7"),
})

interface SupabaseAuthClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: Error | null }>;
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: unknown | null; error: Error | null }>;
        };
      };
    };
    insert: (data: unknown) => Promise<{ error: Error | null }>;
    update: (data: unknown) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      };
    };
    delete: () => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      };
    };
  };
}

export async function fetchGoals(): Promise<Goal[]> {
  try {
    const { supabase: rawSupabase, user } = await getAuthenticatedClient()
    const supabase: SupabaseAuthClient = rawSupabase as unknown as SupabaseAuthClient

    if (!supabase.from) return []

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error || !data) return []
    return data as Goal[]
  } catch {
    return []
  }
}

export async function createGoal(
  payload: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase: rawSupabase, user } = await getAuthenticatedClient()
    const supabase: SupabaseAuthClient = rawSupabase as unknown as SupabaseAuthClient

    if (!supabase.from) {
      return { success: false, error: "Database not available" }
    }

    const validated = validateOrThrow(goalSchema, payload)

    const { error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        name: sanitizeText(validated.name, 50),
        target_amount: validated.target_amount,
        current_amount: validated.current_amount ?? 0,
        currency: validated.currency ?? "IDR",
        deadline: validated.deadline ?? null,
        icon: validated.icon ? sanitizeText(validated.icon, 10) : "🎯",
        color: validated.color ? sanitizeText(validated.color, 20) : "#00B9A7",
      })

    if (error) return { success: false, error: "Failed to create goal. Please try again." }

    revalidatePath("/dashboard")
    revalidatePath("/goals")
    return { success: true }
  } catch {
    return {
      success: false,
      error: "An error occurred. Please try again.",
    }
  }
}

export async function updateGoalAmount(
  goalId: string,
  currentAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate UUID at start
    try {
      validateUUID(goalId)
    } catch {
      return { success: false, error: "Invalid goal ID" }
    }

    const { supabase: rawSupabase, user } = await getAuthenticatedClient()
    const supabase: SupabaseAuthClient = rawSupabase as unknown as SupabaseAuthClient

    if (!supabase.from) {
      return { success: false, error: "Database not available" }
    }

    const amount = z
      .number()
      .min(0)
      .parse(currentAmount)

    const { data: goal, error: fetchError } = await supabase
      .from("goals")
      .select("target_amount")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !goal) {
      return { success: false, error: "Goal not found" }
    }

    const typedGoal = goal as { target_amount: number }
    const isCompleted = amount >= typedGoal.target_amount

    const { error } = await supabase
      .from("goals")
      .update({
        current_amount: amount,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId)
      .eq("user_id", user.id)

    if (error) return { success: false, error: "Failed to update goal. Please try again." }

    revalidatePath("/dashboard")
    revalidatePath("/goals")
    return { success: true }
  } catch {
    return {
      success: false,
      error: "An error occurred. Please try again.",
    }
  }
}

export async function deleteGoal(
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate UUID at start
    try {
      validateUUID(goalId)
    } catch {
      return { success: false, error: "Invalid goal ID" }
    }

    const { supabase: rawSupabase, user } = await getAuthenticatedClient()
    const supabase: SupabaseAuthClient = rawSupabase as unknown as SupabaseAuthClient

    if (!supabase.from) {
      return { success: false, error: "Database not available" }
    }

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId)
      .eq("user_id", user.id)

    if (error) return { success: false, error: "Failed to delete goal. Please try again." }

    revalidatePath("/dashboard")
    revalidatePath("/goals")
    return { success: true }
  } catch {
    return {
      success: false,
      error: "An error occurred. Please try again.",
    }
  }
}
