-- ============================================
-- 007: AUDIT LOG
-- Security event tracking for finance app
-- Retention: 90 days
-- Users cannot read/delete their own logs
-- ============================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  event_status text not null check (event_status in ('success', 'failure', 'blocked')),
  ip_address text,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS enabled but NO user-level read policies
-- Only service role can read audit logs
alter table public.audit_log enable row level security;

-- Users can only insert their own audit events (via service role in practice)
-- No SELECT policy — users cannot read audit logs
-- No DELETE policy — immutable logs

create index idx_audit_log_user_id on public.audit_log(user_id, created_at);
create index idx_audit_log_event_type on public.audit_log(event_type, created_at);
create index idx_audit_log_ip on public.audit_log(ip_address, created_at);
create index idx_audit_log_created_at on public.audit_log(created_at);

-- Auto cleanup logs older than 90 days
create or replace function cleanup_old_audit_logs()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.audit_log
  where created_at < now() - interval '90 days';
end;
$$;

-- Event types reference:
-- auth.login.success
-- auth.login.failure
-- auth.login.locked
-- auth.register.success
-- auth.register.failure
-- auth.logout
-- auth.password_reset.requested
-- account.deleted
-- data.export
-- scan.receipt.success
-- scan.receipt.failure
-- security.rate_limit_hit
