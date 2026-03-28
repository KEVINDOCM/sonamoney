-- ============================================
-- 007: ATOMIC OPERATIONS
-- ACID-compliant financial operations with idempotency
-- Prevents race conditions and duplicate transactions
-- ============================================

-- ============================================
-- ATOMIC TRANSACTION CREATE (with idempotency)
-- ============================================
-- Drop all overloaded versions of all atomic functions dynamically
DO $$
DECLARE
    r RECORD;
    func_names TEXT[] := ARRAY[
        'atomic_create_transaction',
        'atomic_update_transaction', 
        'atomic_delete_transaction',
        'atomic_log_recurring_transaction',
        'atomic_skip_recurring',
        'atomic_stop_recurring'
    ];
    func_name TEXT;
BEGIN
    FOREACH func_name IN ARRAY func_names LOOP
        FOR r IN 
            SELECT oid::regprocedure as func
            FROM pg_proc 
            WHERE proname = func_name
            AND pronamespace = 'public'::regnamespace
        LOOP
            EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func || ' CASCADE';
        END LOOP;
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.atomic_create_transaction(
    p_user_id UUID,
    p_category_id UUID,
    p_amount NUMERIC,
    p_type TEXT,
    p_date DATE,
    p_notes TEXT DEFAULT NULL,
    p_account_id UUID DEFAULT NULL,
    p_currency TEXT DEFAULT 'IDR',
    p_exchange_rate_at_time NUMERIC DEFAULT 1,
    p_is_recurring BOOLEAN DEFAULT FALSE,
    p_recurring_interval INTEGER DEFAULT NULL,
    p_recurring_unit TEXT DEFAULT NULL,
    p_recurring_next_date DATE DEFAULT NULL,
    p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_transaction_id UUID;
    v_existing_id UUID;
    v_new_balance NUMERIC;
BEGIN
    -- IDEMPOTENCY CHECK
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_id
        FROM public.transactions
        WHERE idempotency_key = p_idempotency_key
          AND user_id = p_user_id;
        
        IF v_existing_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', TRUE,
                'transaction_id', v_existing_id,
                'idempotent', TRUE,
                'message', 'Transaction already exists'
            );
        END IF;
    END IF;
    
    -- Insert transaction
    INSERT INTO public.transactions (
        user_id, category_id, amount, type, date, notes,
        account_id, currency, exchange_rate_at_time,
        is_recurring, recurring_interval, recurring_unit, recurring_next_date,
        idempotency_key
    ) VALUES (
        p_user_id, p_category_id, p_amount, p_type, p_date, p_notes,
        p_account_id, p_currency, p_exchange_rate_at_time,
        p_is_recurring, p_recurring_interval, p_recurring_unit, p_recurring_next_date,
        p_idempotency_key
    )
    RETURNING id INTO v_transaction_id;
    
    -- Update account balance if specified
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + CASE 
            WHEN p_type = 'income' THEN p_amount
            ELSE -p_amount
        END,
        updated_at = NOW()
        WHERE id = p_account_id
          AND user_id = p_user_id
        RETURNING balance INTO v_new_balance;
    END IF;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', v_transaction_id,
        'idempotent', FALSE,
        'new_balance', v_new_balance
    );
    
EXCEPTION 
    WHEN unique_violation THEN
        -- Handle race condition on idempotency key
        IF p_idempotency_key IS NOT NULL THEN
            SELECT id INTO v_existing_id
            FROM public.transactions
            WHERE idempotency_key = p_idempotency_key
              AND user_id = p_user_id;
            
            IF v_existing_id IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'success', TRUE,
                    'transaction_id', v_existing_id,
                    'idempotent', TRUE,
                    'message', 'Transaction created by concurrent request'
                );
            END IF;
        END IF;
        RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- ============================================
