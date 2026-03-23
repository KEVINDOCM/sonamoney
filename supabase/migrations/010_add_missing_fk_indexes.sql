-- ============================================
-- 010: ADD MISSING FOREIGN KEY INDEXES
-- Fix unindexed_foreign_keys performance warnings
-- ============================================

-- Add index on categories.user_id for FK performance
-- This covers categories_user_id_fkey foreign key
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- Add index on transactions.recurring_parent_id for FK performance
-- This covers transactions_recurring_parent_id_fkey foreign key
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_parent_id ON public.transactions(recurring_parent_id);
