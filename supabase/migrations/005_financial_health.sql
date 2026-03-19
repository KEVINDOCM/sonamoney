-- ============================================
-- 005: FINANCIAL HEALTH SCORE
-- Stores score history, streaks, badges
-- ============================================

create table if not exists public.financial_health (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  level text not null,
  savings_score integer not null default 0,
  budget_score integer not null default 0,
  consistency_score integer not null default 0,
  activity_score integer not null default 0,
  streak_days integer not null default 0,
  period_month text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, period_month)
);

alter table public.financial_health enable row level security;

create policy "Users can view own health scores" on public.financial_health
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own health scores" on public.financial_health
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own health scores" on public.financial_health
  for update using ((select auth.uid()) = user_id);

create index idx_financial_health_user_id on public.financial_health(user_id);
create index idx_financial_health_period on public.financial_health(user_id, period_month);

-- Badges table
create table if not exists public.health_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  badge_name text not null,
  badge_icon text not null,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_key)
);

alter table public.health_badges enable row level security;

create policy "Users can view own badges" on public.health_badges
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own badges" on public.health_badges
  for insert with check ((select auth.uid()) = user_id);

create index idx_health_badges_user_id on public.health_badges(user_id);
