"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { ActionResult } from "@/lib/types/actions";

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
  const { supabase, user } = await getAuthenticatedClient();
  const typedSupabase: SupabaseAuthClient = supabase;

  if (!typedSupabase.auth.updateUser) {
    return { success: false, error: "updateUser not available" };
  }

  const { error } = await typedSupabase.auth.updateUser({
    data: { display_name: displayName }
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const client = await createSupabaseServerClient();
  const supabase: SupabaseAuthClient = client;
  if (!supabase.auth.resetPasswordForEmail) {
    return { success: false, error: "resetPasswordForEmail not available" };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_SITE_URL + "/reset-password"
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteAccount(): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedClient();
  const typedSupabase: SupabaseAuthClient = supabase;

  const userId = user.id;

  if (!typedSupabase.from) {
    return { success: false, error: "Database client not available" };
  }

  // Clean up all user data before deleting account
  // 1. Get all user accounts for transfer cleanup
  const { data: userAccounts } = await typedSupabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id);

  if (userAccounts && userAccounts.length > 0) {
    const accountIds = (userAccounts as { id: string }[]).map((a) => a.id);
    await typedSupabase
      .from("transfers")
      .delete()
      .in("from_account_id", accountIds);
    await typedSupabase
      .from("transfers")
      .delete()
      .in("to_account_id", accountIds);
  }

  // 2. transactions (references accounts + categories)
  await typedSupabase.from("transactions").delete().eq("user_id", userId);

  // 3. categories
  await typedSupabase.from("categories").delete().eq("user_id", userId);

  // 4. accounts
  await typedSupabase.from("accounts").delete().eq("user_id", userId);

  // Sign out user (admin.deleteUser requires service role key)
  if (!typedSupabase.auth.signOut) {
    return { success: false, error: "signOut not available" };
  }
  await typedSupabase.auth.signOut();
  return { success: true };
}
