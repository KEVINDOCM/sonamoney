"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { revalidateTransactionPaths } from "@/lib/utils/revalidate";
import { withActionResult } from "@/lib/utils/actions";
import { validateUUID, sanitizeNotes } from "@/lib/utils/validation";
import { computeNextDate } from "@/lib/utils/dateUtils";
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
import type { Transaction, TransactionType } from "@/types";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────
// Internal Supabase query helper
// The @supabase/ssr client without a database type schema requires
// this single cast at the boundary — removes the need for 4 fake
// interface declarations that existed previously.
// ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQueryable = any;

function db(supabase: AnyQueryable) {
  return supabase as {
    from: (table: string) => AnyQueryable;
    auth: AnyQueryable;
    rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  };
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

  const { supabase, user } = await getAuthenticatedClient();

  const { data, error, count } = await db(supabase)
    .from("transactions")
    .select("*, categories(name, color, type, icon)", { count: "exact" })
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .range(from, to);

  if (error || !data || count === null) {
    return { items: [], total: 0, page, pageSize };
  }

  return {
    items: data as Transaction[],
    total: count,
    page,
    pageSize,
  };
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { supabase, user } = await getAuthenticatedClient();

  const { data, error } = await db(supabase)
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

  return {
    totalIncome,
    totalExpense,
    totalBalance: totalIncome - totalExpense,
    hasAnyTransactions: series.length > 0,
    series,
  };
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
});

export async function createTransaction(payload: CreateTransactionPayload): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedClient();

  const validationResult = createTransactionSchema.safeParse(payload)
  if (!validationResult.success) {
    return { success: false, error: "Invalid transaction data" }
  }
  const safePayload = validationResult.data

  // Use atomic RPC function for ACID compliance
  const { data, error } = await db(supabase).rpc("atomic_create_transaction", {
    p_user_id: user.id,
    p_category_id: safePayload.category_id,
    p_amount: Number(safePayload.amount),
    p_type: safePayload.type,
    p_date: safePayload.date,
    p_notes: sanitizeNotes(safePayload.notes),
    p_account_id: safePayload.account_id ?? null,
    p_currency: safePayload.currency ?? "IDR",
    p_exchange_rate_at_time: safePayload.exchange_rate_at_time ?? 1,
    p_is_recurring: safePayload.is_recurring,
    p_recurring_interval: safePayload.is_recurring ? safePayload.recurring_interval ?? DEFAULT_RECURRING_INTERVAL : null,
    p_recurring_unit: safePayload.is_recurring ? safePayload.recurring_unit ?? DEFAULT_RECURRING_UNIT : null,
    p_recurring_next_date: safePayload.is_recurring ? safePayload.recurring_next_date ?? null : null,
  });

  if (error) {
    console.error("[ATOMIC] Transaction creation failed:", error.message);
    return { success: false, error: "Failed to create transaction. Please try again." };
  }

  const result = data as { success?: boolean; error?: string; transaction_id?: string } | null;
  if (!result?.success) {
    const errorMsg = result?.error || "Unknown error";
    console.error("[ATOMIC] Transaction creation failed:", errorMsg);
    return { success: false, error: `Transaction failed: ${errorMsg}` };
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

/**
 * CR-2026-001: Atomic Transaction Update
 * Uses database-level PostgreSQL function for ACID compliance
 */
export async function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<ActionResult> {
  try {
    validateUUID(id)
  } catch {
    return { success: false, error: "Invalid transaction ID" }
  }

  const { supabase, user } = await getAuthenticatedClient();

  const validated = transactionSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, error: "Invalid data" };
  }

  // Use atomic RPC function for ACID compliance
  const { data, error } = await db(supabase).rpc("atomic_update_transaction", {
    p_transaction_id: id,
    p_user_id: user.id,
    p_category_id: payload.category_id,
    p_amount: payload.amount,
    p_type: payload.type,
    p_date: payload.date,
    p_notes: sanitizeNotes(payload.notes),
    p_account_id: payload.account_id ?? null,
    p_currency: payload.currency ?? "IDR",
    p_exchange_rate_at_time: payload.exchange_rate_at_time ?? 1,
    p_is_recurring: payload.is_recurring ?? false,
    p_recurring_interval: payload.is_recurring ? payload.recurring_interval ?? DEFAULT_RECURRING_INTERVAL : null,
    p_recurring_unit: payload.is_recurring ? payload.recurring_unit ?? DEFAULT_RECURRING_UNIT : null,
    p_recurring_next_date: payload.is_recurring ? payload.recurring_next_date ?? null : null,
  });

  if (error) {
    console.error("[ATOMIC] Transaction update failed:", error.message);
    return { success: false, error: "Failed to update transaction. Please try again." };
  }

  const result = data as { success?: boolean; error?: string } | null;
  if (!result?.success) {
    const errorMsg = result?.error || "Unknown error";
    console.error("[ATOMIC] Transaction update failed:", errorMsg);
    return { success: false, error: `Update failed: ${errorMsg}` };
  }

  revalidateTransactionPaths();
  return { success: true };
}

