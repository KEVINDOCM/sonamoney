-- ============================================
-- 009b: MATERIALIZED VIEW SECURITY FIX
-- Secure access to MVs with user-filtered functions
-- Prevents cross-user data leakage
-- ============================================

-- ============================================
-- 1. REVOKE ALL PUBLIC ACCESS
-- Remove access from anon and public roles
-- ============================================
REVOKE ALL ON mv_monthly_aggregates FROM anon;
REVOKE ALL ON mv_monthly_aggregates FROM public;

REVOKE ALL ON mv_category_spending FROM anon;
REVOKE ALL ON mv_category_spending FROM public;

REVOKE ALL ON mv_account_balance_history FROM anon;
REVOKE ALL ON mv_account_balance_history FROM public;

REVOKE ALL ON mv_financial_health_overview FROM anon;
REVOKE ALL ON mv_financial_health_overview FROM public;

-- ============================================
-- 2. SECURITY DEFINER FUNCTIONS FOR USER DATA
-- These act as RLS filters for materialized views
-- ============================================

-- User's monthly aggregates
CREATE OR REPLACE FUNCTION public.get_user_monthly_aggregates(
    p_month DATE DEFAULT NULL
)
RETURNS TABLE (
    month DATE,
    type TEXT,
    total_amount NUMERIC,
    transaction_count BIGINT,
    avg_amount NUMERIC,
    min_amount NUMERIC,
    max_amount NUMERIC,
    category_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        ma.month,
        ma.type,
        ma.total_amount,
        ma.transaction_count,
        ma.avg_amount,
        ma.min_amount,
        ma.max_amount,
        ma.category_count
    FROM mv_monthly_aggregates ma
    WHERE ma.user_id = auth.uid()
      AND (p_month IS NULL OR ma.month = p_month)
    ORDER BY ma.month DESC, ma.type;
$$;

-- User's category spending
CREATE OR REPLACE FUNCTION public.get_user_category_spending(
    p_category_id UUID DEFAULT NULL,
    p_month DATE DEFAULT NULL
)
RETURNS TABLE (
    category_id UUID,
    month DATE,
    total_amount NUMERIC,
    transaction_count BIGINT,
    avg_amount NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        cs.category_id,
        cs.month,
        cs.total_amount,
        cs.transaction_count,
        cs.avg_amount
    FROM mv_category_spending cs
    WHERE cs.user_id = auth.uid()
      AND (p_category_id IS NULL OR cs.category_id = p_category_id)
      AND (p_month IS NULL OR cs.month = p_month)
    ORDER BY cs.month DESC, cs.total_amount DESC;
$$;

-- User's account balance history
CREATE OR REPLACE FUNCTION public.get_user_account_balances()
RETURNS TABLE (
    account_id UUID,
    account_name TEXT,
    currency TEXT,
    current_balance NUMERIC,
    snapshot_date DATE,
    mtd_flow NUMERIC,
    mtd_income NUMERIC,
    mtd_expense NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        ab.account_id,
        ab.account_name,
        ab.currency,
        ab.current_balance,
        ab.snapshot_date,
        ab.mtd_flow,
        ab.mtd_income,
        ab.mtd_expense
    FROM mv_account_balance_history ab
    WHERE ab.user_id = auth.uid()
    ORDER BY ab.account_name;
$$;

-- User's financial health overview
CREATE OR REPLACE FUNCTION public.get_user_financial_health()
RETURNS TABLE (
    total_balance NUMERIC,
    account_count BIGINT,
    idr_balance NUMERIC,
    foreign_balance NUMERIC,
    total_debt NUMERIC,
    debt_count BIGINT,
    net_worth NUMERIC,
    income_count_30d BIGINT,
    expense_count_30d BIGINT,
    income_30d NUMERIC,
    expenses_30d NUMERIC,
    savings_rate_pct NUMERIC,
    computed_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        fh.total_balance,
        fh.account_count,
        fh.idr_balance,
        fh.foreign_balance,
        fh.total_debt,
        fh.debt_count,
        fh.net_worth,
        fh.income_count_30d,
        fh.expense_count_30d,
        fh.income_30d,
        fh.expenses_30d,
        fh.savings_rate_pct,
        fh.computed_at
    FROM mv_financial_health_overview fh
    WHERE fh.user_id = auth.uid();
$$;

-- Combined dashboard data function
CREATE OR REPLACE FUNCTION public.get_user_dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_health RECORD;
    v_result JSONB;
BEGIN
    SELECT * INTO v_health FROM public.get_user_financial_health() LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'No financial data found'
        );
    END IF;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'financial_health', to_jsonb(v_health),
        'recent_accounts', (
            SELECT jsonb_agg(to_jsonb(ab.*))
            FROM public.get_user_account_balances() ab
            LIMIT 5
        ),
        'recent_monthly', (
            SELECT jsonb_agg(to_jsonb(ma.*))
            FROM public.get_user_monthly_aggregates() ma
            LIMIT 6
        ),
        'top_spending_categories', (
            SELECT jsonb_agg(to_jsonb(cs.*))
            FROM public.get_user_category_spending() cs
            LIMIT 5
        )
    );
    
    RETURN v_result;
END;
$$;

-- ============================================
-- 3. GRANT PERMISSIONS ON SECURE FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_user_monthly_aggregates(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_category_spending(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_account_balances() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_financial_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_summary() TO authenticated;

-- Revoke from anon
REVOKE EXECUTE ON FUNCTION public.get_user_monthly_aggregates(DATE) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_category_spending(UUID, DATE) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_account_balances() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_financial_health() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_dashboard_summary() FROM anon;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
