-- ============================================
-- 018: SECURITY FIX - Restrict mv_monthly_aggregates Access
-- Fixes: Remove public access and enforce user data isolation
-- ============================================

begin;

-- ============================================
-- 1. REVOKE ALL PUBLIC ACCESS
-- Remove dangerous anon access to sensitive aggregated data
-- ============================================

-- Revoke from anon (public) role completely
REVOKE ALL ON mv_monthly_aggregates FROM anon;

-- Revoke from authenticated direct access - they must use the secure function
REVOKE ALL ON mv_monthly_aggregates FROM authenticated;

-- Only service_role can directly access (for refresh operations)
GRANT SELECT ON mv_monthly_aggregates TO service_role;

-- ============================================
-- 2. CREATE SECURE ACCESS FUNCTION
-- Security definer function that filters by current user
-- Acts as RLS-like protection for materialized view
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_monthly_aggregates(
  p_start_date date DEFAULT null,
  p_end_date date DEFAULT null
)
RETURNS TABLE (
  month timestamp with time zone,
  type text,
  total_amount numeric,
  transaction_count bigint,
  avg_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Return empty if no authenticated user
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return filtered results for current user only
  RETURN QUERY
  SELECT 
    m.month,
    m.type,
    m.total_amount,
    m.transaction_count,
    m.avg_amount
  FROM mv_monthly_aggregates m
  WHERE m.user_id = v_user_id
    AND (p_start_date IS NULL OR m.month >= p_start_date)
    AND (p_end_date IS NULL OR m.month <= p_end_date)
  ORDER BY m.month DESC, m.type;
END;
$$;

-- ============================================
-- 3. GRANT SECURE ACCESS
-- Only authenticated users can execute, anon cannot
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_user_monthly_aggregates(date, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_monthly_aggregates(date, date) FROM anon;

-- ============================================
-- 4. COMMENT FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION public.get_user_monthly_aggregates(date, date) IS 
'Security definer function that returns monthly aggregates for the currently authenticated user only.
Acts as RLS-like protection since materialized views do not support RLS policies directly.
Parameters:
  - p_start_date: Optional filter for start month (inclusive)
  - p_end_date: Optional filter for end month (inclusive)
Returns empty result set if called without authentication.';

commit;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
