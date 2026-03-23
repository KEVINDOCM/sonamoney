-- ============================================
-- 009: FIX AI RATE LIMITS RLS POLICY
-- Fix auth_rls_initplan performance warning
-- Wrap auth.uid() with (select ...) for optimization
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can only access own rate limit" ON public.ai_rate_limits;

-- Recreate policy with optimized (select auth.uid()) pattern
-- This prevents per-row re-evaluation of auth functions
CREATE POLICY "Users can only access own rate limit" ON public.ai_rate_limits
  FOR ALL USING ((select auth.uid()) = user_id);

-- Also ensure the table has RLS enabled
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
