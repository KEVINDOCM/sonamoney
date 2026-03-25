// ============================================
// BALANCE UTILITIES - ZERO-TRUST RELIABILITY SOP
// CR-2026-003: All balance operations are atomic via PostgreSQL RPC
// NO FALLBACKS - Fail fast on RPC errors (2026 Zero-Trust Reliability)
// ============================================

// Minimal SupabaseClient interface for database operations
interface SupabaseClient {
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{
    data: unknown;
    error: Error | null
  }>
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
 * Uses database-level atomic RPC function
 * NEVER calculate balances in code - let the database do it
 * CR-2026-003: Removed dangerous fallback - now fails fast on errors
 *
 * @param supabase - Supabase client
 * @param userId - User ID for security verification
 * @param accountId - Account ID
 * @param delta - Amount to add (positive for income, negative for expense)
 * @throws Error if RPC fails (Zero-Trust: fail fast, alert user)
 */
export async function adjustAccountBalance(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  delta: number
): Promise<void> {
  // Use RPC to call atomic increment function in database
  // This prevents race conditions by letting PostgreSQL handle the math
  const { data, error } = await supabase.rpc("atomic_balance_adjust", {
    p_user_id: userId,
    p_account_id: accountId,
    p_delta: delta,
  })

  if (error) {
    console.error("[CRITICAL] Balance adjustment RPC failed:", error.message)
    // CR-2026-003: Zero-Trust Reliability - fail fast, no unsafe fallback
    throw new Error(`Balance adjustment failed: ${error.message}. Please try again or contact support.`)
  }

  // Verify the RPC returned success
  const result = data as { success?: boolean; error?: string } | null
  if (!result?.success) {
    const errorMsg = result?.error || "Unknown error"
    console.error("[CRITICAL] Balance adjustment failed:", errorMsg)
    throw new Error(`Balance adjustment failed: ${errorMsg}`)
  }
}

/**
 * LEGACY BALANCE ADJUSTMENT (Deprecated)
 * Kept for backward compatibility during transition
 * @deprecated Use adjustAccountBalance with userId instead
 */
export async function adjustAccountBalanceLegacy(
  supabase: SupabaseClient,
  accountId: string,
  delta: number
): Promise<void> {
  // This version requires fetching user_id from auth context
  // Prefer adjustAccountBalance with explicit userId for better security
  const { data, error } = await supabase.rpc("atomic_balance_adjust", {
    p_user_id: null, // Will be resolved from auth context in function
    p_account_id: accountId,
    p_delta: delta,
  })

  if (error) {
    throw new Error(`Balance adjustment failed: ${error.message}`)
  }

  const result = data as { success?: boolean; error?: string } | null
  if (!result?.success) {
    throw new Error(`Balance adjustment failed: ${result?.error || "Unknown error"}`)
  }
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

/**
 * DANGEROUS FALLBACK REMOVED - CR-2026-003
 *
 * The fallbackBalanceUpdate function has been removed as part of the
 * 2026 Zero-Trust Reliability SOP. It was:
 * - Non-atomic (read-modify-write race condition)
 * - Encouraged unsafe fallback behavior
 * - Could corrupt the financial ledger
 *
 * Now: If the RPC fails, the system fails-fast and alerts the user.
 * This ensures data integrity is never compromised.
 */
