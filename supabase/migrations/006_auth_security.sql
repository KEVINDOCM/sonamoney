-- ============================================
-- 006: AUTH SECURITY
-- Account lockout, failed attempts tracking
-- ============================================

create table if not exists public.auth_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_address text not null,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

alter table public.auth_attempts enable row level security;

-- Only service role can read/write auth_attempts
-- No user-level policies — this is admin only

create index idx_auth_attempts_email on public.auth_attempts(email, attempted_at);
create index idx_auth_attempts_ip on public.auth_attempts(ip_address, attempted_at);

-- Auto cleanup old attempts after 24 hours
create or replace function cleanup_old_auth_attempts()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.auth_attempts
  where attempted_at < now() - interval '24 hours';
end;
$$;
