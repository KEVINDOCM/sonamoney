-- Create transactions table
create extension if not exists "pgcrypto";

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.transactions enable row level security;

-- RLS policies
create policy "Users can view own data" on public.transactions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own data" on public.transactions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data" on public.transactions
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own data" on public.transactions
  for delete
  using (auth.uid() = user_id);

