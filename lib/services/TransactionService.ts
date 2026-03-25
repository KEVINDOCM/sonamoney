/**
 * CR-2026-002: TransactionService
 * High-Scalability Service Layer Pattern
 * Decouples database logic from Next.js Server Actions
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import {
  TRANSACTIONS_PAGE_SIZE,
  DEFAULT_RECURRING_INTERVAL,
  DEFAULT_RECURRING_UNIT,
} from "@/lib/constants";
import { sanitizeNotes, validateUUID } from "@/lib/utils/validation";
import type { Transaction, TransactionType } from "@/types";

// Error types for better error handling
export class TransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

export class ValidationError extends TransactionError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends TransactionError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND", { resource, id });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends TransactionError {
  constructor(message: string) {
    super(message, "CONFLICT");
    this.name = "ConflictError";
  }
}

// Types for the service layer
export interface FetchTransactionsParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  type?: TransactionType;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
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

export interface CreateTransactionInput {
  category_id: string;
  amount: number;
  type: TransactionType;
  date: string;
  notes?: string | null;
  account_id?: string | null;
  currency?: string;
  exchange_rate_at_time?: number;
  is_recurring?: boolean;
  recurring_interval?: number | null;
  recurring_unit?: "day" | "week" | "month" | null;
  recurring_next_date?: string | null;
}

export interface UpdateTransactionInput extends CreateTransactionInput {
  id: string;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  idempotent?: boolean;
}

// Database result types
interface RPCResult {
  success: boolean;
  error?: string;
  transaction_id?: string;
  idempotent?: boolean;
  next_date?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQueryable = any;

/**
 * TransactionService
 * Handles all database operations for transactions with:
 * - Idempotency support
 * - Error mapping and logging
 * - Complex business rules (recurring logic)
 * - Performance optimizations
 */
