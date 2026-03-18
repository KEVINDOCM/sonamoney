-- ============================================
-- 003: FUNCTIONS AND TRIGGERS
-- Utility functions for updated_at timestamps and transfer balance handling
-- ============================================

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
create or replace function public.update_updated_at_column()
returns trigger
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to settings table
create trigger update_settings_updated_at
  before update on public.settings
  for each row
  execute function public.update_updated_at_column();

-- Apply updated_at trigger to debts table
create trigger update_debts_updated_at
  before update on public.debts
  for each row
  execute function public.update_updated_at_column();

-- Apply updated_at trigger to goals table
create trigger update_goals_updated_at
  before update on public.goals
  for each row
  execute function public.update_updated_at_column();

-- ============================================
-- TRANSFER BALANCE HANDLER
-- Auto-calculates exchange rates and converted amounts
-- ============================================
create or replace function public.handle_transfer_balance()
returns trigger
set search_path = ''
as $$
declare
  v_from_currency text;
  v_to_currency text;
  v_exchange_rate numeric;
  v_converted_amount numeric;
begin
  -- Get account currencies
  select currency into v_from_currency 
  from public.accounts where id = new.from_account_id;
  
  select currency into v_to_currency 
  from public.accounts where id = new.to_account_id;
  
  -- Set exchange rate (default 1 for same currency)
  v_exchange_rate := case 
    when v_from_currency = v_to_currency then 1
    else coalesce(new.exchange_rate, 1)
  end;
  
  -- Calculate converted amount
  v_converted_amount := new.amount * v_exchange_rate;
  
  -- Update the transfer record with calculated values
  new.exchange_rate := v_exchange_rate;
  new.converted_amount := v_converted_amount;
  new.from_currency := v_from_currency;
  new.to_currency := v_to_currency;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-calculate transfer fields
create trigger set_transfer_calculated_fields
  before insert or update on public.transfers
  for each row
  execute function public.handle_transfer_balance();

-- ============================================
-- TRANSFER BALANCE PROCESSOR
-- Direct database function to adjust account balances on transfer
-- ============================================
create or replace function public.process_transfer_balances(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_exchange_rate numeric default 1
)
returns void
set search_path = ''
as $$
declare
  v_from_currency text;
  v_to_currency text;
  v_converted_amount numeric;
begin
  -- Get currencies
  select currency into v_from_currency from public.accounts where id = p_from_account_id;
  select currency into v_to_currency from public.accounts where id = p_to_account_id;
  
  -- Calculate converted amount
  v_converted_amount := p_amount * coalesce(p_exchange_rate, 1);
  
  -- Deduct from source account
  update public.accounts 
  set balance = balance - p_amount,
      updated_at = now()
  where id = p_from_account_id;
  
  -- Add to destination account (use converted amount if different currencies)
  update public.accounts 
  set balance = balance + case 
    when v_from_currency = v_to_currency then p_amount 
    else v_converted_amount 
  end,
      updated_at = now()
  where id = p_to_account_id;
end;
$$ language plpgsql;

-- ============================================
-- SCHEMA CACHE REFRESH
-- ============================================
notify pgrst, 'reload schema';
