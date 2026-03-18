-- ============================================
-- 002: DEBT TRACKING SCHEMA
-- Debt management with interest tracking and payment history
-- ============================================

-- ============================================
-- DEBTS TABLE
-- ============================================
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('credit_card', 'loan', 'mortgage', 'other')),
  lender text,
  original_amount numeric not null default 0,
  current_balance numeric not null default 0,
  interest_rate numeric not null default 0,
  interest_type text not null default 'annual' check (interest_type in ('annual', 'monthly')),
  minimum_payment numeric,
  payment_due_date integer check (payment_due_date between 1 and 31),
  start_date date,
  end_date date,
  currency text not null default 'IDR',
  notes text,
  color text default '#EF4444',
  icon text default '💳',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.debts enable row level security;

create policy "Users can view own debts" on public.debts
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own debts" on public.debts
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own debts" on public.debts
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own debts" on public.debts
  for delete using ((select auth.uid()) = user_id);

create index idx_debts_user_id on public.debts(user_id);
create index idx_debts_type on public.debts(type);
create index idx_debts_is_active on public.debts(is_active);

-- ============================================
-- DEBT PAYMENTS TABLE
-- ============================================
create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  interest_paid numeric default 0,
  principal_paid numeric default 0,
  payment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.debt_payments enable row level security;

create policy "Users can view own debt payments" on public.debt_payments
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own debt payments" on public.debt_payments
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own debt payments" on public.debt_payments
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own debt payments" on public.debt_payments
  for delete using ((select auth.uid()) = user_id);

create index idx_debt_payments_debt_id on public.debt_payments(debt_id);
create index idx_debt_payments_user_id on public.debt_payments(user_id);
create index idx_debt_payments_payment_date on public.debt_payments(payment_date);
