// Minimal SupabaseClient interface for database operations
interface SupabaseClient {
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

export async function adjustAccountBalance(
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
