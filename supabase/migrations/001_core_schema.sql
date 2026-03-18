-- ============================================
-- 001: CORE SCHEMA
-- All main tables: accounts, categories, transactions, transfers, settings, goals
-- ============================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================
-- ACCOUNTS TABLE
-- ============================================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('reguler', 'tabungan', 'utang')),
  icon text,
  currency text not null default 'IDR',
  balance numeric not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

-- Performance-optimized RLS policies (using subquery for auth.uid())
create policy "Users can view own accounts" on public.accounts
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own accounts" on public.accounts
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own accounts" on public.accounts
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own accounts" on public.accounts
  for delete using ((select auth.uid()) = user_id);

create index idx_accounts_user_id on public.accounts(user_id);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  budget_limit numeric,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users can view own categories" on public.categories
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own categories" on public.categories
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own categories" on public.categories
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own categories" on public.categories
  for delete using ((select auth.uid()) = user_id);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  date date not null,
  notes text,
  -- Recurring fields
  is_recurring boolean default false,
  recurring_interval integer,
  recurring_unit text check (recurring_unit in ('day', 'week', 'month')),
  recurring_next_date date,
  recurring_parent_id uuid references public.transactions (id) on delete set null,
  -- Tax and commission
  tax_rate numeric default 0,
  commission_rate numeric default 0,
  -- Multi-currency
  currency text default 'IDR',
  exchange_rate_at_time numeric default 1,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions" on public.transactions
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own transactions" on public.transactions
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own transactions" on public.transactions
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own transactions" on public.transactions
  for delete using ((select auth.uid()) = user_id);

-- Indexes for transactions
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_account_id on public.transactions(account_id);
create index idx_transactions_category_id on public.transactions(category_id);
create index idx_transactions_date on public.transactions(date);
create index idx_transactions_is_recurring on public.transactions(is_recurring) where is_recurring = true;
create index idx_transactions_recurring_next_date on public.transactions(recurring_next_date) where is_recurring = true;

-- ============================================
-- TRANSFERS TABLE
-- ============================================
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.accounts (id) on delete cascade,
  to_account_id uuid not null references public.accounts (id) on delete cascade,
  amount numeric not null,
  from_currency text default 'IDR',
  to_currency text default 'IDR',
  exchange_rate numeric default 1,
  converted_amount numeric,
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.transfers enable row level security;

create policy "Users can view own transfers" on public.transfers
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own transfers" on public.transfers
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own transfers" on public.transfers
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own transfers" on public.transfers
  for delete using ((select auth.uid()) = user_id);

-- Indexes for transfers
create index idx_transfers_user_id on public.transfers(user_id);
create index idx_transfers_from_account_id on public.transfers(from_account_id);
create index idx_transfers_to_account_id on public.transfers(to_account_id);
create index idx_transfers_date on public.transfers(date);

-- ============================================
-- SETTINGS TABLE
-- ============================================
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  currency text not null default 'IDR',
  language text not null default 'id',
  theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "Users can view own settings" on public.settings
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own settings" on public.settings
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own settings" on public.settings
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own settings" on public.settings
  for delete using ((select auth.uid()) = user_id);

create index idx_settings_user_id on public.settings(user_id);

-- ============================================
-- GOALS TABLE
-- ============================================
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(15,2) not null default 0,
  current_amount numeric(15,2) not null default 0,
  currency text not null default 'IDR',
  deadline date,
  icon text default '🎯',
  color text default '#00B9A7',
  is_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.goals enable row level security;

create policy "Users can view own goals" on public.goals
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own goals" on public.goals
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own goals" on public.goals
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own goals" on public.goals
  for delete using ((select auth.uid()) = user_id);

create index idx_goals_user_id on public.goals(user_id);
