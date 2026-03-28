-- ============================================
-- 009: MATERIALIZED VIEWS & AGGREGATES
-- Pre-computed analytics for instant dashboard loading
-- Automated refresh with concurrent updates
-- ============================================

-- ============================================
-- 1. MONTHLY FINANCIAL AGGREGATES
-- Pre-computed monthly summaries by type
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_monthly_aggregates CASCADE;

CREATE MATERIALIZED VIEW mv_monthLY_aggregates AS
SELECT
    user_id,
    DATE_TRUNC('month', date)::DATE AS month,
    type,
    SUM(amount) AS total_amount,
    COUNT(*) AS transaction_count,
    AVG(amount) AS avg_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount,
    COUNT(DISTINCT category_id) AS category_count
FROM public.transactions
WHERE is_recurring = FALSE
GROUP BY user_id, DATE_TRUNC('month', date), type;

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_mv_monthly_aggregates_unique
ON mv_monthly_aggregates (user_id, month, type);

-- Query support indexes
CREATE INDEX idx_mv_monthly_aggregates_user_month
ON mv_monthly_aggregates (user_id, month);

CREATE INDEX idx_mv_monthly_aggregates_user_type
ON mv_monthly_aggregates (user_id, type, month);

COMMENT ON MATERIALIZED VIEW mv_monthly_aggregates IS 
'Pre-computed monthly financial aggregates for dashboard analytics';

-- ============================================
-- 2. CATEGORY SPENDING ANALYSIS
-- Monthly spending by category
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_category_spending CASCADE;

CREATE MATERIALIZED VIEW mv_category_spending AS
SELECT
    user_id,
    category_id,
    DATE_TRUNC('month', date)::DATE AS month,
    SUM(amount) AS total_amount,
    COUNT(*) AS transaction_count,
    AVG(amount) AS avg_amount
FROM public.transactions
WHERE type = 'expense' AND is_recurring = FALSE
GROUP BY user_id, category_id, DATE_TRUNC('month', date);

CREATE UNIQUE INDEX idx_mv_category_spending_unique
ON mv_category_spending (user_id, category_id, month);

CREATE INDEX idx_mv_category_spending_user_month
ON mv_category_spending (user_id, month DESC);

COMMENT ON MATERIALIZED VIEW mv_category_spending IS 
'Monthly spending breakdown by category for budget analysis';

-- ============================================
-- 3. ACCOUNT BALANCE HISTORY
-- Daily snapshot of account balances
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_account_balance_history CASCADE;

CREATE MATERIALIZED VIEW mv_account_balance_history AS
SELECT
    a.user_id,
    a.id AS account_id,
    a.name AS account_name,
    a.currency,
    a.balance AS current_balance,
    DATE_TRUNC('day', NOW())::DATE AS snapshot_date,
    (SELECT SUM(CASE 
        WHEN t.type = 'income' THEN t.amount 
        ELSE -t.amount 
    END)
    FROM public.transactions t
    WHERE t.account_id = a.id AND t.date >= DATE_TRUNC('month', CURRENT_DATE)
    ) AS mtd_flow,
    (SELECT COALESCE(SUM(t.amount), 0)
    FROM public.transactions t
    WHERE t.account_id = a.id AND t.type = 'income' AND t.date >= DATE_TRUNC('month', CURRENT_DATE)
    ) AS mtd_income,
    (SELECT COALESCE(SUM(t.amount), 0)
    FROM public.transactions t
    WHERE t.account_id = a.id AND t.type = 'expense' AND t.date >= DATE_TRUNC('month', CURRENT_DATE)
    ) AS mtd_expense
FROM public.accounts a
WHERE a.is_active = TRUE;

CREATE UNIQUE INDEX idx_mv_account_balance_unique
ON mv_account_balance_history (account_id, snapshot_date);

CREATE INDEX idx_mv_account_balance_user
ON mv_account_balance_history (user_id, snapshot_date);

COMMENT ON MATERIALIZED VIEW mv_account_balance_history IS 
'Current account balance snapshot with month-to-date flows';

-- ============================================
-- 4. FINANCIAL HEALTH OVERVIEW
-- Aggregated health metrics per user
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_financial_health_overview CASCADE;

