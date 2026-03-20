"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { ActionResult } from "@/lib/types/actions";
import { z } from "zod"
import { sanitizeText } from "@/lib/utils/validation"
import { createClient } from "@supabase/supabase-js"
import { logAuditEvent } from "@/lib/utils/auditLog"

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } }>;
    updateUser?: (data: { data: { display_name: string } }) => Promise<{ error: Error | null }>;
    resetPasswordForEmail?: (email: string, options: { redirectTo: string }) => Promise<{ error: Error | null }>;
    signOut?: () => Promise<{ error: Error | null }>;
    signInWithPassword?: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>;
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
  // Require authenticated user
  try {
    await getAuthenticatedClient()
  } catch {
    return { success: false, error: "Authentication required" }
  }

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sonamoney.my.id"

  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: siteUrl + "/reset-password"
  })

  await logAuditEvent({
    eventType: "auth.password_reset.requested",
    eventStatus: "success",
    metadata: { email: parsed.data.slice(0, 3) + "***" },
  })

  // Always return success to prevent email enumeration
  return { success: true }
}

export async function deleteAccount(password: string): Promise<ActionResult> {
  // Validate password param
  if (!password || typeof password !== "string" || password.length < 1) {
    return { success: false, error: "Password is required to delete account" }
  }

  if (password.length > 128) {
    return { success: false, error: "Invalid password" }
  }

  try {
    const { supabase, user } = await getAuthenticatedClient()
    const typedSupabase: SupabaseAuthClient = supabase

    const userId = user.id

    // Re-authenticate user before deletion
    const userEmail = (user as { email?: string }).email
    if (!userEmail) {
      return { success: false, error: "Cannot verify identity. Please try again." }
    }

    // Verify password by attempting sign in
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!anonKey || !supabaseUrl) {
      return { success: false, error: "Failed to delete account. Please try again." }
    }

    const verifyClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false }
    })

    const { error: authError } = await (verifyClient.auth as { signInWithPassword?: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }> }).signInWithPassword!({
      email: userEmail,
      password,
    })

    if (authError) {
      return { success: false, error: "Incorrect password. Account deletion cancelled." }
    }

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
    await logAuditEvent({
      eventType: "account.deleted",
      eventStatus: "success",
      userId: userId,
      metadata: { deleted_at: new Date().toISOString() },
    })
    return { success: true }
  } catch {
    await logAuditEvent({
      eventType: "account.deleted",
      eventStatus: "failure",
      metadata: { reason: "deletion_error" },
    })
    return { success: false, error: "Failed to delete account. Please try again." }
  }
}
