-- ============================================
-- 012: DISABLE RLS ON SYSTEM TABLES
-- These tables are service-role-only, RLS is unnecessary
-- ============================================

-- Disable RLS on audit_log (service role only, users cannot read their own logs)
ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;

-- Disable RLS on auth_attempts (service role only, security tracking)
ALTER TABLE public.auth_attempts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on default_categories (seed data, publicly readable)
ALTER TABLE public.default_categories DISABLE ROW LEVEL SECURITY;

-- Disable RLS on ip_blocks (service role only, security management)
ALTER TABLE public.ip_blocks DISABLE ROW LEVEL SECURITY;

-- Disable RLS on rate_limit_entries (service role only, rate limiting)
ALTER TABLE public.rate_limit_entries DISABLE ROW LEVEL SECURITY;

-- Disable RLS on rate_limit_violations (service role only, security audit)
ALTER TABLE public.rate_limit_violations DISABLE ROW LEVEL SECURITY;
