"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { revalidateTransactionPaths } from "@/lib/utils/revalidate";
import { adjustAccountBalance } from "@/lib/utils/balance";
import { withActionResult } from "@/lib/utils/actions";
import { validateUUID, sanitizeText, sanitizeNotes } from "@/lib/utils/validation";
import { ActionResult } from "@/lib/types/actions";
import type {
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from "@/lib/types/actions";
import {
  TRANSACTIONS_PAGE_SIZE,
  DEFAULT_RECURRING_INTERVAL,
  DEFAULT_RECURRING_UNIT,
} from "@/lib/constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transaction, TransactionType } from "@/types";
import { z } from "zod";

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
  range: (from: number, to: number) => Promise<{ data: unknown[] | null; error: Error | null; count: number | null }>;
}

interface PromiseExecutor {
  then: (onfulfilled: (value: { data: unknown | null; error: Error | null; count?: number | null }) => void) => Promise<void>;
}

export interface FetchTransactionsParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSeriesPoint {
  date: string;
  income: number;
  expense: number;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  hasAnyTransactions: boolean;
  series: DashboardSeriesPoint[];
}

export async function fetchTransactions(
  params: FetchTransactionsParams = {}
): Promise<PaginatedTransactions> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : TRANSACTIONS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
    };
  }

  const { data, error, count } = await supabase
    .from("transactions")
    .select("*, categories(name, color, type, icon)", { count: "exact" })
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .range(from, to);

  if (error || !data || count === null) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
    };
  }

  return {
    items: data as Transaction[],
    total: count,
    page,
    pageSize,
  };
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      totalBalance: 0,
      hasAnyTransactions: false,
      series: [],
    };
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("date, amount, type")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error || !data || (data as unknown[]).length === 0) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      totalBalance: 0,
      hasAnyTransactions: false,
      series: [],
    };
  }

  let totalIncome = 0;
  let totalExpense = 0;

  const byDate = new Map<string, { income: number; expense: number }>();

  for (const row of data as { date: string; amount: number; type: TransactionType }[]) {
    const key = row.date;
    if (!byDate.has(key)) {
      byDate.set(key, { income: 0, expense: 0 });
    }

    const entry = byDate.get(key);
    if (!entry) continue;

    if (row.type === "income") {
      entry.income += row.amount;
      totalIncome += row.amount;
    } else {
      entry.expense += row.amount;
      totalExpense += row.amount;
    }
  }

  const series: DashboardSeriesPoint[] = Array.from(byDate.entries()).map(
    ([date, value]) => ({
      date,
      income: value.income,
      expense: value.expense,
    })
  );

  const totalBalance = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    totalBalance,
    hasAnyTransactions: series.length > 0,
    series,
  };
}

// Helper function to update account balance
async function updateAccountBalance(
  supabase: SupabaseClient,
  accountId: string,
  amount: number,
  type: "income" | "expense",
  operation: "add" | "revert"
): Promise<void> {
  const delta = operation === "add"
    ? (type === "income" ? amount : -amount)
    : (type === "income" ? -amount : amount);
  // Cast to match balance.ts local interface
  await adjustAccountBalance(supabase as unknown as Parameters<typeof adjustAccountBalance>[0], accountId, delta);
}

