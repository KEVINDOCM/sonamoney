-- ============================================
-- 016: IDEMPOTENCY IMPLEMENTATION
-- CR-2026-002: High-Scalability Idempotency for 1M+ Users
-- Prevents duplicate transactions during network retries/fast clicks
-- ============================================

begin;

-- ============================================
-- 1. ADD IDEMPOTENCY KEY COLUMN TO TRANSACTIONS
-- ============================================

-- Add idempotency_key column if not exists
alter table public.transactions
add column if not exists idempotency_key uuid null;

-- Add UNIQUE constraint on idempotency_key
-- Note: NULL values don't violate UNIQUE constraints, only duplicates
alter table public.transactions
add constraint unique_idempotency_key unique (idempotency_key);

-- Add index for efficient cleanup of old keys
-- Partial index excludes NULL values for performance
create index if not exists idx_transactions_idempotency_key 
on public.transactions (idempotency_key) 
where idempotency_key is not null;

-- Add index on created_at for periodic cleanup
create index if not exists idx_transactions_created_at_cleanup 
on public.transactions (created_at) 
where idempotency_key is not null;

-- ============================================
-- 2. IDEMPOTENCY CLEANUP FUNCTION (pg_cron)
-- Removes idempotency keys older than 7 days to keep index small
-- ============================================

-- Create a function to clean up old idempotency keys
-- This helps keep the index small and queries fast

create or replace function public.cleanup_old_idempotency_keys()
returns void
language plpgsql
security definer
as $$
begin
  -- Clear idempotency keys older than 7 days
  -- This is safe because:
  -- 1. Network retries typically happen within seconds/minutes
  -- 2. 7 days is more than enough for any edge case
  update public.transactions
  set idempotency_key = null
  where idempotency_key is not null
    and created_at < now() - interval '7 days';
    
  -- Log the cleanup (will appear in Supabase logs)
  raise notice 'Idempotency keys cleanup completed at %', now();
end;
$$;

-- ============================================
-- 3. ATOMIC CREATE TRANSACTION (IDEMPOTENT VERSION)
-- Modified to accept and enforce idempotency key
-- ============================================

-- Drop old function first (signature changed with new parameter)
DROP FUNCTION IF EXISTS public.atomic_create_transaction(
  uuid, uuid, numeric, text, date, text, uuid, text, numeric, boolean, integer, text, date
);

-- Also drop any other overloaded versions
DROP FUNCTION IF EXISTS public.atomic_create_transaction(
  uuid, uuid, numeric, text, date, text, text, numeric, boolean, integer, text, date
);

create or replace function public.atomic_create_transaction(
  p_user_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_type text,
  p_date date,
  p_notes text,
  p_currency text default 'IDR',
  p_exchange_rate_at_time numeric default 1,
  p_is_recurring boolean default false,
  p_recurring_interval integer default null,
  p_recurring_unit text default null,
  p_recurring_next_date date default null,
  p_idempotency_key uuid default null
)
returns jsonb
set search_path = ''
language plpgsql
as $$
declare
  v_transaction_id uuid;
  v_existing_id uuid;
  v_result jsonb;
begin
  -- IDEMPOTENCY CHECK: If key provided, check for existing transaction
  if p_idempotency_key is not null then
    select id into v_existing_id
    from public.transactions
    where idempotency_key = p_idempotency_key
      and user_id = p_user_id;
    
    -- If found, return the existing transaction (idempotent success)
    if v_existing_id is not null then
      return jsonb_build_object(
        'success', true,
        'transaction_id', v_existing_id,
        'idempotent', true,
        'message', 'Transaction already exists'
      );
    end if;
  end if;

  -- Insert the transaction
  insert into public.transactions (
    user_id,
    category_id,
    amount,
    type,
    date,
    notes,
    currency,
    exchange_rate_at_time,
    is_recurring,
    recurring_interval,
    recurring_unit,
    recurring_next_date,
    idempotency_key
  ) values (
    p_user_id,
    p_category_id,
    p_amount,
    p_type,
    p_date,
    p_notes,
    p_currency,
    p_exchange_rate_at_time,
    p_is_recurring,
    p_recurring_interval,
    p_recurring_unit,
    p_recurring_next_date,
    p_idempotency_key
  )
  returning id into v_transaction_id;

  return jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'idempotent', false
  );