export class TransactionService {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Create a new service instance from an authenticated client
   */
  static async create(
    supabase: SupabaseClient
  ): Promise<TransactionService> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.auth.getUser() as Promise<any>);
    const user = data?.user;
    
    if (error || !user) {
      throw new TransactionError(
        "Authentication required",
        "UNAUTHENTICATED"
      );
    }

    return new TransactionService(supabase, user.id as string);
  }

  // ─────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────

  private db(): AnyQueryable {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.supabase as any;
  }

  private log(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [TransactionService] [${level.toUpperCase()}] ${message}${meta ? ` | ${JSON.stringify(meta)}` : ""}`;
    
    if (level === "error") {
      console.error(logLine);
    } else if (level === "warn") {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  }

  private handleRPCError(error: Error, operation: string): never {
    this.log("error", `${operation} failed`, { error: error.message, userId: this.userId });
    throw new TransactionError(
      `Failed to ${operation.toLowerCase()}. Please try again.`,
      "RPC_ERROR",
      { originalError: error.message }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Query Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Fetch paginated transactions with optional filters
   * Uses covering index for optimal performance
   */
  async fetchTransactions(params: FetchTransactionsParams = {}): Promise<PaginatedTransactions> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : TRANSACTIONS_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    this.log("info", "Fetching transactions", { page, pageSize, userId: this.userId });

    let query = this.db()
      .from("transactions")
      .select("*, categories(name, color, type, icon)", { count: "exact" })
      .eq("user_id", this.userId)
      .eq("is_recurring", false)  // Exclude recurring templates
      .order("date", { ascending: false });

    // Apply filters if provided
    if (params.startDate) {
      query = query.gte("date", params.startDate);
    }
    if (params.endDate) {
      query = query.lte("date", params.endDate);
    }
    if (params.categoryId) {
      query = query.eq("category_id", params.categoryId);
    }
    if (params.accountId) {
      query = query.eq("account_id", params.accountId);
    }
    if (params.type) {
      query = query.eq("type", params.type);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      this.log("error", "Failed to fetch transactions", { error: error.message });
      throw new TransactionError("Failed to fetch transactions", "FETCH_ERROR");
    }

    const total = count ?? 0;

    return {
      items: (data as Transaction[]) ?? [],
      total,
      page,
      pageSize,
      hasMore: from + (data?.length ?? 0) < total,
    };
  }

  /**
   * Fetch dashboard summary using materialized view for large datasets
   * Falls back to direct query for real-time accuracy on small datasets
   */
  async fetchDashboardSummary(): Promise<DashboardSummary> {
    this.log("info", "Fetching dashboard summary", { userId: this.userId });

    // Check transaction count to determine strategy
    const { count, error: countError } = await this.db()
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", this.userId)
      .eq("is_recurring", false);

    if (countError) {
      this.log("error", "Failed to count transactions", { error: countError.message });
    }

    // For large datasets (>10k), use materialized view
    if ((count ?? 0) > 10000) {
      return this.fetchDashboardSummaryFromMV();
    }

    // For smaller datasets, use direct query for real-time accuracy
    return this.fetchDashboardSummaryDirect();
  }

  private async fetchDashboardSummaryFromMV(): Promise<DashboardSummary> {
    try {
      const { data, error } = await this.db()
        .from("mv_monthly_aggregates")
        .select("month, type, total_amount, transaction_count")
        .eq("user_id", this.userId)
        .order("month", { ascending: true });

      if (error) {
        this.log("warn", "Materialized view query failed, falling back", { error: error.message });
        return this.fetchDashboardSummaryDirect();
      }

      let totalIncome = 0;
      let totalExpense = 0;
      const series: DashboardSeriesPoint[] = [];

      // Aggregate by month
      const monthlyData = new Map<string, { income: number; expense: number }>();

      for (const row of data ?? []) {
        const month = row.month as string;
        const type = row.type as TransactionType;
        const amount = Number(row.total_amount);

        if (!monthlyData.has(month)) {
          monthlyData.set(month, { income: 0, expense: 0 });
        }

        const entry = monthlyData.get(month)!;
        if (type === "income") {
          entry.income += amount;
          totalIncome += amount;
        } else {
          entry.expense += amount;
          totalExpense += amount;
        }
      }

      for (const [date, values] of monthlyData) {
        series.push({ date, income: values.income, expense: values.expense });
      }

      return {
        totalIncome,
        totalExpense,
        totalBalance: totalIncome - totalExpense,
        hasAnyTransactions: series.length > 0,
        series,
      };
    } catch (err) {
      this.log("error", "Materialized view error", { error: (err as Error).message });
      return this.fetchDashboardSummaryDirect();
    }
  }

  private async fetchDashboardSummaryDirect(): Promise<DashboardSummary> {
    const { data, error } = await this.db()
      .from("transactions")
      .select("date, amount, type")
      .eq("user_id", this.userId)
      .eq("is_recurring", false)
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

  // ─────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create a new transaction with idempotency support
   */
  async createTransaction(input: CreateTransactionInput): Promise<TransactionResult> {
    // Validation
    if (!input.category_id || !validateUUID(input.category_id)) {
      throw new ValidationError("Invalid category ID");
    }
    if (input.amount <= 0 || input.amount > 999999999999) {
      throw new ValidationError("Amount must be positive and reasonable");
    }
    if (!["income", "expense"].includes(input.type)) {
      throw new ValidationError("Type must be income or expense");
    }

    // Generate idempotency key
    const idempotencyKey = randomUUID();

    this.log("info", "Creating transaction", {
      categoryId: input.category_id,
      amount: input.amount,
      type: input.type,
      idempotencyKey,
    });

    const { data, error } = await this.db().rpc("atomic_create_transaction", {
      p_user_id: this.userId,
      p_category_id: input.category_id,
      p_amount: input.amount,
      p_type: input.type,
      p_date: input.date,
      p_notes: sanitizeNotes(input.notes),
      p_account_id: input.account_id ?? null,
      p_currency: input.currency ?? "IDR",
      p_exchange_rate_at_time: input.exchange_rate_at_time ?? 1,
      p_is_recurring: input.is_recurring ?? false,
      p_recurring_interval: input.is_recurring ? input.recurring_interval ?? DEFAULT_RECURRING_INTERVAL : null,
      p_recurring_unit: input.is_recurring ? input.recurring_unit ?? DEFAULT_RECURRING_UNIT : null,
      p_recurring_next_date: input.is_recurring ? input.recurring_next_date ?? null : null,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      this.handleRPCError(error, "Create transaction");
    }

    const result = data as RPCResult;

    if (!result.success) {
      throw new TransactionError(
        result.error || "Transaction creation failed",
        "CREATE_FAILED"
      );
    }

    if (result.idempotent) {
      this.log("info", "Idempotent transaction handled", { transactionId: result.transaction_id });
    }

    return {
      success: true,
      transactionId: result.transaction_id,
      idempotent: result.idempotent,
    };
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(input: UpdateTransactionInput): Promise<TransactionResult> {
    // Validation
    if (!validateUUID(input.id)) {
      throw new ValidationError("Invalid transaction ID");
    }
    if (!input.category_id || !validateUUID(input.category_id)) {
      throw new ValidationError("Invalid category ID");
    }
    if (input.amount <= 0 || input.amount > 999999999999) {
      throw new ValidationError("Amount must be positive and reasonable");
    }

    this.log("info", "Updating transaction", { transactionId: input.id });

    const { data, error } = await this.db().rpc("atomic_update_transaction", {
      p_transaction_id: input.id,
      p_user_id: this.userId,
      p_category_id: input.category_id,
      p_amount: input.amount,
      p_type: input.type,
      p_date: input.date,
      p_notes: sanitizeNotes(input.notes),
      p_account_id: input.account_id ?? null,
      p_currency: input.currency ?? "IDR",
      p_exchange_rate_at_time: input.exchange_rate_at_time ?? 1,
      p_is_recurring: input.is_recurring ?? false,
      p_recurring_interval: input.is_recurring ? input.recurring_interval ?? DEFAULT_RECURRING_INTERVAL : null,
      p_recurring_unit: input.is_recurring ? input.recurring_unit ?? DEFAULT_RECURRING_UNIT : null,
      p_recurring_next_date: input.is_recurring ? input.recurring_next_date ?? null : null,
    });

    if (error) {
      this.handleRPCError(error, "Update transaction");
    }

    const result = data as RPCResult;

    if (!result.success) {
      if (result.error?.includes("not found")) {
        throw new NotFoundError("Transaction", input.id);
      }
      throw new TransactionError(result.error || "Update failed", "UPDATE_FAILED");
    }

    return { success: true };
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<TransactionResult> {
    if (!validateUUID(id)) {
      throw new ValidationError("Invalid transaction ID");
    }

    this.log("info", "Deleting transaction", { transactionId: id });

    const { data, error } = await this.db().rpc("atomic_delete_transaction", {
      p_transaction_id: id,
      p_user_id: this.userId,
    });

    if (error) {
      this.handleRPCError(error, "Delete transaction");
    }

    const result = data as RPCResult;

    if (!result.success) {
      if (result.error?.includes("not found")) {
        throw new NotFoundError("Transaction", id);
      }
      throw new TransactionError(result.error || "Deletion failed", "DELETE_FAILED");
    }

    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────
  // Recurring Transaction Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Log a recurring transaction instance
   */
  async logRecurringTransaction(parentId: string): Promise<TransactionResult & { nextDate?: string }> {
    if (!validateUUID(parentId)) {
      throw new ValidationError("Invalid parent transaction ID");
    }

    const idempotencyKey = randomUUID();

    this.log("info", "Logging recurring transaction", { parentId, idempotencyKey });

    const { data, error } = await this.db().rpc("atomic_log_recurring_transaction", {
      p_parent_id: parentId,
      p_user_id: this.userId,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      this.handleRPCError(error, "Log recurring transaction");
    }

    const result = data as RPCResult;

    if (!result.success) {
      if (result.error?.includes("not found")) {
        throw new NotFoundError("Recurring transaction", parentId);
      }
      throw new TransactionError(result.error || "Logging failed", "LOG_FAILED");
    }

    if (result.idempotent) {
      this.log("info", "Idempotent recurring transaction handled", { transactionId: result.transaction_id });
    }

    return {
      success: true,
      transactionId: result.transaction_id,
      nextDate: result.next_date,
      idempotent: result.idempotent,
    };
  }

  /**
   * Skip a recurring occurrence
   */
  async skipRecurringOccurrence(parentId: string): Promise<{ success: boolean; nextDate?: string }> {
    if (!validateUUID(parentId)) {
      throw new ValidationError("Invalid transaction ID");
    }

    this.log("info", "Skipping recurring occurrence", { parentId });

    const { data, error } = await this.db().rpc("atomic_skip_recurring", {
      p_parent_id: parentId,
      p_user_id: this.userId,
    });

    if (error) {
      this.handleRPCError(error, "Skip recurring occurrence");
    }

    const result = data as RPCResult;

    if (!result.success) {
      if (result.error?.includes("not found")) {
        throw new NotFoundError("Recurring transaction", parentId);
      }
      throw new TransactionError(result.error || "Skip failed", "SKIP_FAILED");
    }

    return { success: true, nextDate: result.next_date };
  }

  /**
   * Stop a recurring transaction
   */
  async stopRecurring(parentId: string): Promise<TransactionResult> {
    if (!validateUUID(parentId)) {
      throw new ValidationError("Invalid transaction ID");
    }

    this.log("info", "Stopping recurring transaction", { parentId });

    const { data, error } = await this.db().rpc("atomic_stop_recurring", {
      p_parent_id: parentId,
      p_user_id: this.userId,
    });

    if (error) {
      this.handleRPCError(error, "Stop recurring transaction");
    }

    const result = data as RPCResult;

    if (!result.success) {
      if (result.error?.includes("not found")) {
        throw new NotFoundError("Transaction", parentId);
      }
      throw new TransactionError(result.error || "Stop failed", "STOP_FAILED");
    }

    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────
  // Batch Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create multiple transactions in sequence (not atomic across multiple)
   * Each individual transaction is still atomic
   */
  async createBatch(inputs: CreateTransactionInput[]): Promise<{
    successful: string[];
    failed: { input: CreateTransactionInput; error: string }[];
  }> {
    const successful: string[] = [];
    const failed: { input: CreateTransactionInput; error: string }[] = [];

    this.log("info", "Processing batch transaction creation", { count: inputs.length });

    for (const input of inputs) {
      try {
        const result = await this.createTransaction(input);
        if (result.transactionId) {
          successful.push(result.transactionId);
        }
      } catch (err) {
        const errorMessage = err instanceof TransactionError ? err.message : "Unknown error";
        failed.push({ input, error: errorMessage });
      }
    }

    this.log("info", "Batch creation completed", {
      successful: successful.length,
      failed: failed.length,
    });

    return { successful, failed };
  }
}

// Export factory function for convenience
export async function createTransactionService(
  supabase: SupabaseClient
): Promise<TransactionService> {
  return TransactionService.create(supabase);
}
