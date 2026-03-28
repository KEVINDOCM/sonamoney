-- ============================================
-- 004: SECURITY & AUDIT
-- Authentication security, audit logging, and rate limiting
-- PCI DSS 4.0 compliant logging and monitoring
-- ============================================

-- ============================================
-- AUTH ATTEMPTS TRACKING (Failed login monitoring)
-- ============================================
CREATE TABLE IF NOT EXISTS public.auth_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    failure_reason TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can access auth attempts - no user policies

-- Optimized indexes for auth monitoring
CREATE INDEX idx_auth_attempts_email ON public.auth_attempts(email, attempted_at DESC);
CREATE INDEX idx_auth_attempts_ip ON public.auth_attempts(ip_address, attempted_at DESC);
CREATE INDEX idx_auth_attempts_recent ON public.auth_attempts(attempted_at DESC) WHERE success = FALSE;

COMMENT ON TABLE public.auth_attempts IS 'Login attempt tracking for brute force detection';

-- ============================================
-- AUDIT LOG (Security Events)
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_status TEXT NOT NULL CHECK (event_status IN ('success', 'failure', 'blocked')),
    resource TEXT, -- Table/resource affected
    action TEXT, -- CRUD action
    record_id UUID, -- Affected record
    old_data JSONB,
    new_data JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs (limited)
CREATE POLICY "audit_log_user_view" ON public.audit_log
    FOR SELECT
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR public.get_user_role((SELECT auth.uid())) IN ('admin', 'auditor')
    );

-- Optimized indexes for audit queries
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_event_type ON public.audit_log(event_type, created_at DESC);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource, action, created_at DESC);
CREATE INDEX idx_audit_log_ip ON public.audit_log(ip_address, created_at DESC);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_session ON public.audit_log(session_id, created_at DESC) WHERE session_id IS NOT NULL;

COMMENT ON TABLE public.audit_log IS 'Comprehensive security audit trail with 90-day retention';

-- ============================================
-- RATE LIMITING TABLES (Database fallback)
-- ============================================
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    endpoint_type TEXT NOT NULL CHECK (endpoint_type IN ('general', 'auth', 'sensitive', 'api')),
    identifier TEXT, -- User ID for authenticated requests
    request_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_duration_ms INTEGER NOT NULL,
    max_requests INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ip_address, endpoint_type, identifier, window_start)
);

ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- Optimized indexes for rate limiting
CREATE INDEX idx_rate_limit_lookup ON public.rate_limit_entries(ip_address, endpoint_type, identifier, window_start);
CREATE INDEX idx_rate_limit_window ON public.rate_limit_entries(window_start);

COMMENT ON TABLE public.rate_limit_entries IS 'Distributed rate limiting fallback storage';

-- ============================================
-- IP BLOCKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.ip_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    triggered_by TEXT, -- Which rule triggered the block
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;

-- Optimized indexes
CREATE INDEX idx_ip_blocks_address ON public.ip_blocks(ip_address);
CREATE INDEX idx_ip_blocks_expires ON public.ip_blocks(expires_at);

COMMENT ON TABLE public.ip_blocks IS 'Temporary IP blocks for security violations';

-- ============================================
-- RATE LIMIT VIOLATIONS LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    violation_type TEXT NOT NULL CHECK (violation_type IN ('rate_limit', 'ip_blocked', 'quota_exceeded')),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- Optimized indexes
CREATE INDEX idx_violations_ip ON public.rate_limit_violations(ip_address, timestamp DESC);
CREATE INDEX idx_violations_user ON public.rate_limit_violations(user_id, timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_violations_timestamp ON public.rate_limit_violations(timestamp DESC);

COMMENT ON TABLE public.rate_limit_violations IS 'Rate limit violation history for security analysis';

-- ============================================
-- SECURITY FUNCTIONS
-- ============================================

-- Function: Check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.ip_blocks
        WHERE ip_address = p_ip_address
          AND (blocked_at IS NOT NULL OR expires_at > NOW())
          AND expires_at > NOW()
    );
END;
$$;

-- Function: Log security event
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_status TEXT,
    p_resource TEXT DEFAULT NULL,
    p_action TEXT DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_log (
        user_id, event_type, event_status, resource, action,
        record_id, old_data, new_data, metadata, ip_address, user_agent
    ) VALUES (
        p_user_id, p_event_type, p_event_status, p_resource, p_action,
        p_record_id, p_old_data, p_new_data, p_metadata, p_ip_address, p_user_agent
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- ============================================
-- CLEANUP FUNCTIONS
-- ============================================

-- Drop existing functions first (handle return type changes)
DROP FUNCTION IF EXISTS public.cleanup_old_auth_attempts();
DROP FUNCTION IF EXISTS public.cleanup_old_audit_logs();
DROP FUNCTION IF EXISTS public.cleanup_expired_rate_limits();
DROP FUNCTION IF EXISTS public.cleanup_expired_ip_blocks();
DROP FUNCTION IF EXISTS public.cleanup_old_violations();

-- Cleanup old auth attempts (24 hour retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_auth_attempts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.auth_attempts
    WHERE attempted_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- Cleanup old audit logs (90 day retention for most events)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Keep critical security events longer
    DELETE FROM public.audit_log
    WHERE created_at < NOW() - INTERVAL '90 days'
      AND event_type NOT IN ('security.breach', 'auth.suspicious', 'data.deletion');
    
    -- Delete even critical events after 1 year
    DELETE FROM public.audit_log
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- Cleanup expired rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.rate_limit_entries
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- Cleanup expired IP blocks
CREATE OR REPLACE FUNCTION public.cleanup_expired_ip_blocks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.ip_blocks
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- Cleanup old rate limit violations (30 day retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_violations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.rate_limit_violations
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- ============================================
-- AGGREGATE CLEANUP FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.run_security_cleanup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_attempts INTEGER;
    v_audit_logs INTEGER;
    v_rate_limits INTEGER;
    v_ip_blocks INTEGER;
    v_violations INTEGER;
BEGIN
    v_auth_attempts := public.cleanup_old_auth_attempts();
    v_audit_logs := public.cleanup_old_audit_logs();
    v_rate_limits := public.cleanup_expired_rate_limits();
    v_ip_blocks := public.cleanup_expired_ip_blocks();
    v_violations := public.cleanup_old_violations();
    
    RETURN jsonb_build_object(
        'auth_attempts_deleted', v_auth_attempts,
        'audit_logs_deleted', v_audit_logs,
        'rate_limits_deleted', v_rate_limits,
        'ip_blocks_deleted', v_ip_blocks,
        'violations_deleted', v_violations,
        'cleanup_time', NOW()
    );
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Service role only for security tables
GRANT INSERT ON public.auth_attempts TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_ip_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

-- Service role functions
GRANT EXECUTE ON FUNCTION public.run_security_cleanup TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_auth_attempts TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rate_limits TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_ip_blocks TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_violations TO service_role;

-- Revoke from anon
REVOKE ALL ON public.auth_attempts FROM anon;
REVOKE ALL ON public.audit_log FROM anon;
REVOKE ALL ON public.rate_limit_entries FROM anon;
REVOKE ALL ON public.ip_blocks FROM anon;
REVOKE ALL ON public.rate_limit_violations FROM anon;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
