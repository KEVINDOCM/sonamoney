-- ============================================
-- 008: DISTRIBUTED RATE LIMITING
-- Redis fallback tables for rate limit persistence
-- Used when Redis is unavailable or for audit purposes
-- ============================================

-- Rate limit tracking (fallback when Redis unavailable)
create table if not exists public.rate_limit_entries (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  endpoint_type text not null check (endpoint_type in ('general', 'auth', 'sensitive')),
  request_count int not null default 0,
  window_start timestamptz not null default now(),
  window_duration_ms int not null,
  max_requests int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- IP blocking for failed attempts
create table if not exists public.ip_blocks (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null unique,
  reason text not null,
  failed_attempts int not null default 0,
  first_attempt_at timestamptz not null default now(),
  blocked_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Rate limit audit log
create table if not exists public.rate_limit_violations (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  endpoint text not null,
  violation_type text not null check (violation_type in ('rate_limit', 'ip_blocked')),
  user_agent text,
  timestamp timestamptz not null default now()
);

-- Enable RLS
alter table public.rate_limit_entries enable row level security;
alter table public.ip_blocks enable row level security;
alter table public.rate_limit_violations enable row level security;

-- Indexes for performance
create index idx_rate_limit_ip_endpoint on public.rate_limit_entries(ip_address, endpoint_type, window_start);
create index idx_rate_limit_window on public.rate_limit_entries(window_start);
create index idx_ip_blocks_address on public.ip_blocks(ip_address);
create index idx_ip_blocks_expires on public.ip_blocks(expires_at);
create index idx_violations_ip on public.rate_limit_violations(ip_address, timestamp);
create index idx_violations_timestamp on public.rate_limit_violations(timestamp desc);

-- Cleanup functions

create or replace function cleanup_expired_rate_limits()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.rate_limit_entries
  where window_start < now() - interval '1 hour';
end;
$$;

create or replace function cleanup_expired_ip_blocks()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.ip_blocks
  where expires_at < now();
end;
$$;

create or replace function cleanup_old_violations()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.rate_limit_violations
  where timestamp < now() - interval '30 days';
end;
$$;

-- No user policies - these tables are system-only
-- Access should be via service role or secure server functions
