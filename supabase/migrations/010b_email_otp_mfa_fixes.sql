-- ============================================
-- 010b: Email OTP MFA Fixes
-- Applies security fixes to existing 010 migration
-- ============================================

-- Fix 1: Add search_path to functions for security
-- Drop and recreate functions with explicit search_path

DROP FUNCTION IF EXISTS public.cleanup_old_mfa_attempts();
CREATE OR REPLACE FUNCTION cleanup_old_mfa_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM public.mfa_attempts WHERE attempt_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

DROP FUNCTION IF EXISTS public.cleanup_expired_mfa_challenges();
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_challenges()
RETURNS void AS $$
BEGIN
    DELETE FROM public.mfa_challenges WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

DROP FUNCTION IF EXISTS public.user_has_mfa_enabled(UUID);
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

DROP FUNCTION IF EXISTS public.count_active_sessions(UUID);
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

DROP FUNCTION IF EXISTS public.is_trusted_device(UUID, TEXT);
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

DROP FUNCTION IF EXISTS public.get_user_mfa_method(UUID);
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

-- Fix 2: Recreate trigger functions with search_path
DROP FUNCTION IF EXISTS update_mfa_settings_timestamp();
CREATE OR REPLACE FUNCTION update_mfa_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

DROP FUNCTION IF EXISTS update_session_last_active();
CREATE OR REPLACE FUNCTION update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Recreate triggers
DROP TRIGGER IF EXISTS update_mfa_settings_updated_at ON public.mfa_settings;
CREATE TRIGGER update_mfa_settings_updated_at
    BEFORE UPDATE ON public.mfa_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_mfa_settings_timestamp();

DROP TRIGGER IF EXISTS update_session_last_active ON public.user_sessions;
CREATE TRIGGER update_session_last_active
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_last_active();

-- Fix 3: Recreate index without partial predicate (NOW() is not immutable)
DROP INDEX IF EXISTS idx_mfa_attempts_ip;
CREATE INDEX idx_mfa_attempts_ip ON public.mfa_attempts(ip_address, attempt_at DESC);

COMMENT ON TABLE public.mfa_settings IS 'MFA configuration per user - supports WebAuthn, TOTP, and Email OTP (updated with security fixes)';
