-- Create transfers table
create extension if not exists "pgcrypto";

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

-- Enable Row Level Security
alter table public.transfers enable row level security;

-- RLS policies
create policy "Users can view own transfers" on public.transfers
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own transfers" on public.transfers
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transfers" on public.transfers
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own transfers" on public.transfers
  for delete
  using (auth.uid() = user_id);

-- Indexes for faster queries
create index if not exists idx_transfers_user_id on public.transfers(user_id);
create index if not exists idx_transfers_from_account on public.transfers(from_account_id);
create index if not exists idx_transfers_to_account on public.transfers(to_account_id);
create index if not exists idx_transfers_date on public.transfers(date);