const createTransactionSchema = z.object({
  category_id: z.string().uuid("Invalid category ID"),
  amount: z.number().positive("Amount must be positive").max(999999999999, "Amount too large"),
  type: z.enum(["income", "expense"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  notes: z.string().max(500).nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
  tax_rate: z.number().min(0).max(100).nullable().optional(),
  commission_rate: z.number().min(0).max(100).nullable().optional(),
  currency: z.string().max(10).default("IDR"),
  exchange_rate_at_time: z.number().positive().default(1),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.number().int().positive().nullable().optional(),
  recurring_unit: z.enum(["day", "week", "month"]).nullable().optional(),
  recurring_next_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

export async function createTransaction(payload: CreateTransactionPayload): Promise<ActionResult> {
  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;
  const typedSupabase = rawSupabase as SupabaseClient;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const validationResult = createTransactionSchema.safeParse(payload)
  if (!validationResult.success) {
    return { success: false, error: "Invalid transaction data" }
  }
  const safePayload = validationResult.data

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: safePayload.category_id,
    amount: Number(safePayload.amount),
    type: safePayload.type,
    date: safePayload.date,
    notes: sanitizeNotes(safePayload.notes),
    is_recurring: safePayload.is_recurring,
    recurring_interval: safePayload.is_recurring ? safePayload.recurring_interval ?? DEFAULT_RECURRING_INTERVAL : null,
    recurring_unit: safePayload.is_recurring ? safePayload.recurring_unit ?? DEFAULT_RECURRING_UNIT : null,
    recurring_next_date: safePayload.is_recurring ? safePayload.recurring_next_date ?? null : null,
    account_id: safePayload.account_id ?? null,
    tax_rate: safePayload.tax_rate ?? null,
    commission_rate: safePayload.commission_rate ?? null,
    currency: safePayload.currency ?? "IDR",
    exchange_rate_at_time: safePayload.exchange_rate_at_time ?? 1,
  });

  if (error) {
    return { success: false, error: "Failed to create transaction. Please try again." };
  }

  // Update account balance if account_id exists
  if (payload.account_id) {
    await updateAccountBalance(
      typedSupabase,
      payload.account_id,
      Number(payload.amount),
      payload.type,
      "add"
    );
  }

  revalidateTransactionPaths();
  return { success: true };
}

const transactionSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().positive().max(999999999999, "Amount too large"),
  type: z.enum(["income", "expense"]),
  date: z.string().min(1),
  notes: z.string().nullable().optional(),
});

export async function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<ActionResult> {
  // Validate UUID at start
  try {
    validateUUID(id)
  } catch {
    return { success: false, error: "Invalid transaction ID" }
  }

  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;
  const typedSupabase = rawSupabase as SupabaseClient;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const validated = transactionSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, error: "Invalid data" };
  }

  // Fetch existing transaction to get old values
  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Transaction not found" };
  }

  const typedExisting = existing as { account_id?: string | null; amount: number; type: "income" | "expense" };

  const { error } = await supabase
    .from("transactions")
    .update({
      category_id: payload.category_id,
      amount: payload.amount,
      type: payload.type,
      date: payload.date,
      notes: payload.notes ?? null,
      account_id: payload.account_id ?? null,
      currency: payload.currency ?? "IDR",
      exchange_rate_at_time: payload.exchange_rate_at_time ?? 1,
      is_recurring: payload.is_recurring,
      recurring_interval: payload.is_recurring
        ? payload.recurring_interval ?? DEFAULT_RECURRING_INTERVAL
        : null,
      recurring_unit: payload.is_recurring
        ? payload.recurring_unit ?? DEFAULT_RECURRING_UNIT
        : null,
      recurring_next_date: payload.is_recurring
        ? payload.recurring_next_date ?? null
        : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Failed to update transaction. Please try again." }
  }

  // Step 1 — revert old account balance if had account
  if (typedExisting.account_id) {
    await updateAccountBalance(
      typedSupabase,
      typedExisting.account_id,
      typedExisting.amount,
      typedExisting.type,
      "revert"
    );
  }

  // Step 2 — apply new account balance if has account
  if (payload.account_id && payload.amount && payload.type) {
    await updateAccountBalance(
      typedSupabase,
      payload.account_id,
      payload.amount,
      payload.type,
      "add"
    );
  }

  revalidateTransactionPaths();
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  // Validate UUID at start
  try {
    validateUUID(id)
  } catch {
    return { success: false, error: "Invalid transaction ID" }
  }

  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;
  const typedSupabase = rawSupabase as SupabaseClient;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  // Fetch existing transaction before delete
  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Transaction not found" };
  }

  const typedExisting = existing as { account_id?: string | null; amount: number; type: "income" | "expense" };

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Failed to delete transaction. Please try again." }
  }

  // Revert account balance if had account
  if (typedExisting.account_id) {
    await updateAccountBalance(
      typedSupabase,
      typedExisting.account_id,
      typedExisting.amount,
      typedExisting.type,
      "revert"
    );
  }

  revalidateTransactionPaths();
  return { success: true };
}

