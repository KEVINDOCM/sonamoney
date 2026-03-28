-- ============================================
-- 009d: LINTER SECURITY FIXES
-- Fix search_path, revoke MV access, fix RLS
-- ============================================

-- ============================================
-- 1. FIX FUNCTIONS MISSING SEARCH_PATH
-- ============================================

-- Fix log_role_change
DROP FUNCTION IF EXISTS public.log_role_change();

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_log (table_name, action, old_data, new_data, user_id)
    VALUES (
        'user_roles',
        TG_OP,
        to_jsonb(OLD),
        to_jsonb(NEW),
        COALESCE(NEW.user_id, OLD.user_id)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix refresh_monthly_aggregates
DROP FUNCTION IF EXISTS public.refresh_monthly_aggregates();

CREATE OR REPLACE FUNCTION public.refresh_monthly_aggregates()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_aggregates;
END;
$$;

-- Fix analyze_transactions_stats
DROP FUNCTION IF EXISTS public.analyze_transactions_stats();

CREATE OR REPLACE FUNCTION public.analyze_transactions_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    ANALYZE public.transactions;
    ANALYZE public.accounts;
END;
$$;

-- ============================================
-- 2. REVOKE MATERIALIZED VIEW API ACCESS
-- Prevent direct access via Data APIs
-- ============================================

REVOKE SELECT ON public.mv_monthly_aggregates FROM anon;
REVOKE SELECT ON public.mv_monthly_aggregates FROM authenticated;
REVOKE SELECT ON public.mv_monthly_aggregates FROM public;

REVOKE SELECT ON public.mv_category_spending FROM anon;
REVOKE SELECT ON public.mv_category_spending FROM authenticated;
REVOKE SELECT ON public.mv_category_spending FROM public;

REVOKE SELECT ON public.mv_account_balance_history FROM anon;
REVOKE SELECT ON public.mv_account_balance_history FROM authenticated;
REVOKE SELECT ON public.mv_account_balance_history FROM public;

REVOKE SELECT ON public.mv_financial_health_overview FROM anon;
REVOKE SELECT ON public.mv_financial_health_overview FROM authenticated;
REVOKE SELECT ON public.mv_financial_health_overview FROM public;

-- ============================================
-- 3. FIX RLS POLICY - MFA SESSIONS
-- Replace overly permissive policy
-- ============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS mfa_sessions_service ON public.mfa_verification_sessions;

-- Create proper policies
CREATE POLICY mfa_sessions_select_own
    ON public.mfa_verification_sessions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY mfa_sessions_insert_own
    ON public.mfa_verification_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY mfa_sessions_update_own
    ON public.mfa_verification_sessions
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY mfa_sessions_delete_own
    ON public.mfa_verification_sessions
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Service role policy (for background jobs)
CREATE POLICY mfa_sessions_service_select
    ON public.mfa_verification_sessions
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY mfa_sessions_service_delete
    ON public.mfa_verification_sessions
    FOR DELETE
    TO service_role
    USING (expires_at < NOW());

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
