-- ============================================
-- 014: ATOMIC TRANSACTION OPERATIONS
-- CR-2026-001: Database-Level Atomicity for Financial State Changes
-- All transaction operations are now ACID-compliant via PostgreSQL functions
-- ============================================

begin;

-- ============================================
-- 1. ATOMIC TRANSACTION UPDATE WITH BALANCE ADJUSTMENT
-- Consolidates: UPDATE transaction + REVERT old balance + APPLY new balance
-- All operations happen in a single database transaction
-- ============================================
create or replace function public.atomic_update_transaction(
  p_transaction_id uuid,
  p_user_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_type text,
  p_date date,
  p_notes text,
  p_account_id uuid,
  p_currency text default 'IDR',
  p_exchange_rate_at_time numeric default 1,
  p_is_recurring boolean default false,
  p_recurring_interval integer default null,
  p_recurring_unit text default null,
  p_recurring_next_date date default null
)
returns jsonb
set search_path = ''
language plpgsql
as $$
declare
  v_old_record record;
  v_old_account_id uuid;
  v_old_amount numeric;
  v_old_type text;
  v_result jsonb;
begin
  -- Fetch existing transaction with row lock
  select id, account_id, amount, type
  into v_old_record
  from public.transactions
  where id = p_transaction_id
    and user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  end if;

  v_old_account_id := v_old_record.account_id;
  v_old_amount := v_old_record.amount;
  v_old_type := v_old_record.type;

  -- Revert old balance adjustment if there was an account
  if v_old_account_id is not null then
    update public.accounts
    set balance = balance + case
      when v_old_type = 'income' then -v_old_amount
      else v_old_amount
    end,
    updated_at = now()
    where id = v_old_account_id
      and user_id = p_user_id;
  end if;

  -- Update the transaction
  update public.transactions
  set category_id = p_category_id,
      amount = p_amount,
      type = p_type,
      date = p_date,
      notes = p_notes,
      account_id = p_account_id,
      currency = p_currency,
      exchange_rate_at_time = p_exchange_rate_at_time,
      is_recurring = p_is_recurring,
      recurring_interval = p_recurring_interval,
      recurring_unit = p_recurring_unit,
      recurring_next_date = p_recurring_next_date,
      updated_at = now()
  where id = p_transaction_id
    and user_id = p_user_id;

  -- Apply new balance adjustment if there's an account
  if p_account_id is not null then
    update public.accounts
    set balance = balance + case
      when p_type = 'income' then p_amount
      else -p_amount
    end,
    updated_at = now()
    where id = p_account_id
      and user_id = p_user_id;
  end if;

  return jsonb_build_object('success', true);

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- ============================================
-- 2. ATOMIC TRANSACTION CREATE WITH BALANCE ADJUSTMENT
-- Inserts transaction and updates account balance atomically
-- ============================================
create or replace function public.atomic_create_transaction(
  p_user_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_type text,
  p_date date,
  p_notes text,
  p_account_id uuid,
  p_currency text default 'IDR',
  p_exchange_rate_at_time numeric default 1,
  p_is_recurring boolean default false,
  p_recurring_interval integer default null,
  p_recurring_unit text default null,
  p_recurring_next_date date default null
)
returns jsonb
set search_path = ''
language plpgsql
as $$
declare
  v_transaction_id uuid;
  v_result jsonb;
begin
  -- Insert the transaction
  insert into public.transactions (
    user_id,
    category_id,
    amount,
    type,
    date,
    notes,
    account_id,
    currency,
    exchange_rate_at_time,
    is_recurring,
    recurring_interval,
    recurring_unit,
    recurring_next_date
  ) values (
    p_user_id,
    p_category_id,
    p_amount,
    p_type,
    p_date,
    p_notes,
    p_account_id,
    p_currency,
    p_exchange_rate_at_time,
    p_is_recurring,
    p_recurring_interval,
    p_recurring_unit,
    p_recurring_next_date
  )
  returning id into v_transaction_id;

  -- Update account balance if account specified
  if p_account_id is not null then
    update public.accounts
    set balance = balance + case
      when p_type = 'income' then p_amount
      else -p_amount
    end,
    updated_at = now()
    where id = p_account_id
      and user_id = p_user_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id
  );

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- ============================================
-- 3. ATOMIC TRANSACTION DELETE WITH BALANCE REVERT
-- Deletes transaction and reverts balance adjustment atomically
-- ============================================
create or replace function public.atomic_delete_transaction(
  p_transaction_id uuid,
  p_user_id uuid
)
returns jsonb
set search_path = ''
language plpgsql
as $$
declare
  v_old_record record;
  v_old_account_id uuid;
  v_old_amount numeric;
  v_old_type text;
