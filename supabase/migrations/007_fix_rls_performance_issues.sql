-- Fix RLS policy performance issues and duplicate indexes
-- Run this after applying all previous migrations

-- ============================================
-- 1. Fix auth_rls_initplan: Wrap auth.uid() in subquery
-- ============================================

-- Drop and recreate policies for settings table
drop policy if exists "Users can view own settings" on public.settings;
drop policy if exists "Users can insert own settings" on public.settings;
drop policy if exists "Users can update own settings" on public.settings;
drop policy if exists "Users can delete own settings" on public.settings;

create policy "Users can view own settings" on public.settings
  for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own settings" on public.settings
  for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own settings" on public.settings
  for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own settings" on public.settings
  for delete
  using ((select auth.uid()) = user_id);

-- Drop and recreate policies for accounts table
drop policy if exists "Users can view own accounts" on public.accounts;
drop policy if exists "Users can insert own accounts" on public.accounts;
drop policy if exists "Users can update own accounts" on public.accounts;
drop policy if exists "Users can delete own accounts" on public.accounts;
drop policy if exists "Users can manage own accounts" on public.accounts;

create policy "Users can view own accounts" on public.accounts
  for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own accounts" on public.accounts
  for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own accounts" on public.accounts
  for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own accounts" on public.accounts
  for delete
  using ((select auth.uid()) = user_id);

-- Drop and recreate policies for transfers table
drop policy if exists "Users can view own transfers" on public.transfers;
drop policy if exists "Users can insert own transfers" on public.transfers;
drop policy if exists "Users can update own transfers" on public.transfers;
drop policy if exists "Users can delete own transfers" on public.transfers;
drop policy if exists "Users can manage own transfers" on public.transfers;

create policy "Users can view own transfers" on public.transfers
  for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own transfers" on public.transfers
  for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own transfers" on public.transfers
  for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own transfers" on public.transfers
  for delete
  using ((select auth.uid()) = user_id);

-- ============================================
-- 2. Fix duplicate indexes on transfers table
-- ============================================

drop index if exists idx_transfers_from_account;
drop index if exists idx_transfers_to_account;
-- Keep: idx_transfers_from_account_id, idx_transfers_to_account_id

-- ============================================
-- 3. Also fix existing tables (categories, transactions, goals)
-- ============================================

-- Fix categories policies
drop policy if exists "Users can view own data" on public.categories;
drop policy if exists "Users can insert own data" on public.categories;
drop policy if exists "Users can update own data" on public.categories;
drop policy if exists "Users can delete own data" on public.categories;

create policy "Users can view own categories" on public.categories
  for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own categories" on public.categories
  for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own categories" on public.categories
  for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own categories" on public.categories
  for delete
  using ((select auth.uid()) = user_id);

-- Fix transactions policies
drop policy if exists "Users can view own data" on public.transactions;
drop policy if exists "Users can insert own data" on public.transactions;
drop policy if exists "Users can update own data" on public.transactions;
drop policy if exists "Users can delete own data" on public.transactions;

create policy "Users can view own transactions" on public.transactions
  for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own transactions" on public.transactions
  for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own transactions" on public.transactions
  for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own transactions" on public.transactions
  for delete
  using ((select auth.uid()) = user_id);

-- Fix goals policies
drop policy if exists "Users can manage own goals" on public.goals;

create policy "Users can view own goals" on public.goals
  for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own goals" on public.goals
  for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own goals" on public.goals
  for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own goals" on public.goals
  for delete
  using ((select auth.uid()) = user_id);
