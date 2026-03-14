// @ts-nocheck
import type { SupabaseClient } from "@supabase/supabase-js"

// Adjust account balance by delta (positive or negative)
export async function adjustAccountBalance(
  supabase: SupabaseClient,
  accountId: string,
  delta: number
): Promise<void> {
  const { data: account, error: fetchError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single()

  if (fetchError || !account) {
    throw new Error(`Account not found: ${accountId}`)
  }

  const newBalance = (account.balance ?? 0) + delta

  const { error: updateError } = await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("id", accountId)

  if (updateError) {
    throw new Error(`Failed to update balance: ${updateError.message}`)
  }
}

// Get current account balance
export async function getAccountBalance(
  supabase: SupabaseClient,
  accountId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single()

  if (error || !data) {
    throw new Error(`Account not found: ${accountId}`)
  }

  return data.balance ?? 0
}

// Check if account has sufficient balance
export async function hasSufficientBalance(
  supabase: SupabaseClient,
  accountId: string,
  amount: number
): Promise<boolean> {
  const balance = await getAccountBalance(supabase, accountId)
  return balance >= amount
}
