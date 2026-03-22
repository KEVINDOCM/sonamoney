"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedClient } from "@/lib/utils/auth";
import { revalidateAccountPaths, revalidateFinancePaths } from "@/lib/utils/revalidate";
import { ActionResult, CreateAccountPayload, UpdateAccountPayload } from "@/lib/types/actions";
import { validateUUID, sanitizeText, validateOrThrow } from "@/lib/utils/validation";
import { z } from "zod";
import type { Account } from "@/types";
import { 
  ValidationError, 
  DatabaseError, 
  createAppError,
  isRetryableError,
} from "@/lib/errors";
import { withRetry, RetryPresets } from "@/lib/utils/retry";

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

// Helper to handle database errors with retry
async function withDbRetry<T>(fn: () => Promise<T>, action: string): Promise<T> {
  return withRetry(fn, {
    ...RetryPresets.database,
    onRetry: (error, attempt, nextDelay) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[DB RETRY] ${action} attempt ${attempt}, retrying in ${nextDelay}ms`);
      }
    },
  });
}

// Helper to convert errors to ActionResult
function handleActionError(error: unknown, action: string): ActionResult<never> {
  const appError = createAppError(error, {
    action,
    timestamp: new Date().toISOString(),
  });

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.error(`[${action}] ${appError.code}: ${appError.message}`);
  }

  // Return user-friendly message with error ID
  return {
    success: false,
    error: `${appError.userMessage} (Error ID: ${appError.errorId})`,
  };
}

export async function getOrSeedAccounts(): Promise<Account[]> {
  try {
    const { supabase: rawSupabase, user } = await getAuthenticatedClient();
    const supabase: SupabaseAuthClient = rawSupabase;

    if (!supabase.from) return [];

    const from = supabase.from!;

    // Fetch with retry logic
    const { data: existing, error: fetchError } = await withDbRetry(
      async () => {
        return (from as Exclude<typeof supabase.from, undefined>)("accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
      },
      "getOrSeedAccounts.fetch"
    );

    if (fetchError) {
      throw new DatabaseError("Failed to fetch accounts", {
        cause: fetchError,
        code: "DB_FETCH_ACCOUNTS",
      });
    }
    
    if (existing && existing.length > 0) return existing as Account[];

    // Seed default accounts with retry
    const { data: seeded, error: seedError } = await withDbRetry(
      async () => {
        return (from as Exclude<typeof supabase.from, undefined>)("accounts")
          .insert(DEFAULT_ACCOUNTS.map(a => ({ ...a, user_id: user.id })))
          .select();
      },
      "getOrSeedAccounts.seed"
    );

    if (seedError) {
      throw new DatabaseError("Failed to seed default accounts", {
        cause: seedError,
        code: "DB_SEED_ACCOUNTS",
      });
    }
    
    return (seeded ?? []) as Account[];
  } catch (error) {
    // Log error but return empty array to prevent UI crash
    if (process.env.NODE_ENV === "development") {
      const appError = createAppError(error, { action: "getOrSeedAccounts" });
      console.error(`[getOrSeedAccounts] ${appError.code}: ${appError.message}`);
    }
    return [];
  }
}

export async function getAccounts(): Promise<Account[]> {
  try {
    const { supabase: rawSupabase, user } = await getAuthenticatedClient();
    const supabase: SupabaseAuthClient = rawSupabase;

    if (!supabase.from) return [];
    
    const from = supabase.from!;

    const { data, error } = await withDbRetry(
      async () => (from as Exclude<typeof supabase.from, undefined>)("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      "getAccounts"
    );

    if (error) {
      throw new DatabaseError("Failed to fetch accounts", {
        cause: error,
        code: "DB_FETCH_ACCOUNTS",
      });
    }
    
    return (data ?? []) as Account[];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const appError = createAppError(error, { action: "getAccounts" });
      console.error(`[getAccounts] ${appError.code}: ${appError.message}`);
    }
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
    .insert({
      user_id: user.id,
      name: sanitizeText(validated.name, 50),
      type: validated.type,
      currency: validated.currency ?? "IDR",
      balance: validated.balance ?? 0,
      icon: validated.icon ? sanitizeText(validated.icon, 10) : null,
      is_default: validated.is_default ?? false,
    })
    .select()

  if (error) return { success: false, error: "Failed to create account. Please try again." }
  revalidateAccountPaths();
  return { success: true };
}

export async function updateAccount(
  id: string,
  data: UpdateAccountPayload
): Promise<ActionResult> {
  // Validate UUID at start
  try {
    validateUUID(id)
  } catch {
    return { success: false, error: "Invalid account ID" }
  }

  const { supabase: rawSupabase, user } = await getAuthenticatedClient();
  const supabase: SupabaseAuthClient = rawSupabase;

  if (!supabase.from) {
    return { success: false, error: "Database client not available" };
  }

  const validated = validateOrThrow(updateAccountSchema, { ...data, id });

  const updateData: Record<string, unknown> = {}
  if (validated.name !== undefined) updateData.name = sanitizeText(validated.name, 50)
  if (validated.type !== undefined) updateData.type = validated.type
  if (validated.currency !== undefined) updateData.currency = validated.currency
  if (validated.balance !== undefined) updateData.balance = validated.balance
  if (validated.icon !== undefined) updateData.icon = validated.icon ? sanitizeText(validated.icon, 10) : null
  if (validated.is_default !== undefined) updateData.is_default = validated.is_default

  const { error } = await supabase
    .from("accounts")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { success: false, error: "Failed to update account. Please try again." };
  revalidateAccountPaths();
  return { success: true };
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  // Validate UUID at start
  try {
    validateUUID(id)
  } catch {
    return { success: false, error: "Invalid account ID" }
  }

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

  if (error) return { success: false, error: "Failed to delete account. Please try again." };
  revalidateFinancePaths();
  return { success: true };
}
