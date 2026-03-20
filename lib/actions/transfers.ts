"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { revalidateAccountPaths } from "@/lib/utils/revalidate";
import { adjustAccountBalance, hasSufficientBalance } from "@/lib/utils/balance";
import { ActionResult, CreateTransferPayload } from "@/lib/types/actions";
import { TRANSFERS_PAGE_SIZE } from "@/lib/constants";
import type { TransferWithAccounts } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod"
import { validateUUID, sanitizeNotes } from "@/lib/utils/validation"

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
  then: (onfulfilled: (value: { data: unknown[] | null; error: Error | null }) => void) => Promise<void>;
}

const createTransferSchema = z.object({
  from_account_id: z.string().uuid("Invalid source account"),
  to_account_id: z.string().uuid("Invalid destination account"),
  amount: z.number().positive("Amount must be positive").max(999999999999, "Amount too large"),
  from_currency: z.string().max(10).default("IDR"),
  to_currency: z.string().max(10).default("IDR"),
  exchange_rate: z.number().positive().default(1),
  converted_amount: z.number().positive().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  notes: z.string().max(500).nullable().optional(),
})

export async function createTransfer(data: CreateTransferPayload): Promise<ActionResult> {
  const validationResult = createTransferSchema.safeParse(data)
  if (!validationResult.success) {
    return { success: false, error: "Invalid transfer data" }
  }
  const safeData = validationResult.data

  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;
  const typedSupabase = rawSupabase as SupabaseClient;

  if (safeData.from_account_id === safeData.to_account_id) {
    return { success: false, error: "Cannot transfer to the same account" };
  }

  // Verify both accounts belong to authenticated user
  if (!supabase.from) {
    return { success: false, error: "Database client not available" }
  }

  const { data: ownedAccounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)

  const ownedIds = (ownedAccounts as { id: string }[] ?? []).map((a) => a.id)
  if (
    !ownedIds.includes(safeData.from_account_id) ||
    !ownedIds.includes(safeData.to_account_id)
  ) {
    return { success: false, error: "Account not found" }
  }

  // Check sufficient balance
  const hasBalance = await hasSufficientBalance(typedSupabase as unknown as Parameters<typeof hasSufficientBalance>[0], safeData.from_account_id, safeData.amount);
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
      from_account_id: safeData.from_account_id,
      to_account_id: safeData.to_account_id,
      amount: safeData.amount,
      from_currency: safeData.from_currency,
      to_currency: safeData.to_currency,
      exchange_rate: safeData.exchange_rate,
      converted_amount: safeData.converted_amount ?? safeData.amount,
      date: safeData.date,
      notes: sanitizeNotes(safeData.notes),
      user_id: user.id,
    });

  if (insertError) return { success: false, error: "Failed to create transfer. Please try again." };

  // Calculate converted amount for different currencies
  const fromCurrency = data.from_currency ?? "IDR";
  const toCurrency = data.to_currency ?? "IDR";
  const exchangeRate = data.exchange_rate ?? 1;
  const convertedAmount = data.converted_amount ?? (fromCurrency === toCurrency ? data.amount : data.amount * exchangeRate);

  // Adjust balances using utility functions - use converted amount for destination if different currency
  await adjustAccountBalance(typedSupabase as unknown as Parameters<typeof adjustAccountBalance>[0], data.from_account_id, -data.amount);
  await adjustAccountBalance(typedSupabase as unknown as Parameters<typeof adjustAccountBalance>[0], data.to_account_id, convertedAmount);

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
  // Validate UUID at start
  try {
    validateUUID(id)
  } catch {
    return { success: false, error: "Invalid transfer ID" }
  }

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

  const typedTransfer = transfer as { 
    from_account_id: string; 
    to_account_id: string; 
    amount: number;
    converted_amount?: number;
    from_currency?: string;
    to_currency?: string;
    exchange_rate?: number;
  };

  // Calculate the amount to revert for destination account
  const fromCurrency = typedTransfer.from_currency ?? "IDR";
  const toCurrency = typedTransfer.to_currency ?? "IDR";
  const exchangeRate = typedTransfer.exchange_rate ?? 1;
  const convertedAmount = typedTransfer.converted_amount ?? (fromCurrency === toCurrency ? typedTransfer.amount : typedTransfer.amount * exchangeRate);

  // Revert balances using utility functions - restore original amounts
  await adjustAccountBalance(typedSupabase as unknown as Parameters<typeof adjustAccountBalance>[0], typedTransfer.from_account_id, typedTransfer.amount);
  await adjustAccountBalance(typedSupabase as unknown as Parameters<typeof adjustAccountBalance>[0], typedTransfer.to_account_id, -convertedAmount);

  // Delete transfer
  const { error: deleteError } = await supabase
    .from("transfers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) return { success: false, error: "Failed to delete transfer. Please try again." };

  revalidateAccountPaths();
  return { success: true };
}