begin
  -- Fetch existing transaction with row lock
  select id, account_id, amount, type
  into v_old_record
  from public.transactions
  where id = p_transaction_id
    and user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  end if;

  v_old_account_id := v_old_record.account_id;
  v_old_amount := v_old_record.amount;
  v_old_type := v_old_record.type;

  -- Delete the transaction
  delete from public.transactions
  where id = p_transaction_id
    and user_id = p_user_id;

  -- Revert balance if there was an account
  if v_old_account_id is not null then
    update public.accounts
    set balance = balance + case
      when v_old_type = 'income' then -v_old_amount
      else v_old_amount
    end,
    updated_at = now()
    where id = v_old_account_id
      and user_id = p_user_id;
  end if;

  return jsonb_build_object('success', true);

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- ============================================
-- 4. ATOMIC BALANCE ADJUSTMENT (REPLACES RPC)
-- Direct atomic increment without read-modify-write
-- ============================================
create or replace function public.atomic_balance_adjust(
  p_account_id uuid,
  p_user_id uuid,
  p_delta numeric
)
returns jsonb
set search_path = ''
language plpgsql
as $$
begin
  -- Atomic update using PostgreSQL row-level locking
  update public.accounts
  set balance = balance + p_delta,
      updated_at = now()
  where id = p_account_id
    and user_id = p_user_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Account not found'
    );
  end if;

  return jsonb_build_object('success', true);

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- ============================================
-- 5. ATOMIC RECURRING TRANSACTION LOGGING
-- Creates child transaction AND updates parent next_date atomically
-- ============================================
create or replace function public.atomic_log_recurring_transaction(
  p_parent_id uuid,
  p_user_id uuid
)
returns jsonb
set search_path = ''
language plpgsql
as $$
declare
  v_parent record;
  v_transaction_id uuid;
  v_next_date date;
  v_interval integer;
  v_unit text;
begin
  -- Fetch parent recurring transaction with lock
  select *
  into v_parent
  from public.transactions
  where id = p_parent_id
    and user_id = p_user_id
    and is_recurring = true
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Recurring transaction not found'
    );
  end if;

  -- Insert child transaction
  insert into public.transactions (
    user_id,
    category_id,
    type,
    amount,
    date,
    notes,
    account_id,
    is_recurring,
    recurring_parent_id,
    currency
  ) values (
    p_user_id,
    v_parent.category_id,
    v_parent.type,
    v_parent.amount,
    current_date,
    v_parent.notes,
    v_parent.account_id,
    false,
    p_parent_id,
    v_parent.currency
  )
  returning id into v_transaction_id;

  -- Update account balance if specified
  if v_parent.account_id is not null then
    update public.accounts
    set balance = balance + case
      when v_parent.type = 'income' then v_parent.amount
      else -v_parent.amount
    end,
    updated_at = now()
    where id = v_parent.account_id
      and user_id = p_user_id;
  end if;

  -- Calculate next date
  v_interval := coalesce(v_parent.recurring_interval, 1);
  v_unit := coalesce(v_parent.recurring_unit, 'month');

  v_next_date := case v_unit
    when 'day' then current_date + (v_interval || ' days')::interval
    when 'week' then current_date + (v_interval || ' weeks')::interval
    when 'month' then current_date + (v_interval || ' months')::interval
  end::date;

  -- Update parent with next date
  update public.transactions
  set recurring_next_date = v_next_date,
      updated_at = now()
  where id = p_parent_id
    and user_id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'next_date', v_next_date
  );

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- ============================================
-- 6. ATOMIC RECURRING SKIP
-- Updates next_date atomically for skipped occurrences
-- ============================================
create or replace function public.atomic_skip_recurring(
  p_parent_id uuid,
  p_user_id uuid
)
returns jsonb
set search_path = ''
language plpgsql
as $$
declare
  v_parent record;
  v_next_date date;
  v_base_date date;
  v_interval integer;
  v_unit text;
begin
  -- Fetch parent with lock
  select recurring_interval, recurring_unit, recurring_next_date
  into v_parent
  from public.transactions
  where id = p_parent_id
    and user_id = p_user_id
    and is_recurring = true
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Recurring transaction not found'
    );
  end if;

  v_interval := coalesce(v_parent.recurring_interval, 1);
  v_unit := coalesce(v_parent.recurring_unit, 'month');
  v_base_date := coalesce(v_parent.recurring_next_date, current_date);

  -- Calculate new next date
  v_next_date := case v_unit
    when 'day' then v_base_date + (v_interval || ' days')::interval
    when 'week' then v_base_date + (v_interval || ' weeks')::interval
    when 'month' then v_base_date + (v_interval || ' months')::interval
  end::date;

  -- Update parent
  update public.transactions
  set recurring_next_date = v_next_date,
      updated_at = now()
  where id = p_parent_id
    and user_id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'next_date', v_next_date
  );

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- ============================================
-- 7. ATOMIC RECURRING STOP
-- Disables recurring flag atomically
-- ============================================
create or replace function public.atomic_stop_recurring(
  p_parent_id uuid,
  p_user_id uuid
)
returns jsonb
set search_path = ''
language plpgsql
as $$
begin
  update public.transactions
  set is_recurring = false,
      recurring_next_date = null,
      updated_at = now()
  where id = p_parent_id
    and user_id = p_user_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  end if;

  return jsonb_build_object('success', true);

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- ============================================
-- 8. SECURITY: Restrict function execution to authenticated users
-- ============================================

-- Grant execute permissions (will be controlled via RLS on underlying tables)
grant execute on function public.atomic_update_transaction to authenticated;
grant execute on function public.atomic_create_transaction to authenticated;
grant execute on function public.atomic_delete_transaction to authenticated;
grant execute on function public.atomic_balance_adjust to authenticated;
grant execute on function public.atomic_log_recurring_transaction to authenticated;
grant execute on function public.atomic_skip_recurring to authenticated;
grant execute on function public.atomic_stop_recurring to authenticated;

-- Revoke from anon
revoke execute on function public.atomic_update_transaction from anon;
revoke execute on function public.atomic_create_transaction from anon;
revoke execute on function public.atomic_delete_transaction from anon;
revoke execute on function public.atomic_balance_adjust from anon;
revoke execute on function public.atomic_log_recurring_transaction from anon;
revoke execute on function public.atomic_skip_recurring from anon;
revoke execute on function public.atomic_stop_recurring from anon;

commit;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
