-- ============================================
-- 015: MULTI-FACTOR AUTHENTICATION (MFA) SUPPORT
-- CR-2026-002: PCI DSS 4.0 Compliance - WebAuthn/FIDO2 Implementation
-- ============================================

begin;

-- ============================================
-- 1. MFA SETTINGS TABLE
-- Per-user MFA configuration and preferences
-- ============================================
create table if not exists public.mfa_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- MFA Methods enabled
  webauthn_enabled boolean not null default false,
  totp_enabled boolean not null default false,
  
  -- MFA enforcement level
  -- 'optional' - user can choose to enable
  -- 'required' - MFA is mandatory for this user
  -- 'admin_bypass' - admin can bypass MFA (emergency access)
  enforcement_level text not null default 'optional' 
    check (enforcement_level in ('optional', 'required', 'admin_bypass')),
  
  -- MFA preferences
  preferred_method text default null 
    check (preferred_method in ('webauthn', 'totp', null)),
  
  -- Recovery codes (hashed, one-time use)
  recovery_codes_hash text[] default array[]::text[],
  recovery_codes_used boolean[] default array[]::boolean[],
  
  -- MFA device metadata (for WebAuthn)
  device_count integer not null default 0,
  last_mfa_verified_at timestamptz,
  
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.mfa_settings enable row level security;

-- RLS Policies
-- Users can only see/modify their own MFA settings
-- Note: Service role bypasses RLS automatically, no separate policy needed
create policy "Users can view own MFA settings" on public.mfa_settings
  for select using ((select auth.uid()) = user_id);

-- Users can only update their own settings (not create/delete - managed by triggers)
create policy "Users can update own MFA settings" on public.mfa_settings
  for update using ((select auth.uid()) = user_id);

-- Indexes
-- Note: credential_id has unique constraint which creates index automatically
create unique index idx_mfa_settings_user_id on public.mfa_settings(user_id);
create index idx_mfa_settings_webauthn on public.mfa_settings(webauthn_enabled) where webauthn_enabled = true;
create index idx_mfa_settings_totp on public.mfa_settings(totp_enabled) where totp_enabled = true;

-- Updated at trigger
create trigger update_mfa_settings_updated_at
  before update on public.mfa_settings
  for each row
  execute function public.update_updated_at_column();

-- ============================================
-- 2. WEBAUTHN CREDENTIALS TABLE
-- FIDO2/WebAuthn authenticator storage
-- ============================================
create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- WebAuthn credential data
  credential_id text not null unique,  -- Base64URL encoded credential ID
  public_key bytea not null,           -- COSE key format
  sign_count integer not null default 0, -- Replay attack prevention
  
  -- Device metadata
  device_name text not null default 'Security Key',  -- User-friendly name
  device_type text check (device_type in ('platform', 'cross-platform')), 
  aaguid uuid,                          -- Authenticator model identifier
  
  -- Attestation info (for security auditing)
  attestation_object bytea,
  attestation_format text,
  
  -- Trust settings
  is_backup boolean not null default false,  -- Is this a backup credential?
  is_active boolean not null default true,   -- Can be disabled if lost/stolen
  
  -- Verification metadata
  last_used_at timestamptz,
  last_verified_at timestamptz not null default now(),
  registered_at timestamptz not null default now(),
  
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.webauthn_credentials enable row level security;

-- RLS Policies
-- Users can only see their own credentials
-- Note: Service role bypasses RLS automatically, no separate policy needed
create policy "Users can view own WebAuthn credentials" on public.webauthn_credentials
  for select using ((select auth.uid()) = user_id);

-- Users can delete their own credentials (e.g., lost device)
create policy "Users can delete own WebAuthn credentials" on public.webauthn_credentials
  for delete using ((select auth.uid()) = user_id);

-- Indexes
-- Note: credential_id has unique constraint which creates index automatically, no need for explicit index
create index idx_webauthn_creds_user_id on public.webauthn_credentials(user_id);
create index idx_webauthn_creds_active on public.webauthn_credentials(user_id, is_active) where is_active = true;

-- Updated at trigger
create trigger update_webauthn_creds_updated_at
  before update on public.webauthn_credentials
  for each row
  execute function public.update_updated_at_column();

-- ============================================
-- 3. MFA VERIFICATION SESSIONS
-- Temporary MFA verification state during login
-- ============================================
create table if not exists public.mfa_verification_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Session state
  session_token_hash text not null unique,  -- Hashed session identifier
  challenge text not null,                  -- WebAuthn/TOTP challenge
  
  -- Verification metadata
  method text not null check (method in ('webauthn', 'totp', 'recovery_code')),
  verified boolean not null default false,
  verified_at timestamptz,
  
  -- Expiration (10 minutes max)
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  
  -- Device context (for security logging)
  ip_address inet,
  user_agent text,
  
  -- Metadata
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.mfa_verification_sessions enable row level security;

-- RLS - No direct user access, managed by server functions
-- Note: Service role bypasses RLS automatically
create policy "Service role can manage MFA sessions" on public.mfa_verification_sessions
  for all using (true)
  with check (true);

