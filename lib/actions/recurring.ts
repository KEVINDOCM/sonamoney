"use server";

import { getAuthenticatedClient } from "@/lib/utils/auth";
import type { Transaction } from "@/types";

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } }>;
  };
  from?: (table: string) => QueryBuilder;
}

interface QueryBuilder {
  select: (columns: string, options?: { count?: string; head?: boolean }) => FilterBuilder;
  insert: (data: unknown | unknown[]) => Promise<{ error: Error | null }>;
  update: (data: unknown) => FilterBuilder;
  delete: () => FilterBuilder;
}

interface FilterBuilder {
  eq: (column: string, value: string | number | boolean) => FilterBuilder & PromiseExecutor;
  single: () => Promise<{ data: unknown | null; error: Error | null }>;
  order: (column: string, options: { ascending: boolean }) => FilterBuilder & PromiseExecutor;
}

interface PromiseExecutor {
  then: (onfulfilled: (value: { data: unknown | null; error: Error | null }) => void) => Promise<void>;
}

export interface RecurringTransaction extends Transaction {
  categories?: {
    name: string;
    color: string;
    type: "income" | "expense";
    icon: string | null;
  } | null;
}

export async function fetchRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return [];
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      categories(name, color, type, icon)
    `)
    .eq("user_id", user.id)
    .eq("is_recurring", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as RecurringTransaction[];
}

export async function updateRecurringTransaction(
  id: string,
  updates: {
    amount?: number;
    category_id?: string;
    notes?: string | null;
    recurring_interval?: number;
    recurring_unit?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
