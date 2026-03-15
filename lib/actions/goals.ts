"use server"

import { getAuthenticatedClient } from "@/lib/utils/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { validateOrThrow } from "@/lib/utils/validation"

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
        ...validated,
        user_id: user.id,
      })

    if (error) return { success: false, error: error.message }

    revalidatePath("/dashboard")
    revalidatePath("/goals")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    }
  }
}

export async function updateGoalAmount(
  goalId: string,
  currentAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
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

    if (error) return { success: false, error: error.message }

    revalidatePath("/dashboard")
    revalidatePath("/goals")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    }
  }
}

export async function deleteGoal(
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
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

    if (error) return { success: false, error: error.message }

    revalidatePath("/dashboard")
    revalidatePath("/goals")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    }
  }
}
