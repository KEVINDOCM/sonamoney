-- ============================================
-- 017: HIGH-SCALABILITY INDEXING STRATEGY
-- CR-2026-002: Performance optimizations for 1M+ users
-- BRIN indexes, materialized views, and covering indexes
-- ============================================

begin;

-- ============================================
-- 1. BRIN INDEXES (Block Range Indexes)
-- Optimized for large date-range scans on time-series data
-- Extremely efficient for append-only tables like transactions
-- ============================================

-- BRIN index for date-based queries on transactions
-- Perfect for: dashboard summaries, monthly reports, date range filters
-- Size: ~10KB per 1M rows (vs ~20MB for B-tree)
CREATE INDEX IF NOT EXISTS idx_transactions_brin_date
ON public.transactions USING BRIN (date)
WITH (pages_per_range = 128);

-- BRIN index for created_at (useful for cleanup operations, pagination)
CREATE INDEX IF NOT EXISTS idx_transactions_brin_created_at
ON public.transactions USING BRIN (created_at)
WITH (pages_per_range = 128);

-- ============================================
-- 2. MATERIALIZED VIEW FOR MONTHLY AGGREGATES
-- Pre-computed dashboard statistics for instant loading
-- ============================================

-- Drop existing materialized view if exists (for clean migration)
DROP MATERIALIZED VIEW IF EXISTS mv_monthly_aggregates CASCADE;

-- Create materialized view for monthly financial aggregates
CREATE MATERIALIZED VIEW mv_monthly_aggregates AS
SELECT
  user_id,
  date_trunc('month', date) AS month,
  type,
  SUM(amount) AS total_amount,
  COUNT(*) AS transaction_count,
  AVG(amount) AS avg_amount
FROM public.transactions
WHERE is_recurring = false  -- Exclude recurring templates from aggregates
GROUP BY user_id, date_trunc('month', date), type;

-- Create indexes on the materialized view
CREATE UNIQUE INDEX idx_mv_monthly_aggregates_unique
ON mv_monthly_aggregates (user_id, month, type);

CREATE INDEX idx_mv_monthly_aggregates_user_month
ON mv_monthly_aggregates (user_id, month);

-- ============================================
-- 3. COVERING INDEXES (INCLUDE clause)
-- Include commonly selected fields to avoid heap lookups
-- ============================================

-- Covering index for transaction list queries
-- Includes fields needed for the transaction list without heap access
CREATE INDEX IF NOT EXISTS idx_transactions_covering_list
ON public.transactions (user_id, date DESC, id)
INCLUDE (category_id, amount, type, notes, currency, account_id)
WHERE is_recurring = false;

-- Covering index for dashboard summary queries
CREATE INDEX IF NOT EXISTS idx_transactions_covering_dashboard
ON public.transactions (user_id, date, type)
INCLUDE (amount)
WHERE is_recurring = false;

-- Covering index for category-based analytics
CREATE INDEX IF NOT EXISTS idx_transactions_covering_category
ON public.transactions (user_id, category_id, date DESC)
INCLUDE (amount, type)
WHERE is_recurring = false;

-- ============================================
-- 4. PARTIAL INDEXES for common filter patterns
-- Smaller, more efficient indexes for specific query patterns
-- ============================================

-- Index for recurring transaction processing (find due recurring transactions)
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_due
ON public.transactions (user_id, recurring_next_date)
WHERE is_recurring = true AND recurring_next_date IS NOT NULL;

-- Index for account-based transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_account
ON public.transactions (account_id, date DESC)
WHERE account_id IS NOT NULL;

-- Index for finding transactions by parent (child transactions of recurring)
CREATE INDEX IF NOT EXISTS idx_transactions_parent
ON public.transactions (recurring_parent_id, date DESC)
WHERE recurring_parent_id IS NOT NULL;

-- ============================================
-- 5. REFRESH FUNCTION FOR MATERIALIZED VIEWS
-- Automated refresh via pg_cron
-- ============================================

-- Create refresh function
CREATE OR REPLACE FUNCTION public.refresh_monthly_aggregates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_aggregates;
  RAISE NOTICE 'Monthly aggregates refreshed at %', now();
END;
$$;

-- ============================================
-- 6. STATS AND ANALYSIS FUNCTIONS
-- Helper functions for query optimization
-- ============================================

-- Function to analyze table statistics (run after bulk imports)
CREATE OR REPLACE FUNCTION public.analyze_transactions_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ANALYZE public.transactions;
  ANALYZE public.categories;
  RAISE NOTICE 'Table statistics updated at %', now();
END;
$$;

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON mv_monthly_aggregates TO authenticated;
GRANT SELECT ON mv_monthly_aggregates TO anon;
GRANT EXECUTE ON FUNCTION public.refresh_monthly_aggregates TO service_role;
GRANT EXECUTE ON FUNCTION public.analyze_transactions_stats TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_monthly_aggregates FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_monthly_aggregates FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.analyze_transactions_stats FROM anon;
REVOKE EXECUTE ON FUNCTION public.analyze_transactions_stats FROM authenticated;

-- ============================================
-- 8. PG_CRON SCHEDULES (Enable pg_cron extension first)
-- Uncomment after enabling pg_cron in Supabase dashboard
-- ============================================

-- Schedule materialized view refresh every hour
-- SELECT cron.schedule(
--   'refresh-monthly-aggregates',
--   '0 * * * *',  -- Every hour
--   'SELECT public.refresh_monthly_aggregates()'
-- );

-- Schedule stats update daily at 4 AM (after cleanup)
-- SELECT cron.schedule(
--   'analyze-stats',
--   '0 4 * * *',  -- At 4:00 AM UTC daily
--   'SELECT public.analyze_transactions_stats()'
-- );

commit;

-- ============================================
-- 9. EXPLAIN ANALYZE QUERIES (For verification)
-- Run these to verify index usage:
-- ============================================

-- Verify BRIN index is used for date range queries:
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM transactions
-- WHERE date BETWEEN '2024-01-01' AND '2024-01-31';

-- Verify covering index avoids heap access:
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT id, category_id, amount, type
-- FROM transactions
-- WHERE user_id = 'uuid-here'
-- ORDER BY date DESC;

-- ============================================
-- POST-DEPLOYMENT CHECKLIST:
-- ============================================
-- 1. Enable pg_cron extension in Supabase dashboard
-- 2. Uncomment the cron.schedule calls above
-- 3. Run: SELECT public.refresh_monthly_aggregates();
-- 4. Run: SELECT public.analyze_transactions_stats();
-- 5. Monitor index usage: SELECT * FROM pg_stat_user_indexes;
-- ============================================

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
