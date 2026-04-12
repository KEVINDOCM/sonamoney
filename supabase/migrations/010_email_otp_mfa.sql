-- ============================================
-- 010: Email OTP MFA & Session Management
-- Extends existing MFA for Email OTP with device trust
-- ============================================

-- ============================================
-- EMAIL OTP MFA SETTINGS (extends mfa_settings)
-- ============================================
ALTER TABLE public.mfa_settings 
ADD COLUMN IF NOT EXISTS email_otp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_otp_secret TEXT, -- encrypted OTP seed
ADD COLUMN IF NOT EXISTS trusted_devices JSONB DEFAULT '[]'::jsonb;

-- Update check constraint for preferred_method
ALTER TABLE public.mfa_settings DROP CONSTRAINT IF EXISTS mfa_settings_preferred_method_check;
ALTER TABLE public.mfa_settings ADD CONSTRAINT mfa_settings_preferred_method_check 
    CHECK (preferred_method IN ('webauthn', 'totp', 'email_otp', NULL));

-- ============================================
-- MFA VERIFICATION ATTEMPTS (rate limiting)
-- ============================================
CREATE TABLE IF NOT EXISTS public.mfa_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('send', 'verify')),
    success BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mfa_attempts_user_time ON public.mfa_attempts(user_id, attempt_at DESC);
CREATE INDEX idx_mfa_attempts_ip ON public.mfa_attempts(ip_address, attempt_at DESC);

-- Cleanup old attempts (performance)
CREATE OR REPLACE FUNCTION cleanup_old_mfa_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM public.mfa_attempts WHERE attempt_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- ============================================
-- USER SESSIONS (device tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    ip_address TEXT,
    user_agent TEXT,
    location TEXT, -- GeoIP city/country
    mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
    trusted BOOLEAN NOT NULL DEFAULT FALSE,
    trusted_until TIMESTAMPTZ, -- 30-day trust expiry
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id, expires_at DESC);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_fingerprint ON public.user_sessions(device_fingerprint) WHERE trusted = TRUE;

-- RLS policies
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sessions_isolation" ON public.user_sessions
    FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Admin can view all sessions for management
CREATE POLICY "admin_sessions_view" ON public.user_sessions
    FOR SELECT
    TO authenticated
    USING (public.is_admin((SELECT auth.uid())));

-- ============================================
-- PENDING MFA CHALLENGES (temporary storage)
-- ============================================
CREATE TABLE IF NOT EXISTS public.mfa_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('email_otp', 'totp', 'webauthn')),
    otp_code_hash TEXT, -- bcrypt hashed OTP
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    device_fingerprint TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mfa_challenges_user ON public.mfa_challenges(user_id, expires_at DESC);
CREATE INDEX idx_mfa_challenges_expiry ON public.mfa_challenges(expires_at) WHERE used = FALSE;

-- Auto-cleanup expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_challenges()
RETURNS void AS $$
BEGIN
    DELETE FROM public.mfa_challenges WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- ============================================
-- FUNCTIONS FOR MFA OPERATIONS
-- ============================================

-- Drop existing functions if parameter names differ (to avoid 42P13 error)
DROP FUNCTION IF EXISTS public.user_has_mfa_enabled(UUID);
DROP FUNCTION IF EXISTS public.count_active_sessions(UUID);
DROP FUNCTION IF EXISTS public.is_trusted_device(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_user_mfa_method(UUID);

-- Check if user has MFA enabled
CREATE OR REPLACE FUNCTION public.user_has_mfa_enabled(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_mfa BOOLEAN;
BEGIN
    SELECT COALESCE(
        webauthn_enabled OR totp_enabled OR email_otp_enabled, 
        FALSE
    ) INTO has_mfa
    FROM public.mfa_settings
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(has_mfa, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Count active sessions for user
CREATE OR REPLACE FUNCTION public.count_active_sessions(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count
    FROM public.user_sessions
    WHERE user_id = user_uuid AND expires_at > NOW();
    
    RETURN session_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Check if device is trusted
CREATE OR REPLACE FUNCTION public.is_trusted_device(
    user_uuid UUID, 
    fingerprint TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    trusted BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_sessions
        WHERE user_id = user_uuid 
          AND device_fingerprint = fingerprint
          AND trusted = TRUE 
          AND trusted_until > NOW()
    ) INTO trusted;
    
    RETURN COALESCE(trusted, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Get user's preferred MFA method
CREATE OR REPLACE FUNCTION public.get_user_mfa_method(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    method TEXT;
    settings RECORD;
BEGIN
    SELECT webauthn_enabled, totp_enabled, email_otp_enabled, preferred_method
    INTO settings
    FROM public.mfa_settings
    WHERE user_id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Return preferred if set and enabled
    IF settings.preferred_method IS NOT NULL THEN
        CASE settings.preferred_method
            WHEN 'webauthn' AND settings.webauthn_enabled THEN RETURN 'webauthn';
            WHEN 'totp' AND settings.totp_enabled THEN RETURN 'totp';
            WHEN 'email_otp' AND settings.email_otp_enabled THEN RETURN 'email_otp';
        END CASE;
    END IF;
    
    -- Return first enabled method
    IF settings.webauthn_enabled THEN RETURN 'webauthn'; END IF;
    IF settings.totp_enabled THEN RETURN 'totp'; END IF;
    IF settings.email_otp_enabled THEN RETURN 'email_otp'; END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- ============================================
-- TRIGGERS
-- ============================================

-- Update mfa_settings updated_at
CREATE OR REPLACE FUNCTION update_mfa_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

DROP TRIGGER IF EXISTS update_mfa_settings_updated_at ON public.mfa_settings;
CREATE TRIGGER update_mfa_settings_updated_at
    BEFORE UPDATE ON public.mfa_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_mfa_settings_timestamp();

-- Update user_sessions last_active_at
CREATE OR REPLACE FUNCTION update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

DROP TRIGGER IF EXISTS update_session_last_active ON public.user_sessions;
CREATE TRIGGER update_session_last_active
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_last_active();

-- ============================================
-- GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mfa_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mfa_challenges TO authenticated;

-- Service role can manage all
GRANT ALL ON public.mfa_attempts TO service_role;
GRANT ALL ON public.user_sessions TO service_role;
GRANT ALL ON public.mfa_challenges TO service_role;

-- ============================================
-- SEED DEFAULT MFA SETTINGS FOR EXISTING USERS
-- ============================================
INSERT INTO public.mfa_settings (user_id, enforcement_level)
SELECT id, 'optional'
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.mfa_settings WHERE user_id = auth.users.id
);

COMMENT ON TABLE public.mfa_settings IS 'MFA configuration per user - supports WebAuthn, TOTP, and Email OTP';
COMMENT ON TABLE public.user_sessions IS 'Active device sessions with MFA and trust status';
COMMENT ON TABLE public.mfa_challenges IS 'Pending MFA verification challenges with expiration';
