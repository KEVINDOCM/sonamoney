-- ============================================
-- 003: FUNCTIONS & TRIGGERS
-- Core business logic functions and automation triggers
-- Optimized for high-throughput operations
-- ============================================

-- ============================================
-- TRANSFER HANDLING
-- ============================================

-- Trigger function: Auto-calculate exchange rates and converted amounts
CREATE OR REPLACE FUNCTION public.handle_transfer_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_from_currency TEXT;
    v_to_currency TEXT;
    v_exchange_rate NUMERIC;
    v_converted_amount NUMERIC;
BEGIN
    -- Get account currencies
    SELECT currency INTO v_from_currency 
    FROM public.accounts WHERE id = NEW.from_account_id;
    
    SELECT currency INTO v_to_currency 
    FROM public.accounts WHERE id = NEW.to_account_id;
    
    -- Set exchange rate (default 1 for same currency)
    v_exchange_rate := CASE 
        WHEN v_from_currency = v_to_currency THEN 1
        ELSE COALESCE(NEW.exchange_rate, 1)
    END;
    
    -- Calculate converted amount
    v_converted_amount := NEW.amount * v_exchange_rate;
    
    -- Update the transfer record with calculated values
    NEW.exchange_rate := v_exchange_rate;
    NEW.converted_amount := v_converted_amount;
    NEW.from_currency := v_from_currency;
    NEW.to_currency := v_to_currency;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_transfer_calculated_fields
    BEFORE INSERT OR UPDATE ON public.transfers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_transfer_balance();

-- Function: Process transfer and update account balances atomically
CREATE OR REPLACE FUNCTION public.process_transfer(
    p_from_account_id UUID,
    p_to_account_id UUID,
    p_amount NUMERIC,
    p_user_id UUID,
    p_exchange_rate NUMERIC DEFAULT 1,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_from_currency TEXT;
    v_to_currency TEXT;
    v_converted_amount NUMERIC;
    v_transfer_id UUID;
BEGIN
    -- Validate accounts belong to user
    IF NOT EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE id = p_from_account_id AND user_id = p_user_id
    ) OR NOT EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE id = p_to_account_id AND user_id = p_user_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid accounts');
    END IF;
    
    -- Get currencies
    SELECT currency INTO v_from_currency FROM public.accounts WHERE id = p_from_account_id;
    SELECT currency INTO v_to_currency FROM public.accounts WHERE id = p_to_account_id;
    
    -- Calculate converted amount
    v_converted_amount := p_amount * COALESCE(p_exchange_rate, 1);
    
    -- Create transfer record
    INSERT INTO public.transfers (
        user_id, from_account_id, to_account_id, amount,
        from_currency, to_currency, exchange_rate, converted_amount,
        date, notes
    ) VALUES (
        p_user_id, p_from_account_id, p_to_account_id, p_amount,
        v_from_currency, v_to_currency, p_exchange_rate, v_converted_amount,
        CURRENT_DATE, p_notes
    )
    RETURNING id INTO v_transfer_id;
    
    -- Deduct from source account
    UPDATE public.accounts 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = p_from_account_id
      AND user_id = p_user_id;
    
    -- Add to destination account
    UPDATE public.accounts 
    SET balance = balance + CASE 
        WHEN v_from_currency = v_to_currency THEN p_amount 
        ELSE v_converted_amount 
    END,
    updated_at = NOW()
    WHERE id = p_to_account_id
      AND user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'transfer_id', v_transfer_id,
        'converted_amount', v_converted_amount
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- BALANCE MANAGEMENT
-- ============================================

