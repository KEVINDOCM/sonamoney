-- ============================================
-- 011: FIX FUNCTION SEARCH PATH MUTABLE
-- Add set search_path = '' to cleanup functions for security
-- ============================================

-- Fix cleanup_old_auth_attempts
CREATE OR REPLACE FUNCTION cleanup_old_auth_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.auth_attempts
  WHERE attempted_at < now() - interval '24 hours';
END;
$$;

-- Fix cleanup_expired_rate_limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.rate_limit_entries
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Fix cleanup_expired_ip_blocks
CREATE OR REPLACE FUNCTION cleanup_expired_ip_blocks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.ip_blocks
  WHERE expires_at < now();
END;
$$;

-- Fix cleanup_old_violations
CREATE OR REPLACE FUNCTION cleanup_old_violations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.rate_limit_violations
  WHERE timestamp < now() - interval '30 days';
END;
$$;

-- Fix cleanup_old_audit_logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.audit_log
  WHERE created_at < now() - interval '90 days';
END;
$$;