/**
 * CR-2026-001: Atomic Transaction Delete
 * Uses database-level PostgreSQL function for ACID compliance
 */
export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    validateUUID(id)
  } catch {
    return { success: false, error: "Invalid transaction ID" }
  }

  const { supabase, user } = await getAuthenticatedClient();

  // Use atomic RPC function for ACID compliance
  const { data, error } = await db(supabase).rpc("atomic_delete_transaction", {
    p_transaction_id: id,
    p_user_id: user.id,
  });

  if (error) {
    console.error("[ATOMIC] Transaction deletion failed:", error.message);
    return { success: false, error: "Failed to delete transaction. Please try again." };
  }

  const result = data as { success?: boolean; error?: string } | null;
  if (!result?.success) {
    const errorMsg = result?.error || "Unknown error";
    console.error("[ATOMIC] Transaction deletion failed:", errorMsg);
    return { success: false, error: `Deletion failed: ${errorMsg}` };
  }

  revalidateTransactionPaths();
  return { success: true };
}

/**
 * CR-2026-001: Atomic Recurring Transaction Logging
 */
export async function logRecurringTransaction(
  parentId: string
): Promise<ActionResult> {
  try {
    validateUUID(parentId)
  } catch {
    return { success: false, error: "Invalid transaction ID" }
  }

  const { supabase, user } = await getAuthenticatedClient();

  // Use atomic RPC function for ACID compliance
  const { data, error } = await db(supabase).rpc("atomic_log_recurring_transaction", {
    p_parent_id: parentId,
    p_user_id: user.id,
  });

  if (error) {
    console.error("[ATOMIC] Recurring transaction logging failed:", error.message);
    return { success: false, error: "Failed to log recurring transaction" };
  }

  const result = data as { success?: boolean; error?: string; transaction_id?: string; next_date?: string } | null;
  if (!result?.success) {
    const errorMsg = result?.error || "Unknown error";
    console.error("[ATOMIC] Recurring transaction logging failed:", errorMsg);
    return { success: false, error: `Logging failed: ${errorMsg}` };
  }

  revalidateTransactionPaths();
  return { success: true };
}

/**
 * CR-2026-001: Atomic Recurring Skip
 */
export async function skipRecurringOccurrence(
  parentId: string
): Promise<ActionResult<null>> {
  return withActionResult(async () => {
    const { supabase, user } = await getAuthenticatedClient()

    // Validate UUID
    try {
      validateUUID(parentId)
    } catch {
      throw new Error("Invalid transaction ID")
    }

    // Use atomic RPC function
    const { data, error } = await db(supabase).rpc("atomic_skip_recurring", {
      p_parent_id: parentId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("[ATOMIC] Recurring skip failed:", error.message);
      throw new Error("Failed to skip recurring occurrence");
    }

    const result = data as { success?: boolean; error?: string; next_date?: string } | null;
    if (!result?.success) {
      throw new Error(result?.error || "Skip failed");
    }

    revalidateTransactionPaths()
    return null
  })
}

/**
 * CR-2026-001: Atomic Recurring Stop
 */
export async function stopRecurring(
  parentId: string
): Promise<ActionResult<null>> {
  return withActionResult(async () => {
    const { supabase, user } = await getAuthenticatedClient()

    // Validate UUID
    try {
      validateUUID(parentId)
    } catch {
      throw new Error("Invalid transaction ID")
    }

    // Use atomic RPC function
    const { data, error } = await db(supabase).rpc("atomic_stop_recurring", {
      p_parent_id: parentId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("[ATOMIC] Recurring stop failed:", error.message);
      throw new Error("Failed to stop recurring transaction");
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (!result?.success) {
      throw new Error(result?.error || "Stop failed");
    }

    revalidateTransactionPaths()
    return null
  })
}