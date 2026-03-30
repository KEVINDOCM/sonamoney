'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { GuestTransaction, GuestCategory } from './constants';

// Supabase client type workaround (same pattern as other server actions)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQueryable = any;

function db(supabase: AnyQueryable) {
  return supabase as {
    from: (table: string) => AnyQueryable;
    auth: AnyQueryable;
  };
}

interface MigrationResult {
  success: boolean;
  transactionsMigrated: number;
  categoriesMigrated: number;
  error?: string;
}

/**
 * Migrate guest data to authenticated user account
 * This function is called after successful authentication
 */
export async function migrateGuestData(
  userId: string,
  guestTransactions: GuestTransaction[],
  guestCategories: GuestCategory[]
): Promise<MigrationResult> {
  const supabase = await createSupabaseServerClient();

  try {
    let transactionsMigrated = 0;
    let categoriesMigrated = 0;

    // First, migrate categories and create a mapping of old ID to new ID
    const categoryIdMap = new Map<string, string>();

    for (const guestCat of guestCategories) {
      // Skip default guest categories - check if similar category already exists
      if (guestCat.id.startsWith('guest-')) {
        const { data: existingCategories } = await db(supabase)
          .from('categories')
          .select('id, name')
          .eq('user_id', userId)
          .ilike('name', guestCat.name);

        if (existingCategories && existingCategories.length > 0) {
          // Use existing category
          categoryIdMap.set(guestCat.id, existingCategories[0].id);
          continue;
        }
      }

      // Create new category
      const { data: newCategory, error: catError } = await db(supabase)
        .from('categories')
        .insert({
          user_id: userId,
          name: guestCat.name,
          color: guestCat.color,
          type: guestCat.type,
          icon: guestCat.icon,
          budget_limit: guestCat.budget_limit,
        })
        .select('id')
        .single();

      if (catError) {
        console.error('Failed to migrate category:', catError);
        continue;
      }

      if (newCategory) {
        categoryIdMap.set(guestCat.id, newCategory.id);
        categoriesMigrated++;
      }
    }

    // Then, migrate transactions using the category ID mapping
    for (const guestTx of guestTransactions) {
      const newCategoryId = categoryIdMap.get(guestTx.category_id);

      if (!newCategoryId) {
        console.warn('No matching category found for transaction:', guestTx.id);
        continue;
      }

      const { error: txError } = await db(supabase).from('transactions').insert({
        user_id: userId,
        category_id: newCategoryId,
        amount: guestTx.amount,
        type: guestTx.type,
        date: guestTx.date,
        notes: guestTx.notes,
        is_recurring: guestTx.is_recurring,
        recurring_interval: guestTx.recurring_interval,
        recurring_unit: guestTx.recurring_unit,
        recurring_next_date: guestTx.recurring_next_date,
        currency: guestTx.currency || 'IDR',
        exchange_rate_at_time: 1,
      });

      if (txError) {
        console.error('Failed to migrate transaction:', txError);
        continue;
      }

      transactionsMigrated++;
    }

    // Revalidate paths to refresh data
    revalidatePath('/dashboard');
    revalidatePath('/transactions');
    revalidatePath('/analytics');

    return {
      success: true,
      transactionsMigrated,
      categoriesMigrated,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      transactionsMigrated: 0,
      categoriesMigrated: 0,
      error: error instanceof Error ? error.message : 'Unknown error during migration',
    };
  }
}
