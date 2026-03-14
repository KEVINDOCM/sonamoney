"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { revalidateAccountPaths, revalidateFinancePaths } from "@/lib/utils/revalidate";
import { ActionResult, CreateAccountPayload, UpdateAccountPayload } from "@/lib/types/actions";
import { validateOrThrow } from "@/lib/utils/validation";
import { z } from "zod";
import type { Account } from "@/types";

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } }>;
  };
  from?: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: Error | null }>;
      };
    };
    insert: (data: unknown) => {
      select: () => Promise<{ data: unknown[] | null; error: Error | null }>;
    };
    update: (data: unknown) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      };
    };
    delete: () => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      };
      or: (filter: string) => Promise<{ error: Error | null }>;
    };
  };
}

const DEFAULT_ACCOUNTS: CreateAccountPayload[] = [
  {
    name: "Tunai",
    type: "reguler",
    icon: "💵",
    currency: "IDR",
    is_default: true,
  },
  {
    name: "Kartu",
    type: "tabungan",
    icon: "💳",
    currency: "IDR",
    is_default: false,
  },
];

const createAccountSchema = z.object({
  name: z
    .string()
    .min(1, "Account name is required")
    .max(50, "Account name must be 50 characters or less")
    .trim(),
  type: z.enum(["reguler", "tabungan", "utang"]),
  currency: z.enum(["USD", "IDR"]).default("IDR"),
  balance: z.number().min(0, "Balance cannot be negative").default(0),
  icon: z.string().optional(),
  is_default: z.boolean().optional(),
});

const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().uuid("Invalid account ID"),
});

export async function getOrSeedAccounts(): Promise<Account[]> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) return [];

  const { data: existing, error: fetchError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (fetchError) return [];
  if (existing && existing.length > 0) return existing as Account[];

  // Seed default accounts
  const { data: seeded, error: seedError } = await supabase
    .from("accounts")
    .insert(DEFAULT_ACCOUNTS.map(a => ({ ...a, user_id: user.id })))
    .select();

  if (seedError) return [];
  return (seeded ?? []) as Account[];
}

export async function getAccounts(): Promise<Account[]> {
  try {
    const { supabase: rawSupabase, user } = await getAuthenticatedClient();
    const supabase: SupabaseAuthClient = rawSupabase;

    if (!supabase.from) return [];

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as Account[];
  } catch {
    return [];
  }
}

export async function createAccount(data: CreateAccountPayload): Promise<ActionResult> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const validated = validateOrThrow(createAccountSchema, data);

  const { error } = await supabase
    .from("accounts")
    .insert({ ...validated, user_id: user.id, balance: validated.balance ?? 0 })
    .select();

  if (error) return { success: false, error: error.message };
  revalidateAccountPaths();
  return { success: true };
}

export async function updateAccount(
  id: string,
  data: UpdateAccountPayload
): Promise<ActionResult> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const validated = validateOrThrow(updateAccountSchema, { ...data, id });

  const { error } = await supabase
    .from("accounts")
    .update(validated)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidateAccountPaths();
  return { success: true };
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  // Delete related transfers first
  await supabase
    .from("transfers")
    .delete()
    .or(`from_account_id.eq.${id},to_account_id.eq.${id}`);

  // Delete related transactions
  await supabase
    .from("transactions")
    .delete()
    .eq("account_id", id)
    .eq("user_id", user.id);

  // Then delete the account
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidateFinancePaths();
  return { success: true };
}
