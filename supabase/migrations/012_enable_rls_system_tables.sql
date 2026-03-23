-- ============================================
-- 012: ENABLE RLS ON SYSTEM TABLES (SERVICE-ROLE ONLY)
-- RLS must be enabled for public schema, but no user policies needed
-- Service role bypasses RLS automatically
-- ============================================

-- Enable RLS on audit_log (service role only, no user policies)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS on auth_attempts (service role only, security tracking)
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on default_categories (seed data, service role manages it)
ALTER TABLE public.default_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ip_blocks (service role only, security management)
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rate_limit_entries (service role only, rate limiting)
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rate_limit_violations (service role only, security audit)
ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- No user-facing policies created - these tables are service-role-only
-- Service role bypasses RLS, so this is the intended secure configuration