exception when others then
  -- Handle unique constraint violation (race condition)
  if sqlstate = '23505' and p_idempotency_key is not null then
    -- Try to return the existing transaction
    select id into v_existing_id
    from public.transactions
    where idempotency_key = p_idempotency_key
      and user_id = p_user_id;
    
    if v_existing_id is not null then
      return jsonb_build_object(
        'success', true,
        'transaction_id', v_existing_id,
        'idempotent', true,
        'message', 'Transaction created by concurrent request'
      );
    end if;
  end if;
  
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- ============================================
-- 4. ATOMIC RECURRING TRANSACTION LOGGING (IDEMPOTENT VERSION)
-- Uses parent_id + date as natural idempotency key
-- ============================================

-- Drop old version first
DROP FUNCTION IF EXISTS public.atomic_log_recurring_transaction(uuid, uuid);

create or replace function public.atomic_log_recurring_transaction(
  p_parent_id uuid,
  p_user_id uuid,
  p_idempotency_key uuid default null
)
returns jsonb
set search_path = ''
language plpgsql
as $$
declare
  v_parent record;
  v_transaction_id uuid;
  v_existing_id uuid;
  v_next_date date;
  v_interval integer;
  v_unit text;
begin
  -- IDEMPOTENCY CHECK: If key provided, check for existing transaction
  if p_idempotency_key is not null then
    select id into v_existing_id
    from public.transactions
    where idempotency_key = p_idempotency_key
      and user_id = p_user_id;
    
    if v_existing_id is not null then
      return jsonb_build_object(
        'success', true,
        'transaction_id', v_existing_id,
        'idempotent', true,
        'message', 'Recurring instance already logged'
      );
    end if;
  end if;

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
    is_recurring,
    recurring_parent_id,
    currency,
    idempotency_key
  ) values (
    p_user_id,
    v_parent.category_id,
    v_parent.type,
    v_parent.amount,
    current_date,
    v_parent.notes,
    false,
    p_parent_id,
    v_parent.currency,
    p_idempotency_key
  )
  returning id into v_transaction_id;

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
    'next_date', v_next_date,
    'idempotent', false
  );

exception when others then
  -- Handle unique constraint violation (race condition)
  if sqlstate = '23505' and p_idempotency_key is not null then
    select id into v_existing_id
    from public.transactions
    where idempotency_key = p_idempotency_key
      and user_id = p_user_id;
    
    if v_existing_id is not null then
      return jsonb_build_object(
        'success', true,
        'transaction_id', v_existing_id,
        'idempotent', true,
        'message', 'Recurring instance created by concurrent request'
      );
    end if;
  end if;
  
  return jsonb_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- ============================================
-- 5. SECURITY: Update permissions for new functions
-- ============================================

-- Grant execute permissions
grant execute on function public.atomic_create_transaction to authenticated;
grant execute on function public.atomic_log_recurring_transaction to authenticated;
grant execute on function public.cleanup_old_idempotency_keys to service_role;

-- Revoke from anon
revoke execute on function public.atomic_create_transaction from anon;
revoke execute on function public.atomic_log_recurring_transaction from anon;
revoke execute on function public.cleanup_old_idempotency_keys from anon;

-- ============================================
-- 6. ENABLE PG_CRON (if not already enabled)
-- This schedules the cleanup job
-- Note: Enable pg_cron extension in Supabase dashboard first
-- ============================================

-- Schedule daily cleanup at 3 AM UTC (low traffic time)
-- Note: Uncomment after enabling pg_cron extension
-- select cron.schedule(
--   'cleanup-idempotency-keys',
--   '0 3 * * *',  -- At 3:00 AM UTC daily
--   'select public.cleanup_old_idempotency_keys()'
-- );

commit;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