-- Function: Atomic balance adjustment (no read-modify-write race condition)
CREATE OR REPLACE FUNCTION public.atomic_balance_adjust(
    p_account_id UUID,
    p_user_id UUID,
    p_delta NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_balance NUMERIC;
BEGIN
    UPDATE public.accounts
    SET balance = balance + p_delta,
        updated_at = NOW()
    WHERE id = p_account_id
      AND user_id = p_user_id
    RETURNING balance INTO v_new_balance;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Account not found or access denied'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- RECURRING TRANSACTIONS
-- ============================================

-- Function: Get next occurrence date for recurring transaction
CREATE OR REPLACE FUNCTION public.calculate_next_recurring_date(
    p_base_date DATE,
    p_interval INTEGER,
    p_unit TEXT
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN CASE p_unit
        WHEN 'day' THEN p_base_date + (p_interval || ' days')::INTERVAL
        WHEN 'week' THEN p_base_date + (p_interval || ' weeks')::INTERVAL
        WHEN 'month' THEN p_base_date + (p_interval || ' months')::INTERVAL
        WHEN 'year' THEN p_base_date + (p_interval || ' years')::INTERVAL
        ELSE p_base_date + INTERVAL '1 month'
    END::DATE;
END;
$$;

-- ============================================
-- BUDGET CALCULATIONS
-- ============================================

-- Function: Calculate current period budget status
CREATE OR REPLACE FUNCTION public.get_budget_status(
    p_user_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_period_type TEXT DEFAULT 'monthly'
)
RETURNS TABLE (
    category_id UUID,
    budget_amount NUMERIC,
    spent_amount NUMERIC,
    remaining_amount NUMERIC,
    percentage_used NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Calculate period boundaries
    v_period_start := DATE_TRUNC(CASE p_period_type
        WHEN 'weekly' THEN 'week'
        WHEN 'monthly' THEN 'month'
        WHEN 'quarterly' THEN 'quarter'
        WHEN 'yearly' THEN 'year'
        ELSE 'month'
    END, CURRENT_DATE);
    
    v_period_end := CASE p_period_type
        WHEN 'weekly' THEN v_period_start + INTERVAL '1 week'
        WHEN 'monthly' THEN v_period_start + INTERVAL '1 month'
        WHEN 'quarterly' THEN v_period_start + INTERVAL '3 months'
        WHEN 'yearly' THEN v_period_start + INTERVAL '1 year'
        ELSE v_period_start + INTERVAL '1 month'
    END::DATE - INTERVAL '1 day';
    
    RETURN QUERY
    WITH budget_data AS (
        SELECT 
            c.id AS cat_id,
            c.budget_limit,
            COALESCE(SUM(t.amount), 0) AS spent
        FROM public.categories c
        LEFT JOIN public.transactions t ON 
            t.category_id = c.id 
            AND t.user_id = p_user_id
            AND t.type = 'expense'
            AND t.date BETWEEN v_period_start AND v_period_end
            AND NOT t.is_recurring
        WHERE c.user_id = p_user_id
          AND (p_category_id IS NULL OR c.id = p_category_id)
          AND c.type = 'expense'
        GROUP BY c.id, c.budget_limit
    )
    SELECT 
        bd.cat_id,
        bd.budget_limit,
        bd.spent,
        GREATEST(0, bd.budget_limit - bd.spent) AS remaining,
        CASE 
            WHEN bd.budget_limit > 0 THEN ROUND((bd.spent / bd.budget_limit * 100), 2)
            ELSE 0
        END AS pct_used,
        CASE 
            WHEN bd.budget_limit = 0 OR bd.budget_limit IS NULL THEN 'no_budget'
            WHEN bd.spent >= bd.budget_limit THEN 'exceeded'
            WHEN bd.spent >= bd.budget_limit * 0.9 THEN 'critical'
            WHEN bd.spent >= bd.budget_limit * 0.75 THEN 'warning'
            ELSE 'good'
        END AS budget_status
    FROM budget_data bd
    WHERE bd.budget_limit IS NOT NULL;
END;
$$;

-- ============================================
-- FINANCIAL CALCULATIONS
-- ============================================

-- Function: Calculate net worth for a user
CREATE OR REPLACE FUNCTION public.calculate_net_worth(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_assets NUMERIC;
    v_total_debts NUMERIC;
    v_net_worth NUMERIC;
BEGIN
    -- Sum all account balances (assets)
    SELECT COALESCE(SUM(balance), 0)
    INTO v_total_assets
    FROM public.accounts
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    -- Sum all debt balances (liabilities)
    SELECT COALESCE(SUM(current_balance), 0)
    INTO v_total_debts
    FROM public.debts
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    v_net_worth := v_total_assets - v_total_debts;
    
    RETURN jsonb_build_object(
        'total_assets', v_total_assets,
        'total_debts', v_total_debts,
        'net_worth', v_net_worth,
        'calculated_at', NOW()
    );
END;
$$;

-- Function: Calculate income vs expenses for a period
CREATE OR REPLACE FUNCTION public.get_period_summary(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_income NUMERIC;
    v_expenses NUMERIC;
    v_transaction_count INTEGER;
BEGIN
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_income, v_expenses, v_transaction_count
    FROM public.transactions
    WHERE user_id = p_user_id
      AND date BETWEEN p_start_date AND p_end_date
      AND NOT is_recurring;  -- Exclude recurring templates
    
    RETURN jsonb_build_object(
        'total_income', v_income,
        'total_expenses', v_expenses,
        'net_flow', v_income - v_expenses,
        'transaction_count', v_transaction_count,
        'period_start', p_start_date,
        'period_end', p_end_date
    );
END;
$$;

-- ============================================
-- USER SETUP
-- ============================================

-- Function: Initialize new user with defaults
CREATE OR REPLACE FUNCTION public.initialize_new_user(
    p_user_id UUID,
    p_currency TEXT DEFAULT 'IDR',
    p_language TEXT DEFAULT 'id'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings_id UUID;
BEGIN
    -- Create default settings
    INSERT INTO public.settings (
        user_id, currency, language
    ) VALUES (
        p_user_id, p_currency, p_language
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_settings_id;
    
    -- Assign default role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN jsonb_build_object(
        'success', true,
        'settings_created', v_settings_id IS NOT NULL,
        'user_id', p_user_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.process_transfer TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_balance_adjust TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_next_recurring_date TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_budget_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_net_worth TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_period_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_debt_payoff TO authenticated;

REVOKE EXECUTE ON FUNCTION public.initialize_new_user FROM authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_new_user TO service_role;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