-- ATOMIC TRANSACTION UPDATE (with balance adjustment)
-- ============================================
CREATE OR REPLACE FUNCTION public.atomic_update_transaction(
    p_transaction_id UUID,
    p_user_id UUID,
    p_category_id UUID,
    p_amount NUMERIC,
    p_type TEXT,
    p_date DATE,
    p_notes TEXT DEFAULT NULL,
    p_account_id UUID DEFAULT NULL,
    p_currency TEXT DEFAULT 'IDR',
    p_exchange_rate_at_time NUMERIC DEFAULT 1,
    p_is_recurring BOOLEAN DEFAULT FALSE,
    p_recurring_interval INTEGER DEFAULT NULL,
    p_recurring_unit TEXT DEFAULT NULL,
    p_recurring_next_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old RECORD;
    v_new_balance NUMERIC;
BEGIN
    -- Fetch existing transaction with lock
    SELECT id, account_id, amount, type
    INTO v_old
    FROM public.transactions
    WHERE id = p_transaction_id
      AND user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Transaction not found');
    END IF;
    
    -- Revert old balance adjustment
    IF v_old.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + CASE 
            WHEN v_old.type = 'income' THEN -v_old.amount
            ELSE v_old.amount
        END,
        updated_at = NOW()
        WHERE id = v_old.account_id
          AND user_id = p_user_id;
    END IF;
    
    -- Update transaction
    UPDATE public.transactions
    SET category_id = p_category_id,
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
        updated_at = NOW()
    WHERE id = p_transaction_id
      AND user_id = p_user_id;
    
    -- Apply new balance adjustment
    IF p_account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + CASE 
            WHEN p_type = 'income' THEN p_amount
            ELSE -p_amount
        END,
        updated_at = NOW()
        WHERE id = p_account_id
          AND user_id = p_user_id
        RETURNING balance INTO v_new_balance;
    END IF;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', p_transaction_id,
        'new_balance', v_new_balance
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- ============================================
-- ATOMIC TRANSACTION DELETE (with balance revert)
-- ============================================
CREATE OR REPLACE FUNCTION public.atomic_delete_transaction(
    p_transaction_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old RECORD;
    v_new_balance NUMERIC;
BEGIN
    -- Fetch with lock
    SELECT id, account_id, amount, type
    INTO v_old
    FROM public.transactions
    WHERE id = p_transaction_id
      AND user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Transaction not found');
    END IF;
    
    -- Delete transaction
    DELETE FROM public.transactions
    WHERE id = p_transaction_id
      AND user_id = p_user_id;
    
    -- Revert balance
    IF v_old.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + CASE 
            WHEN v_old.type = 'income' THEN -v_old.amount
            ELSE v_old.amount
        END,
        updated_at = NOW()
        WHERE id = v_old.account_id
          AND user_id = p_user_id
        RETURNING balance INTO v_new_balance;
    END IF;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', p_transaction_id,
        'new_balance', v_new_balance
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- ============================================
-- ATOMIC RECURRING TRANSACTION LOGGING
-- ============================================
CREATE OR REPLACE FUNCTION public.atomic_log_recurring_transaction(
    p_parent_id UUID,
    p_user_id UUID,
    p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_parent RECORD;
    v_transaction_id UUID;
    v_existing_id UUID;
    v_next_date DATE;
    v_interval INTEGER;
    v_unit TEXT;
BEGIN
    -- IDEMPOTENCY CHECK
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_id
        FROM public.transactions
        WHERE idempotency_key = p_idempotency_key
          AND user_id = p_user_id;
        
        IF v_existing_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', TRUE,
                'transaction_id', v_existing_id,
                'idempotent', TRUE
            );
        END IF;
    END IF;
    
    -- Fetch parent with lock
    SELECT *
    INTO v_parent
    FROM public.transactions
    WHERE id = p_parent_id
      AND user_id = p_user_id
      AND is_recurring = TRUE
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Recurring transaction not found');
    END IF;
    
    -- Create child transaction
    INSERT INTO public.transactions (
        user_id, category_id, type, amount, date, notes,
        account_id, is_recurring, recurring_parent_id, currency, idempotency_key
    ) VALUES (
        p_user_id, v_parent.category_id, v_parent.type, v_parent.amount,
        CURRENT_DATE, v_parent.notes, v_parent.account_id, FALSE,
        p_parent_id, v_parent.currency, p_idempotency_key
    )
    RETURNING id INTO v_transaction_id;
    
    -- Update account balance
    IF v_parent.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + CASE 
            WHEN v_parent.type = 'income' THEN v_parent.amount
            ELSE -v_parent.amount
        END,
        updated_at = NOW()
        WHERE id = v_parent.account_id
          AND user_id = p_user_id;
    END IF;
    
    -- Calculate next date
    v_interval := COALESCE(v_parent.recurring_interval, 1);
    v_unit := COALESCE(v_parent.recurring_unit, 'month');
    
    v_next_date := CASE v_unit
        WHEN 'day' THEN CURRENT_DATE + (v_interval || ' days')::INTERVAL
        WHEN 'week' THEN CURRENT_DATE + (v_interval || ' weeks')::INTERVAL
        WHEN 'month' THEN CURRENT_DATE + (v_interval || ' months')::INTERVAL
        WHEN 'year' THEN CURRENT_DATE + (v_interval || ' years')::INTERVAL
    END::DATE;
    
    -- Update parent
    UPDATE public.transactions
    SET recurring_next_date = v_next_date,
        updated_at = NOW()
    WHERE id = p_parent_id
      AND user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', v_transaction_id,
        'next_date', v_next_date,
        'idempotent', FALSE
    );
    
EXCEPTION 
    WHEN unique_violation THEN
        IF p_idempotency_key IS NOT NULL THEN
            SELECT id INTO v_existing_id
            FROM public.transactions
            WHERE idempotency_key = p_idempotency_key
              AND user_id = p_user_id;
            
            IF v_existing_id IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'success', TRUE,
                    'transaction_id', v_existing_id,
                    'idempotent', TRUE
                );
            END IF;
        END IF;
        RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- ============================================
