"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { revalidateAccountPaths } from "@/lib/utils/revalidate";
import { adjustAccountBalance, hasSufficientBalance } from "@/lib/utils/balance";
import { ActionResult, CreateTransferPayload } from "@/lib/types/actions";
import { TRANSFERS_PAGE_SIZE } from "@/lib/constants";
import type { TransferWithAccounts } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } }>;
  };
  from?: (table: string) => QueryBuilder;
}

interface QueryBuilder {
  select: (columns: string) => FilterBuilder;
  insert: (data: unknown) => Promise<{ error: Error | null }>;
  update: (data: unknown) => FilterBuilder;
  delete: () => FilterBuilder;
}

interface FilterBuilder {
  eq: (column: string, value: string) => FilterBuilder & PromiseExecutor;
  single: () => Promise<{ data: unknown | null; error: Error | null }>;
  order: (column: string, options: { ascending: boolean }) => FilterBuilder & PromiseExecutor;
  limit: (n: number) => Promise<{ data: unknown[] | null; error: Error | null }>;
}

interface PromiseExecutor {
  then: (onfulfilled: (value: { error: Error | null }) => void) => Promise<void>;
}

export async function createTransfer(data: CreateTransferPayload): Promise<ActionResult> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;
  const typedSupabase = rawSupabase as SupabaseClient;

  if (data.from_account_id === data.to_account_id) {
    return { success: false, error: "Cannot transfer to the same account" };
  }

  if (data.amount <= 0) return { success: false, error: "Amount must be greater than 0" };

  // Check sufficient balance
  const hasBalance = await hasSufficientBalance(typedSupabase as unknown as Parameters<typeof hasSufficientBalance>[0], data.from_account_id, data.amount);
  if (!hasBalance) {
    return { success: false, error: "Insufficient balance in source account" };
  }

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  // Insert transfer record
  const { error: insertError } = await supabase
    .from("transfers")
    .insert({
      from_account_id: data.from_account_id,
      to_account_id: data.to_account_id,
      amount: data.amount,
      from_currency: data.from_currency ?? "IDR",
      to_currency: data.to_currency ?? "IDR",
      exchange_rate: data.exchange_rate ?? 1,
      converted_amount: data.converted_amount ?? data.amount,
      date: data.date,
      notes: data.notes ?? null,
      user_id: user.id,
    });

  if (insertError) return { success: false, error: insertError.message };

  // Adjust balances using utility functions
  await adjustAccountBalance(typedSupabase as unknown as Parameters<typeof adjustAccountBalance>[0], data.from_account_id, -data.amount);
  await adjustAccountBalance(typedSupabase as unknown as Parameters<typeof adjustAccountBalance>[0], data.to_account_id, data.amount);

  revalidateAccountPaths();
  return { success: true };
}

export async function getTransfers(): Promise<TransferWithAccounts[]> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) return [];

  const { data, error } = await supabase
    .from("transfers")
    .select(`
      *,
      from_account:accounts!transfers_from_account_id_fkey(name, icon),
      to_account:accounts!transfers_to_account_id_fkey(name, icon)
    `)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(TRANSFERS_PAGE_SIZE);

  if (error) return [];
  return (data ?? []) as TransferWithAccounts[];
}

export async function deleteTransfer(id: string): Promise<ActionResult> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;
  const typedSupabase = rawSupabase as SupabaseClient;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  // Fetch transfer to revert balances
  const { data: transfer, error: fetchError } = await supabase
    .from("transfers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !transfer) return { success: false, error: "Transfer not found" };

  const typedTransfer = transfer as { from_account_id: string; to_account_id: string; amount: number };

  // Revert balances using utility functions
  await adjustAccountBalance(typedSupabase as unknown as Parameters<typeof adjustAccountBalance>[0], typedTransfer.from_account_id, typedTransfer.amount);
  await adjustAccountBalance(typedSupabase as unknown as Parameters<typeof adjustAccountBalance>[0], typedTransfer.to_account_id, -typedTransfer.amount);

  // Delete transfer
  const { error: deleteError } = await supabase
    .from("transfers")
    .delete()
    .eq("id", id);

  if (deleteError) return { success: false, error: deleteError.message };

  revalidateAccountPaths();
  return { success: true };
}