// Helper function to compute next date for recurring transactions
function computeNextDate(
  fromDate: string,
  interval: number,
  unit: string
): string {
  const date = new Date(fromDate);
  if (unit === "month") {
    date.setMonth(date.getMonth() + interval);
  } else if (unit === "day") {
    date.setDate(date.getDate() + interval);
  } else if (unit === "week") {
    date.setDate(date.getDate() + interval * 7);
  }
  return date.toISOString().slice(0, 10);
}

export async function logRecurringTransaction(
  parentId: string
): Promise<ActionResult> {
  // Validate UUID at start
  try {
    validateUUID(parentId)
  } catch {
    return { success: false, error: "Invalid transaction ID" }
  }

  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  // Fetch parent transaction
  const { data: parent, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", parentId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !parent) return { success: false, error: "Transaction not found" };

  const typedParent = parent as { category_id: string; type: "income" | "expense"; amount: number; notes: string | null; recurring_interval?: number | null; recurring_unit?: string | null };

  // Create new transaction for today
  const today = new Date().toISOString().slice(0, 10);
  const { error: insertError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      category_id: typedParent.category_id,
      type: typedParent.type,
      amount: typedParent.amount,
      date: today,
      notes: typedParent.notes,
      is_recurring: false,
      recurring_parent_id: parentId,
    });

  if (insertError) return { success: false, error: "Failed to log recurring transaction" }

  // Update next date on parent
  const nextDate = computeNextDate(
    today,
    typedParent.recurring_interval ?? DEFAULT_RECURRING_INTERVAL,
    typedParent.recurring_unit ?? DEFAULT_RECURRING_UNIT
  );

  await supabase
    .from("transactions")
    .update({ recurring_next_date: nextDate })
    .eq("id", parentId)
    .eq("user_id", user.id);

  revalidateTransactionPaths();
  return { success: true };
}

export async function skipRecurringOccurrence(
  parentId: string
): Promise<ActionResult<null>> {
  return withActionResult(async () => {
    const { supabase: rawSupabase, user } =
      await getAuthenticatedClient()
    const supabase: SupabaseAuthClient = rawSupabase;
    const typedSupabase = rawSupabase as SupabaseClient;

    if (!supabase.from) {
      throw new Error("Database client not available")
    }

    // Fetch parent transaction
    const { data: parent, error: fetchError } =
      await supabase
        .from("transactions")
        .select(
          "id, recurring_interval, recurring_unit, recurring_next_date"
        )
        .eq("id", parentId)
        .eq("user_id", user.id)
        .single()

    if (fetchError || !parent) {
      throw new Error("Recurring transaction not found")
    }

    const typedParent = parent as {
      id: string
      recurring_interval: number
      recurring_unit: string
      recurring_next_date: string | null
    }

    // Compute next date skipping this occurrence
    const nextDate = computeNextDate(
      typedParent.recurring_next_date ??
        new Date().toISOString().slice(0, 10),
      typedParent.recurring_interval ?? 1,
      typedParent.recurring_unit ?? "month"
    )

    // Update next date without creating transaction
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ recurring_next_date: nextDate })
      .eq("id", parentId)
      .eq("user_id", user.id)

    if (updateError) throw updateError

    revalidateTransactionPaths()
    return null
  })
}

export async function stopRecurring(
  parentId: string
): Promise<ActionResult<null>> {
  return withActionResult(async () => {
    const { supabase: rawSupabase, user } =
      await getAuthenticatedClient()
    const supabase: SupabaseAuthClient = rawSupabase;
    const typedSupabase = rawSupabase as SupabaseClient;

    if (!supabase.from) {
      throw new Error("Database client not available")
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        is_recurring: false,
        recurring_next_date: null,
      })
      .eq("id", parentId)
      .eq("user_id", user.id)

    if (error) throw error

    revalidateTransactionPaths()
    return null
  })
}