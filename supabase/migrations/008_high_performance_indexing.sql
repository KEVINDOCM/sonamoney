-- ============================================
-- 008: HIGH-PERFORMANCE INDEXING
-- Advanced indexing strategy for 1M+ users
-- BRIN, covering indexes, partial indexes
-- ============================================

-- ============================================
-- 1. BRIN INDEXES (Block Range Indexes)
-- Optimized for large time-series data
-- Size: ~10KB per 1M rows vs ~20MB for B-tree
-- ============================================

-- BRIN index for transaction dates (perfect for range queries)
CREATE INDEX IF NOT EXISTS idx_transactions_brin_date
ON public.transactions USING BRIN (date)
WITH (pages_per_range = 128);

-- BRIN index for created_at (cleanup operations, pagination)
CREATE INDEX IF NOT EXISTS idx_transactions_brin_created_at
ON public.transactions USING BRIN (created_at)
WITH (pages_per_range = 128);

-- BRIN for transfer dates
CREATE INDEX IF NOT EXISTS idx_transfers_brin_date
ON public.transfers USING BRIN (date)
WITH (pages_per_range = 128);

COMMENT ON INDEX idx_transactions_brin_date IS 'BRIN index for efficient date range scans';

-- ============================================
-- 2. COVERING INDEXES (INCLUDE clause)
-- Eliminates heap fetches for common queries
-- ============================================

-- Covering index for transaction list queries
-- Includes all fields needed for list view
CREATE INDEX IF NOT EXISTS idx_transactions_covering_list
ON public.transactions (user_id, date DESC, id)
INCLUDE (category_id, amount, type, notes, currency, account_id, is_recurring)
WHERE is_recurring = FALSE;

-- Covering index for dashboard summary queries
CREATE INDEX IF NOT EXISTS idx_transactions_covering_dashboard
ON public.transactions (user_id, date, type)
INCLUDE (amount)
WHERE is_recurring = FALSE;

-- Covering index for category-based analytics
CREATE INDEX IF NOT EXISTS idx_transactions_covering_category
ON public.transactions (user_id, category_id, date DESC)
INCLUDE (amount, type)
WHERE is_recurring = FALSE;

-- Covering index for account-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_covering_account
ON public.transactions (account_id, date DESC)
INCLUDE (amount, type, category_id)
WHERE account_id IS NOT NULL AND is_recurring = FALSE;

COMMENT ON INDEX idx_transactions_covering_list IS 'Covering index eliminates heap access for transaction lists';

-- ============================================
-- 3. PARTIAL INDEXES (Common filter patterns)
-- Smaller, more efficient for specific queries
-- ============================================

-- Active recurring transactions (for scheduler)
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_active
ON public.transactions (user_id, recurring_next_date)
WHERE is_recurring = TRUE 
  AND recurring_next_date IS NOT NULL;

-- Uncompleted goals
CREATE INDEX IF NOT EXISTS idx_goals_active
ON public.goals (user_id, deadline, priority DESC)
WHERE is_completed = FALSE;

-- Active debts with upcoming payments
CREATE INDEX IF NOT EXISTS idx_debts_upcoming
ON public.debts (user_id, payment_due_date)
WHERE is_active = TRUE 
  AND payment_due_date IS NOT NULL;

-- High-value transactions (for reports)
CREATE INDEX IF NOT EXISTS idx_transactions_high_value
ON public.transactions (user_id, date DESC)
WHERE amount >= 1000000 AND is_recurring = FALSE;

-- Recent failed audit events
CREATE INDEX IF NOT EXISTS idx_audit_log_failures
ON public.audit_log (user_id, created_at DESC)
WHERE event_status = 'failure';

COMMENT ON INDEX idx_transactions_recurring_active IS 'Partial index for recurring transaction scheduler';

-- ============================================
-- 4. COMPOSITE INDEXES (Multi-column queries)
-- ============================================

-- User + type + date for monthly reports
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date
ON public.transactions (user_id, type, date DESC);

-- User + category + type for budget analysis
CREATE INDEX IF NOT EXISTS idx_transactions_user_category_type
ON public.transactions (user_id, category_id, type, date DESC);

-- Transfer date range queries
CREATE INDEX IF NOT EXISTS idx_transfers_user_date_type
ON public.transfers (user_id, date DESC, from_account_id);

-- Debt payments for reporting
CREATE INDEX IF NOT EXISTS idx_debt_payments_reporting
ON public.debt_payments (user_id, payment_date DESC, amount)
INCLUDE (debt_id, principal_paid, interest_paid);

-- ============================================
-- 5. EXPRESSION INDEXES (Computed values)
-- ============================================
-- NOTE: DATE_TRUNC and LOWER are STABLE functions, not IMMUTABLE
-- They cannot be used in index expressions without being marked IMMUTABLE
-- Consider using a computed column or trigger-maintained column instead

-- For monthly aggregations, use the BRIN index on date instead
-- For case-insensitive email lookup, normalize email before storage

-- ============================================
-- 6. STATISTICS FOR QUERY PLANNER
-- ============================================

-- Extended statistics for correlated columns
CREATE STATISTICS IF NOT EXISTS stats_transactions_user_date
ON user_id, date
FROM public.transactions;

CREATE STATISTICS IF NOT EXISTS stats_transactions_type_date
ON type, date
FROM public.transactions;

-- ============================================
-- 7. TABLE OPTIMIZATION
-- ============================================

-- Set fillfactor for tables with frequent updates
-- Leaves space for HOT updates (Heap-Only Tuple)
ALTER TABLE public.accounts SET (fillfactor = 90);
ALTER TABLE public.goals SET (fillfactor = 90);
ALTER TABLE public.debts SET (fillfactor = 90);
ALTER TABLE public.categories SET (fillfactor = 90);

-- Keep transactions at 100 (mostly insert-only after creation)
ALTER TABLE public.transactions SET (fillfactor = 95);

-- ============================================
-- 8. ANALYZE TABLES
-- ============================================

-- Function to analyze all tables
CREATE OR REPLACE FUNCTION public.analyze_all_tables()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    ANALYZE public.accounts;
    ANALYZE public.categories;
    ANALYZE public.transactions;
    ANALYZE public.transfers;
    ANALYZE public.goals;
    ANALYZE public.debts;
    ANALYZE public.debt_payments;
    
    RAISE NOTICE 'Table statistics updated at %', NOW();
END;
$$;

-- ============================================
-- 9. INDEX MAINTENANCE FUNCTION
-- ============================================

-- Function to report index usage statistics
CREATE OR REPLACE FUNCTION public.get_index_stats()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || relname AS table_name,
        indexrelname AS index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$;

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.analyze_all_tables TO service_role;
GRANT EXECUTE ON FUNCTION public.get_index_stats TO service_role;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
