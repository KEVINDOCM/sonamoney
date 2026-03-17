-- Create accounts table
create extension if not exists "pgcrypto";

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

-- Enable Row Level Security
alter table public.accounts enable row level security;

-- RLS policies
create policy "Users can view own accounts" on public.accounts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts" on public.accounts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts" on public.accounts
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own accounts" on public.accounts
  for delete
  using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists idx_accounts_user_id on public.accounts(user_id);