-- ATOMIC RECURRING SKIP
-- ============================================
CREATE OR REPLACE FUNCTION public.atomic_skip_recurring(
    p_parent_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_parent RECORD;
    v_next_date DATE;
    v_base_date DATE;
    v_interval INTEGER;
    v_unit TEXT;
BEGIN
    SELECT recurring_interval, recurring_unit, recurring_next_date
    INTO v_parent
    FROM public.transactions
    WHERE id = p_parent_id
      AND user_id = p_user_id
      AND is_recurring = TRUE
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Recurring transaction not found');
    END IF;
    
    v_interval := COALESCE(v_parent.recurring_interval, 1);
    v_unit := COALESCE(v_parent.recurring_unit, 'month');
    v_base_date := COALESCE(v_parent.recurring_next_date, CURRENT_DATE);
    
    v_next_date := CASE v_unit
        WHEN 'day' THEN v_base_date + (v_interval || ' days')::INTERVAL
        WHEN 'week' THEN v_base_date + (v_interval || ' weeks')::INTERVAL
        WHEN 'month' THEN v_base_date + (v_interval || ' months')::INTERVAL
        WHEN 'year' THEN v_base_date + (v_interval || ' years')::INTERVAL
    END::DATE;
    
    UPDATE public.transactions
    SET recurring_next_date = v_next_date,
        updated_at = NOW()
    WHERE id = p_parent_id
      AND user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'next_date', v_next_date,
        'skipped', TRUE
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- ============================================
-- ATOMIC RECURRING STOP
-- ============================================
CREATE OR REPLACE FUNCTION public.atomic_stop_recurring(
    p_parent_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.transactions
    SET is_recurring = FALSE,
        recurring_next_date = NULL,
        updated_at = NOW()
    WHERE id = p_parent_id
      AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Transaction not found');
    END IF;
    
    RETURN jsonb_build_object('success', TRUE, 'stopped', TRUE);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- ============================================
-- IDEMPOTENCY KEY CLEANUP
-- ============================================
DROP FUNCTION IF EXISTS public.cleanup_old_idempotency_keys();

CREATE OR REPLACE FUNCTION public.cleanup_old_idempotency_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cleared INTEGER;
BEGIN
    -- Clear idempotency keys older than 7 days
    UPDATE public.transactions
    SET idempotency_key = NULL
    WHERE idempotency_key IS NOT NULL
      AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS v_cleared = ROW_COUNT;
    
    RAISE NOTICE 'Cleared % old idempotency keys', v_cleared;
    RETURN v_cleared;
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.atomic_create_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_update_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_delete_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_log_recurring_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_skip_recurring TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_stop_recurring TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_idempotency_keys TO service_role;

REVOKE EXECUTE ON FUNCTION public.atomic_create_transaction FROM anon;
REVOKE EXECUTE ON FUNCTION public.atomic_update_transaction FROM anon;
REVOKE EXECUTE ON FUNCTION public.atomic_delete_transaction FROM anon;
REVOKE EXECUTE ON FUNCTION public.atomic_log_recurring_transaction FROM anon;
REVOKE EXECUTE ON FUNCTION public.atomic_skip_recurring FROM anon;
REVOKE EXECUTE ON FUNCTION public.atomic_stop_recurring FROM anon;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
