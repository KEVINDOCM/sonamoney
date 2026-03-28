-- ============================================
-- 006: RBAC & MFA (Multi-Factor Authentication)
-- Role-based access control with WebAuthn/FIDO2 support
-- ============================================

-- ============================================
-- ROLE PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'auditor', 'support')),
    resource TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('read', 'create', 'update', 'delete', 'admin')),
    conditions JSONB DEFAULT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default permissions
INSERT INTO public.role_permissions (role, resource, action, conditions, description) VALUES
    -- User role
    ('user', 'transactions', 'read', '{"own_only": true}', 'View own transactions'),
    ('user', 'transactions', 'create', '{"own_only": true}', 'Create transactions'),
    ('user', 'transactions', 'update', '{"own_only": true}', 'Update own transactions'),
    ('user', 'transactions', 'delete', '{"own_only": true}', 'Delete own transactions'),
    ('user', 'categories', 'read', NULL, 'View all categories'),
    ('user', 'categories', 'create', '{"own_only": true}', 'Create own categories'),
    ('user', 'categories', 'update', '{"own_only": true}', 'Update own categories'),
    ('user', 'categories', 'delete', '{"own_only": true}', 'Delete own categories'),
    ('user', 'settings', 'read', '{"own_only": true}', 'View own settings'),
    ('user', 'settings', 'update', '{"own_only": true}', 'Update own settings'),
    ('user', 'goals', 'read', '{"own_only": true}', 'View own goals'),
    ('user', 'goals', 'create', '{"own_only": true}', 'Create goals'),
    ('user', 'goals', 'update', '{"own_only": true}', 'Update own goals'),
    ('user', 'goals', 'delete', '{"own_only": true}', 'Delete own goals'),
    ('user', 'debts', 'read', '{"own_only": true}', 'View own debts'),
    ('user', 'debts', 'create', '{"own_only": true}', 'Create debts'),
    ('user', 'debts', 'update', '{"own_only": true}', 'Update own debts'),
    ('user', 'debts', 'delete', '{"own_only": true}', 'Delete own debts'),
    
    -- Admin role (full access)
    ('admin', 'transactions', 'admin', NULL, 'Full access to all transactions'),
    ('admin', 'users', 'admin', NULL, 'Full user management'),
    ('admin', 'categories', 'admin', NULL, 'Full category management'),
    ('admin', 'settings', 'admin', NULL, 'Full settings access'),
    ('admin', 'goals', 'admin', NULL, 'Full goals access'),
    ('admin', 'debts', 'admin', NULL, 'Full debts access'),
    ('admin', 'system', 'admin', NULL, 'System administration'),
    
    -- Auditor role (read-only)
    ('auditor', 'transactions', 'read', NULL, 'Read all transactions'),
    ('auditor', 'users', 'read', NULL, 'Read user list'),
    ('auditor', 'categories', 'read', NULL, 'Read all categories'),
    ('auditor', 'settings', 'read', NULL, 'Read all settings'),
    ('auditor', 'goals', 'read', NULL, 'Read all goals'),
    ('auditor', 'debts', 'read', NULL, 'Read all debts'),
    ('auditor', 'audit_logs', 'read', NULL, 'Read audit logs'),
    
    -- Support role (limited access)
    ('support', 'users', 'read', NULL, 'View user profiles'),
    ('support', 'transactions', 'read', NULL, 'View transactions for support'),
    ('support', 'categories', 'read', NULL, 'View categories'),
    ('support', 'settings', 'read', '{"own_only": true}', 'Own settings only')
ON CONFLICT DO NOTHING;

CREATE INDEX idx_role_permissions_lookup ON public.role_permissions(role, resource, action);

-- ============================================
-- MFA SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    webauthn_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    enforcement_level TEXT NOT NULL DEFAULT 'optional' 
        CHECK (enforcement_level IN ('optional', 'required', 'admin_bypass')),
    preferred_method TEXT CHECK (preferred_method IN ('webauthn', 'totp', NULL)),
    recovery_codes_hash TEXT[] DEFAULT ARRAY[]::TEXT[],
    recovery_codes_used BOOLEAN[] DEFAULT ARRAY[]::BOOLEAN[],
    device_count INTEGER NOT NULL DEFAULT 0,
    last_mfa_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mfa_settings_isolation" ON public.mfa_settings
    FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE UNIQUE INDEX idx_mfa_settings_user_id ON public.mfa_settings(user_id);
CREATE INDEX idx_mfa_settings_webauthn ON public.mfa_settings(webauthn_enabled) WHERE webauthn_enabled = TRUE;

CREATE TRIGGER update_mfa_settings_updated_at
    BEFORE UPDATE ON public.mfa_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- WEBAUTHN CREDENTIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key BYTEA NOT NULL,
    sign_count INTEGER NOT NULL DEFAULT 0,
    device_name TEXT NOT NULL DEFAULT 'Security Key',
    device_type TEXT CHECK (device_type IN ('platform', 'cross-platform')),
    aaguid UUID,
    attestation_object BYTEA,
    attestation_format TEXT,
    is_backup BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webauthn_credentials_isolation" ON public.webauthn_credentials
    FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX idx_webauthn_creds_user_id ON public.webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_creds_active ON public.webauthn_credentials(user_id, is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_webauthn_creds_updated_at
    BEFORE UPDATE ON public.webauthn_credentials
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- MFA VERIFICATION SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.mfa_verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL UNIQUE,
    challenge TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('webauthn', 'totp', 'recovery_code')),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mfa_verification_sessions ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "mfa_sessions_service" ON public.mfa_verification_sessions
    FOR ALL
    TO authenticated
    USING (TRUE);

