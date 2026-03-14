-- Create categories table
create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  budget_limit numeric,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.categories enable row level security;

-- RLS policies
create policy "Users can view own data" on public.categories
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own data" on public.categories
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data" on public.categories
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own data" on public.categories
  for delete
  using (auth.uid() = user_id);

