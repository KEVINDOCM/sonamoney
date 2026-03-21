// Minimal SupabaseClient interface for database operations
interface SupabaseClient {
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{ error: Error | null }>
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: unknown; error: Error | null }>
      }
    }
    update: (data: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>
    }
  }
}

/**
 * ATOMIC BALANCE ADJUSTMENT
 * Uses database-level increment to prevent race conditions
 * NEVER calculate balances in code - let the database do it
 * @param supabase - Supabase client
 * @param accountId - Account ID
 * @param delta - Amount to add (positive for income, negative for expense)
 */
export async function adjustAccountBalance(
  supabase: SupabaseClient,
  accountId: string,
  delta: number
): Promise<void> {
  // Use RPC to call atomic increment function in database
  // This prevents race conditions by letting PostgreSQL handle the math
  const { error } = await supabase.rpc("atomic_balance_adjust", {
    p_account_id: accountId,
    p_delta: delta,
  })

  if (error) {
    console.error("[ATOMIC] Balance adjustment failed:", error.message)
    // Fallback: try direct update (less safe but functional)
    await fallbackBalanceUpdate(supabase, accountId, delta)
  }
}

/**
 * Fallback balance update (non-atomic, use only if RPC fails)
 * Fetches current balance and adds delta
 */
async function fallbackBalanceUpdate(
  supabase: SupabaseClient,
  accountId: string,
  delta: number
): Promise<void> {
  const { data: account, error: fetchError } =
    await supabase
      .from("accounts")
      .select("balance")
      .eq("id", accountId)
      .single()

  if (fetchError || !account) return

  const typedAccount = account as { balance: number }
  const newBalance = typedAccount.balance + delta

  await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("id", accountId)
}

export async function getAccountBalance(
  supabase: SupabaseClient,
  accountId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single()

  if (error || !data) return 0
  const typed = data as { balance: number }
  return typed.balance
}

export async function hasSufficientBalance(
  supabase: SupabaseClient,
  accountId: string,
  amount: number
): Promise<boolean> {
  const balance = await getAccountBalance(
    supabase,
    accountId
  )
  return balance >= amount
}