-- Indexes
create index idx_mfa_sessions_user_id on public.mfa_verification_sessions(user_id);
create index idx_mfa_sessions_token on public.mfa_verification_sessions(session_token_hash);
create index idx_mfa_sessions_expires on public.mfa_verification_sessions(expires_at);

-- Cleanup function for expired sessions
create or replace function cleanup_expired_mfa_sessions()
returns void
set search_path = ''
language plpgsql
security definer
as $$
begin
  delete from public.mfa_verification_sessions
  where expires_at < now();
end;
$$;

-- ============================================
-- 4. MFA AUDIT LOG
-- Complete audit trail of all MFA events
-- ============================================
create table if not exists public.mfa_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Event details
  event_type text not null check (event_type in (
    'mfa_enabled', 'mfa_disabled', 'mfa_verified', 'mfa_failed',
    'webauthn_registered', 'webauthn_removed', 'webauthn_used',
    'totp_enabled', 'totp_disabled', 'totp_used',
    'recovery_code_used', 'recovery_codes_regenerated',
    'mfa_required_blocked'
  )),
  method text check (method in ('webauthn', 'totp', 'recovery_code')),
  
  -- Success/failure details
  success boolean not null,
  failure_reason text,
  
  -- Device context
  ip_address inet,
  user_agent text,
  credential_id uuid references public.webauthn_credentials(id),
  
  -- Metadata
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.mfa_audit_log enable row level security;

-- RLS - Users can only see their own audit entries
-- Note: Service role bypasses RLS automatically, no separate policy needed
create policy "Users can view own MFA audit" on public.mfa_audit_log
  for select using ((select auth.uid()) = user_id);

-- Indexes
create index idx_mfa_audit_user_id on public.mfa_audit_log(user_id, created_at desc);
create index idx_mfa_audit_event on public.mfa_audit_log(event_type, created_at desc);
create index idx_mfa_audit_success on public.mfa_audit_log(user_id, success) where success = false;

-- Cleanup function for old MFA audit entries (1 year retention)
create or replace function cleanup_old_mfa_audit()
returns void
set search_path = ''
language plpgsql
security definer
as $$
begin
  delete from public.mfa_audit_log
  where created_at < now() - interval '1 year';
end;
$$;

-- ============================================
-- 5. AUTO-CREATE MFA SETTINGS ON USER CREATION
-- ============================================
create or replace function public.handle_new_user_mfa()
returns trigger
set search_path = ''
language plpgsql
security definer
as $$
begin
  insert into public.mfa_settings (user_id)
  values (new.id);
  return new;
end;
$$;

-- Trigger on auth.users
-- Note: This requires the trigger to be created in the auth schema context
-- which typically requires Supabase Dashboard or service_role access.
-- Alternative: Application-level creation on first MFA check.

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Check if user has MFA enabled
create or replace function public.user_has_mfa_enabled(p_user_id uuid)
returns boolean
set search_path = ''
language plpgsql
security definer
as $$
declare
  v_enabled boolean;
begin
  select (webauthn_enabled or totp_enabled)
  into v_enabled
  from public.mfa_settings
  where user_id = p_user_id;
  
  return coalesce(v_enabled, false);
end;
$$;

-- Get user's active WebAuthn credentials
create or replace function public.get_active_webauthn_credentials(p_user_id uuid)
returns table (
  credential_id text,
  public_key bytea,
  sign_count integer,
  device_name text
)
set search_path = ''
language plpgsql
security definer
as $$
begin
  return query
  select wc.credential_id, wc.public_key, wc.sign_count, wc.device_name
  from public.webauthn_credentials wc
  where wc.user_id = p_user_id
    and wc.is_active = true
  order by wc.last_used_at desc nulls last;
end;
$$;

-- Log MFA event
create or replace function public.log_mfa_event(
  p_user_id uuid,
  p_event_type text,
  p_method text default null,
  p_success boolean default true,
  p_failure_reason text default null,
  p_ip_address inet default null,
  p_user_agent text default null,
  p_credential_id uuid default null
)
returns void
set search_path = ''
language plpgsql
security definer
as $$
begin
  insert into public.mfa_audit_log (
    user_id, event_type, method, success, failure_reason,
    ip_address, user_agent, credential_id
  ) values (
    p_user_id, p_event_type, p_method, p_success, p_failure_reason,
    p_ip_address, p_user_agent, p_credential_id
  );
end;
$$;

-- Update credential sign count (replay attack prevention)
create or replace function public.update_webauthn_sign_count(
  p_credential_id text,
  p_new_sign_count integer
)
returns boolean
set search_path = ''
language plpgsql
security definer
as $$
begin
  update public.webauthn_credentials
  set sign_count = p_new_sign_count,
      last_used_at = now()
  where credential_id = p_credential_id;
  
  return found;
end;
$$;

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

-- Grant necessary function permissions
grant execute on function public.user_has_mfa_enabled to authenticated;
grant execute on function public.user_has_mfa_enabled to anon;
grant execute on function public.get_active_webauthn_credentials to authenticated;
grant execute on function public.log_mfa_event to authenticated;
grant execute on function public.update_webauthn_sign_count to authenticated;

-- Revoke dangerous permissions from anon
revoke all on public.mfa_settings from anon;
revoke all on public.webauthn_credentials from anon;
revoke all on public.mfa_verification_sessions from anon;

commit;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
