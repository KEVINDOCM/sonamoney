-- Create settings table
create extension if not exists "pgcrypto";

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  currency text not null default 'IDR',
  language text not null default 'id',
  theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.settings enable row level security;

-- RLS policies
create policy "Users can view own settings" on public.settings
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings" on public.settings
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings" on public.settings
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own settings" on public.settings
  for delete
  using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists idx_settings_user_id on public.settings(user_id);

-- Trigger to automatically update updated_at with fixed search_path (security fix)
create or replace function public.update_updated_at_column()
returns trigger
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_settings_updated_at
  before update on public.settings
  for each row
  execute function public.update_updated_at_column();
