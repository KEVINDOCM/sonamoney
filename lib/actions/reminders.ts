"use server";

import { getAuthenticatedClient } from "@/lib/utils/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface BillReminder {
  id: string;
  transaction_id: string;
  user_id: string;
  reminder_days_before: number;
  reminder_type: "email" | "notification" | "both";
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: unknown } }>;
  };
  from?: (table: string) => QueryBuilder;
}

interface QueryBuilder {
  select: (columns: string, options?: { count?: string; head?: boolean }) => FilterBuilder;
  insert: (data: unknown | unknown[]) => Promise<{ error: Error | null; data: unknown }>;
  update: (data: unknown) => FilterBuilder;
  delete: () => FilterBuilder;
}

interface FilterBuilder {
  eq: (column: string, value: string | number | boolean) => FilterBuilder & PromiseExecutor;
  gte: (column: string, value: string | number | boolean) => FilterBuilder & PromiseExecutor;
  lte: (column: string, value: string | number | boolean) => FilterBuilder & PromiseExecutor;
  single: () => Promise<{ data: unknown | null; error: Error | null }>;
  order: (column: string, options: { ascending: boolean }) => FilterBuilder & PromiseExecutor;
}

interface PromiseExecutor {
  then: (onfulfilled: (value: { data: unknown | null; error: Error | null }) => void) => Promise<void>;
}

export async function fetchBillReminders(): Promise<BillReminder[]> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return [];
  }

  const { data, error } = await supabase
    .from("bill_reminders")
    .select(`
      *,
      transactions(amount, type, notes, is_recurring, recurring_next_date, categories(name, color, icon))
    `)
    .eq("user_id", user.id)
    .eq("is_enabled", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as BillReminder[];
}

export async function createBillReminder(
  transactionId: string,
  reminderDaysBefore: number = 3,
  reminderType: "email" | "notification" | "both" = "notification"
): Promise<{ success: boolean; error?: string }> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const { error } = await supabase.from("bill_reminders").insert({
    user_id: user.id,
    transaction_id: transactionId,
    reminder_days_before: reminderDaysBefore,
    reminder_type: reminderType,
    is_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateBillReminder(
  id: string,
  updates: {
    reminder_days_before?: number;
    reminder_type?: "email" | "notification" | "both";
    is_enabled?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const { error } = await supabase
    .from("bill_reminders")
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

export async function deleteBillReminder(id: string): Promise<{ success: boolean; error?: string }> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const { error } = await supabase
    .from("bill_reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getUpcomingBills(daysAhead: number = 7): Promise<{
  id: string;
  transaction_id: string;
  amount: number;
  type: "income" | "expense";
  category_name: string;
  category_color: string;
  notes: string | null;
  next_date: string;
  days_remaining: number;
}[]> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return [];
  }

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      amount,
      type,
      notes,
      recurring_next_date,
      categories(name, color)
    `)
    .eq("user_id", user.id)
    .eq("is_recurring", true)
    .gte("recurring_next_date", today.toISOString().split("T")[0])
    .lte("recurring_next_date", futureDate.toISOString().split("T")[0])
    .order("recurring_next_date", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as any[]).map((item) => ({
    id: item.id,
    transaction_id: item.id,
    amount: item.amount,
    type: item.type,
    category_name: item.categories?.name || "Unknown",
    category_color: item.categories?.color || "#6b7280",
    notes: item.notes,
    next_date: item.recurring_next_date,
    days_remaining: Math.ceil(
      (new Date(item.recurring_next_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}
