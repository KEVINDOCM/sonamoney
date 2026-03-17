-- Add missing columns to transactions table
-- These columns are used for recurring transactions, multi-currency, and tax/commission

-- Account reference (for linking transactions to specific accounts)
alter table public.transactions 
add column if not exists account_id uuid references public.accounts (id) on delete set null;

-- Recurring transaction fields
alter table public.transactions 
add column if not exists is_recurring boolean default false;

alter table public.transactions 
add column if not exists recurring_interval integer;

alter table public.transactions 
add column if not exists recurring_unit text check (recurring_unit in ('day', 'week', 'month'));

alter table public.transactions 
add column if not exists recurring_next_date date;

alter table public.transactions 
add column if not exists recurring_parent_id uuid references public.transactions (id) on delete set null;

-- Tax and commission fields
alter table public.transactions 
add column if not exists tax_rate numeric default 0;

alter table public.transactions 
add column if not exists commission_rate numeric default 0;

-- Currency fields for multi-currency support
alter table public.transactions 
add column if not exists currency text default 'IDR';

alter table public.transactions 
add column if not exists exchange_rate_at_time numeric default 1;

-- Add index for recurring transactions query performance
create index if not exists idx_transactions_account_id on public.transactions(account_id);
create index if not exists idx_transactions_is_recurring on public.transactions(is_recurring) where is_recurring = true;
create index if not exists idx_transactions_recurring_next_date on public.transactions(recurring_next_date) where is_recurring = true;
create index if not exists idx_transactions_currency on public.transactions(currency);
