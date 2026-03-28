-- ============================================
-- 009c: DROP SECURITY DEFINER VIEWS
-- Removes views flagged by linter
-- Views already replaced by secure functions
-- ============================================

DROP VIEW IF EXISTS public.v_user_monthly_aggregates;
DROP VIEW IF EXISTS public.v_user_category_spending;
DROP VIEW IF EXISTS public.v_user_account_balances;
DROP VIEW IF EXISTS public.v_user_financial_health;

NOTIFY pgrst, 'reload schema';