CREATE INDEX idx_mfa_sessions_user_id ON public.mfa_verification_sessions(user_id);
CREATE INDEX idx_mfa_sessions_token ON public.mfa_verification_sessions(session_token_hash);
CREATE INDEX idx_mfa_sessions_expires ON public.mfa_verification_sessions(expires_at);

-- ============================================
-- MFA AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.mfa_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    method TEXT CHECK (method IN ('webauthn', 'totp', 'recovery_code')),
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    credential_id UUID REFERENCES public.webauthn_credentials(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mfa_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mfa_audit_isolation" ON public.mfa_audit_log
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE INDEX idx_mfa_audit_user_id ON public.mfa_audit_log(user_id, created_at DESC);
CREATE INDEX idx_mfa_audit_event ON public.mfa_audit_log(event_type, created_at DESC);
CREATE INDEX idx_mfa_audit_failed ON public.mfa_audit_log(user_id, success, created_at DESC) WHERE success = FALSE;

-- ============================================
-- MFA HELPER FUNCTIONS
-- ============================================

-- Function: Check if user has MFA enabled
CREATE OR REPLACE FUNCTION public.user_has_mfa_enabled(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_enabled BOOLEAN;
BEGIN
    SELECT (webauthn_enabled OR totp_enabled)
    INTO v_enabled
    FROM public.mfa_settings
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_enabled, FALSE);
END;
$$;

-- Function: Get active WebAuthn credentials
CREATE OR REPLACE FUNCTION public.get_active_webauthn_credentials(p_user_id UUID)
RETURNS TABLE (
    credential_id TEXT,
    public_key BYTEA,
    sign_count INTEGER,
    device_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT wc.credential_id, wc.public_key, wc.sign_count, wc.device_name
    FROM public.webauthn_credentials wc
    WHERE wc.user_id = p_user_id
      AND wc.is_active = TRUE
    ORDER BY wc.last_used_at DESC NULLS LAST;
END;
$$;

-- Function: Log MFA event
DROP FUNCTION IF EXISTS public.log_mfa_event(UUID, TEXT, TEXT, BOOLEAN, TEXT, INET, TEXT, UUID);
DROP FUNCTION IF EXISTS public.log_mfa_event(UUID, TEXT, TEXT, BOOLEAN, TEXT, INET, TEXT, UUID, JSONB);

CREATE OR REPLACE FUNCTION public.log_mfa_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_method TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_failure_reason TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_credential_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.mfa_audit_log (
        user_id, event_type, method, success, failure_reason,
        ip_address, user_agent, credential_id, metadata
    ) VALUES (
        p_user_id, p_event_type, p_method, p_success, p_failure_reason,
        p_ip_address, p_user_agent, p_credential_id, p_metadata
    );
END;
$$;

-- Function: Update credential sign count (replay attack prevention)
CREATE OR REPLACE FUNCTION public.update_webauthn_sign_count(
    p_credential_id TEXT,
    p_new_sign_count INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.webauthn_credentials
    SET sign_count = p_new_sign_count,
        last_used_at = NOW()
    WHERE credential_id = p_credential_id;
    
    RETURN FOUND;
END;
$$;

-- Function: Cleanup expired MFA sessions
DROP FUNCTION IF EXISTS public.cleanup_expired_mfa_sessions();

CREATE OR REPLACE FUNCTION public.cleanup_expired_mfa_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.mfa_verification_sessions
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- Function: Cleanup old MFA audit (1 year retention)
DROP FUNCTION IF EXISTS public.cleanup_old_mfa_audit();

CREATE OR REPLACE FUNCTION public.cleanup_old_mfa_audit()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.mfa_audit_log
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- ============================================
-- ASSIGN ROLE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.assign_role(
    p_target_user_id UUID,
    p_role TEXT,
    p_assigned_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if assigner is admin
    IF NOT public.is_admin(p_assigned_by) THEN
        RAISE EXCEPTION 'Only admins can assign roles';
    END IF;
    
    -- Validate role
    IF p_role NOT IN ('user', 'admin', 'auditor', 'support') THEN
        RAISE EXCEPTION 'Invalid role: %', p_role;
    END IF;
    
    -- Insert or update role
    INSERT INTO public.user_roles (user_id, role, created_by, updated_by)
    VALUES (p_target_user_id, p_role, p_assigned_by, p_assigned_by)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        role = p_role,
        updated_at = NOW(),
        updated_by = p_assigned_by;
    
    -- Log the action
    PERFORM public.log_security_event(
        p_assigned_by,
        'role.assigned',
        'success',
        'user_roles',
        'update',
        p_target_user_id,
        NULL,
        jsonb_build_object('assigned_role', p_role, 'target_user', p_target_user_id)
    );
    
    RETURN TRUE;
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT, UPDATE ON public.mfa_settings TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.webauthn_credentials TO authenticated;
GRANT SELECT ON public.mfa_audit_log TO authenticated;

GRANT EXECUTE ON FUNCTION public.user_has_mfa_enabled TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_mfa_enabled TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_webauthn_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_mfa_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_webauthn_sign_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_role TO authenticated;

REVOKE ALL ON public.mfa_verification_sessions FROM authenticated;
REVOKE ALL ON public.mfa_verification_sessions FROM anon;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