CREATE MATERIALIZED VIEW mv_financial_health_overview AS
WITH user_stats AS (
    SELECT
        user_id,
        COUNT(*) FILTER (WHERE type = 'expense') AS expense_count_30d,
        COUNT(*) FILTER (WHERE type = 'income') AS income_count_30d,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expenses_30d,
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income_30d
    FROM public.transactions
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      AND is_recurring = FALSE
    GROUP BY user_id
),
account_stats AS (
    SELECT
        user_id,
        SUM(balance) AS total_balance,
        COUNT(*) AS account_count,
        SUM(balance) FILTER (WHERE currency = 'IDR') AS idr_balance,
        SUM(balance) FILTER (WHERE currency != 'IDR') AS foreign_balance
    FROM public.accounts
    WHERE is_active = TRUE
    GROUP BY user_id
),
debt_stats AS (
    SELECT
        user_id,
        SUM(current_balance) AS total_debt,
        COUNT(*) AS debt_count
    FROM public.debts
    WHERE is_active = TRUE
    GROUP BY user_id
)
SELECT
    a.user_id,
    a.total_balance,
    a.account_count,
    a.idr_balance,
    a.foreign_balance,
    COALESCE(d.total_debt, 0) AS total_debt,
    COALESCE(d.debt_count, 0) AS debt_count,
    a.total_balance - COALESCE(d.total_debt, 0) AS net_worth,
    COALESCE(u.income_count_30d, 0) AS income_count_30d,
    COALESCE(u.expense_count_30d, 0) AS expense_count_30d,
    COALESCE(u.income_30d, 0) AS income_30d,
    COALESCE(u.expenses_30d, 0) AS expenses_30d,
    CASE 
        WHEN u.income_30d > 0 THEN ROUND((u.income_30d - u.expenses_30d) / u.income_30d * 100, 2)
        ELSE 0
    END AS savings_rate_pct,
    NOW() AS computed_at
FROM account_stats a
LEFT JOIN debt_stats d ON a.user_id = d.user_id
LEFT JOIN user_stats u ON a.user_id = u.user_id;

CREATE UNIQUE INDEX idx_mv_financial_health_unique
ON mv_financial_health_overview (user_id);

CREATE INDEX idx_mv_financial_health_net_worth
ON mv_financial_health_overview (net_worth DESC);

COMMENT ON MATERIALIZED VIEW mv_financial_health_overview IS 
'Comprehensive financial health snapshot per user';

-- ============================================
-- 5. REFRESH FUNCTIONS
-- ============================================

-- Refresh all materialized views concurrently
CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_result JSONB;
BEGIN
    v_start_time := clock_timestamp();
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_aggregates;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_spending;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_account_balance_history;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_health_overview;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'refresh_time_ms', EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time),
        'refreshed_at', NOW()
    );
    
    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- Refresh specific view
CREATE OR REPLACE FUNCTION public.refresh_materialized_view(p_view_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    CASE p_view_name
        WHEN 'monthly_aggregates' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_aggregates;
        WHEN 'category_spending' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_spending;
        WHEN 'account_balance_history' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_account_balance_history;
        WHEN 'financial_health_overview' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_health_overview;
        ELSE
            RETURN jsonb_build_object('success', FALSE, 'error', 'Unknown view: ' || p_view_name);
    END CASE;
    
    RETURN jsonb_build_object('success', TRUE, 'view', p_view_name, 'refreshed_at', NOW());
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON mv_monthly_aggregates TO authenticated;
GRANT SELECT ON mv_category_spending TO authenticated;
GRANT SELECT ON mv_account_balance_history TO authenticated;
GRANT SELECT ON mv_financial_health_overview TO authenticated;

GRANT EXECUTE ON FUNCTION public.refresh_all_materialized_views TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_materialized_view TO service_role;

-- Revoke direct refresh from regular users
REVOKE ALL ON mv_monthly_aggregates FROM anon;
REVOKE ALL ON mv_category_spending FROM anon;
REVOKE ALL ON mv_account_balance_history FROM anon;
REVOKE ALL ON mv_financial_health_overview FROM anon;

-- ============================================
-- 7. SCHEDULING NOTES
-- ============================================
-- Use pg_cron extension (enable in Supabase dashboard) to schedule refresh:
-- 
-- Every hour:
-- SELECT cron.schedule('refresh-monthly-aggregates', '0 * * * *', 'SELECT public.refresh_materialized_view(''monthly_aggregates'')');
--
-- Daily at 3 AM:
-- SELECT cron.schedule('refresh-all-views', '0 3 * * *', 'SELECT public.refresh_all_materialized_views()');

COMMENT ON FUNCTION public.refresh_all_materialized_views() IS 
'Refreshes all materialized views concurrently. Schedule via pg_cron.';

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
