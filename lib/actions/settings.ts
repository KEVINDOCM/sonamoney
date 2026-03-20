"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { ActionResult } from "@/lib/types/actions";
import { z } from "zod"
import { sanitizeText } from "@/lib/utils/validation"

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } }>;
    updateUser?: (data: { data: { display_name: string } }) => Promise<{ error: Error | null }>;
    resetPasswordForEmail?: (email: string, options: { redirectTo: string }) => Promise<{ error: Error | null }>;
    signOut?: () => Promise<{ error: Error | null }>;
  };
  from?: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{ data: unknown[] | null; error: Error | null }>;
    };
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      in: (column: string, values: string[]) => Promise<{ error: Error | null }>;
    };
  };
}

export async function updateDisplayName(displayName: string): Promise<ActionResult> {
  const nameSchema = z.string().min(1).max(50).trim()
  const parsed = nameSchema.safeParse(displayName)
  if (!parsed.success) {
    return { success: false, error: "Display name must be 1-50 characters" }
  }

  const { supabase, user } = await getAuthenticatedClient()
  const typedSupabase: SupabaseAuthClient = supabase

  if (!typedSupabase.auth.updateUser) {
    return { success: false, error: "Update not available" }
  }

  const safeName = sanitizeText(parsed.data, 50)

  const { error } = await typedSupabase.auth.updateUser({
    data: { display_name: safeName }
  })

  if (error) return { success: false, error: "Failed to update display name. Please try again." }
  revalidatePath("/settings")
  return { success: true }
}

export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const emailSchema = z.string().email().max(254)
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) {
    return { success: false, error: "Invalid email address" }
  }

  const client = await createSupabaseServerClient()
  const supabase: SupabaseAuthClient = client

  if (!supabase.auth.resetPasswordForEmail) {
    return { success: false, error: "Reset not available" }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sona-money.vercel.app"

  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: siteUrl + "/reset-password"
  })

  // Always return success to prevent email enumeration
  return { success: true }
}

export async function deleteAccount(): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    const typedSupabase: SupabaseAuthClient = supabase

    const userId = user.id

    if (!typedSupabase.from) {
      return { success: false, error: "Failed to delete account. Please try again." }
    }

    const { data: userAccounts } = await typedSupabase
      .from("accounts")
      .select("id")
      .eq("user_id", userId)

    if (userAccounts && userAccounts.length > 0) {
      const accountIds = (userAccounts as { id: string }[]).map((a) => a.id)
      await typedSupabase.from("transfers").delete().in("from_account_id", accountIds)
      await typedSupabase.from("transfers").delete().in("to_account_id", accountIds)
    }

    await typedSupabase.from("transactions").delete().eq("user_id", userId)
    await typedSupabase.from("categories").delete().eq("user_id", userId)
    await typedSupabase.from("accounts").delete().eq("user_id", userId)
    await typedSupabase.from("financial_health").delete().eq("user_id", userId)
    await typedSupabase.from("health_badges").delete().eq("user_id", userId)
    await typedSupabase.from("goals").delete().eq("user_id", userId)

    if (!typedSupabase.auth.signOut) {
      return { success: false, error: "Failed to delete account. Please try again." }
    }

    await typedSupabase.auth.signOut()
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete account. Please try again." }
  }
}
