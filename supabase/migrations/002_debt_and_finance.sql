-- ============================================
-- 002: DEBT & FINANCIAL HEALTH
-- Debt tracking with interest calculation and financial health metrics
-- Optimized for high-frequency payment tracking
-- ============================================

-- ============================================
-- DEBTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit_card', 'loan', 'mortgage', 'other')),
    lender TEXT,
    original_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (original_amount >= 0),
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    interest_rate NUMERIC(7,4) NOT NULL DEFAULT 0, -- Stored as decimal (e.g., 0.05 for 5%)
    interest_type TEXT NOT NULL DEFAULT 'annual' CHECK (interest_type IN ('annual', 'monthly')),
    minimum_payment NUMERIC(15,2),
    payment_due_date INTEGER CHECK (payment_due_date BETWEEN 1 AND 31),
    start_date DATE,
    end_date DATE,
    currency TEXT NOT NULL DEFAULT 'IDR',
    notes TEXT,
    color TEXT DEFAULT '#EF4444',
    icon TEXT DEFAULT '💳',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debts_isolation_policy" ON public.debts
    FOR ALL
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR public.get_user_role((SELECT auth.uid())) IN ('admin', 'auditor')
    )
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Optimized indexes for debts
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_user_active ON public.debts(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_debts_type ON public.debts(type);
CREATE INDEX idx_debts_due_date ON public.debts(user_id, payment_due_date) WHERE is_active = TRUE;

COMMENT ON TABLE public.debts IS 'Debt management with interest tracking';

-- ============================================
-- DEBT PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    interest_paid NUMERIC(15,2) DEFAULT 0,
    principal_paid NUMERIC(15,2) DEFAULT 0,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debt_payments_isolation_policy" ON public.debt_payments
    FOR ALL
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR public.get_user_role((SELECT auth.uid())) IN ('admin', 'auditor')
    )
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Optimized indexes for debt payments
CREATE INDEX idx_debt_payments_debt_id ON public.debt_payments(debt_id);
CREATE INDEX idx_debt_payments_user_id ON public.debt_payments(user_id);
CREATE INDEX idx_debt_payments_date ON public.debt_payments(payment_date DESC);
CREATE INDEX idx_debt_payments_debt_date ON public.debt_payments(debt_id, payment_date DESC);

COMMENT ON TABLE public.debt_payments IS 'Payment history for debt tracking';

-- ============================================
-- FINANCIAL HEALTH SCORE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.financial_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    category TEXT NOT NULL CHECK (category IN ('excellent', 'good', 'fair', 'poor', 'critical')),
    -- Component scores (0-100)
    savings_rate_score INTEGER CHECK (savings_rate_score BETWEEN 0 AND 100),
    debt_to_income_score INTEGER CHECK (debt_to_income_score BETWEEN 0 AND 100),
    expense_ratio_score INTEGER CHECK (expense_ratio_score BETWEEN 0 AND 100),
    emergency_fund_score INTEGER CHECK (emergency_fund_score BETWEEN 0 AND 100),
    -- Raw metrics used for calculation
    total_income NUMERIC(15,2),
    total_expenses NUMERIC(15,2),
    total_debt NUMERIC(15,2),
    total_savings NUMERIC(15,2),
    months_of_expenses NUMERIC(5,2), -- Emergency fund coverage
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, calculated_at)
);

ALTER TABLE public.financial_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_health_isolation_policy" ON public.financial_health_scores
    FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Indexes for financial health
CREATE INDEX idx_financial_health_user_id ON public.financial_health_scores(user_id);
CREATE INDEX idx_financial_health_user_date ON public.financial_health_scores(user_id, calculated_at DESC);

COMMENT ON TABLE public.financial_health_scores IS 'Calculated financial health metrics with component breakdown';

-- ============================================
-- BUDGET PERIODS TABLE (for budget tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.budget_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    -- NULL category_id means overall budget
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    budget_amount NUMERIC(15,2) NOT NULL CHECK (budget_amount > 0),
    spent_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'IDR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, period_type, period_start)
);

ALTER TABLE public.budget_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_periods_isolation_policy" ON public.budget_periods
    FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Optimized indexes for budget periods
CREATE INDEX idx_budget_periods_user_id ON public.budget_periods(user_id);
CREATE INDEX idx_budget_periods_user_category ON public.budget_periods(user_id, category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_budget_periods_active ON public.budget_periods(user_id, period_start, period_end) WHERE is_active = TRUE;

COMMENT ON TABLE public.budget_periods IS 'Budget tracking by period with automatic rollover support';

-- ============================================
-- TRIGGER: Updated timestamp for debts
-- ============================================
CREATE TRIGGER update_debts_updated_at
    BEFORE UPDATE ON public.debts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_periods_updated_at
    BEFORE UPDATE ON public.budget_periods
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNCTION: Calculate debt payoff projection
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_debt_payoff(
    p_debt_id UUID,
    p_monthly_payment NUMERIC
)
RETURNS TABLE (
    months_to_payoff INTEGER,
    total_interest NUMERIC,
    payoff_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance NUMERIC;
    v_rate NUMERIC;
    v_monthly_rate NUMERIC;
    v_months INTEGER := 0;
    v_total_interest NUMERIC := 0;
    v_max_months INTEGER := 600; -- 50 years max (sanity check)
BEGIN
    SELECT current_balance, 
           CASE 
               WHEN interest_type = 'annual' THEN interest_rate / 12
               ELSE interest_rate
           END
    INTO v_balance, v_rate
    FROM public.debts
    WHERE id = p_debt_id;
    
    IF v_balance IS NULL OR v_balance <= 0 THEN
        RETURN QUERY SELECT 0::INTEGER, 0::NUMERIC, CURRENT_DATE;
        RETURN;
    END IF;
    
    v_monthly_rate := v_rate;
    
    WHILE v_balance > 0 AND v_months < v_max_months LOOP
        v_months := v_months + 1;
        v_total_interest := v_total_interest + (v_balance * v_monthly_rate);
        v_balance := v_balance + (v_balance * v_monthly_rate) - p_monthly_payment;
        
        IF v_balance < 0 THEN
            v_total_interest := v_total_interest + v_balance; -- Adjust for overpayment
            v_balance := 0;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        v_months,
        ROUND(v_total_interest, 2),
        CURRENT_DATE + (v_months || ' months')::INTERVAL;
END;
$$;

-- ============================================
-- FUNCTION: Update debt balance on payment
-- ============================================
CREATE OR REPLACE FUNCTION public.process_debt_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the debt balance
    UPDATE public.debts
    SET current_balance = GREATEST(0, current_balance - NEW.principal_paid),
        updated_at = NOW()
    WHERE id = NEW.debt_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER debt_payment_processor
    AFTER INSERT ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.process_debt_payment();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debt_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_health_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_periods TO authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_debt_payoff TO authenticated;

REVOKE ALL ON public.debts FROM anon;
REVOKE ALL ON public.debt_payments FROM anon;
REVOKE ALL ON public.financial_health_scores FROM anon;
REVOKE ALL ON public.budget_periods FROM anon;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
