-- ============================================
-- 001: CORE SCHEMA - OPTIMIZED
-- All main tables with performance-first design
-- Optimized for 1M+ users with proper indexing strategy
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER ROLES TABLE (Early creation for RLS dependencies)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'auditor', 'support')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_admin_only" ON public.user_roles
    FOR ALL
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

COMMENT ON TABLE public.user_roles IS 'RBAC role assignments for users';

-- ============================================
-- HELPER FUNCTIONS (needed for RLS policies)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role = 'admin'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.user_roles
    WHERE user_id = p_user_id;
    RETURN COALESCE(v_role, 'user');
END;
$$;

-- ============================================
-- ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('regular', 'tabungan', 'utang', 'savings', 'checking', 'credit')),
    icon TEXT,
    color TEXT DEFAULT '#00B9A7',
    currency TEXT NOT NULL DEFAULT 'IDR',
    balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_isolation_policy" ON public.accounts
    FOR ALL
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR public.is_admin((SELECT auth.uid()))
    )
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_user_active ON public.accounts(user_id, is_active);
CREATE UNIQUE INDEX idx_accounts_unique_default_per_user 
ON public.accounts(user_id) 
WHERE is_default = TRUE;

COMMENT ON TABLE public.accounts IS 'User financial accounts with optimized RLS and indexing';

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT '#00B9A7',
    icon TEXT DEFAULT '📁',
    budget_limit NUMERIC(15,2),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_isolation_policy" ON public.categories
    FOR ALL
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR is_default = TRUE
        OR public.is_admin((SELECT auth.uid()))
    )
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_user_type ON public.categories(user_id, type);
CREATE INDEX idx_categories_user_budget ON public.categories(user_id) WHERE budget_limit IS NOT NULL;

COMMENT ON TABLE public.categories IS 'Transaction categories with budget tracking support';

-- ============================================
-- TRANSACTIONS TABLE (HIGH-VOLUME)
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    date DATE NOT NULL,
    notes TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_interval INTEGER,
    recurring_unit TEXT CHECK (recurring_unit IN ('day', 'week', 'month', 'year')),
    recurring_next_date DATE,
    recurring_parent_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    tax_rate NUMERIC(5,4) DEFAULT 0,
    commission_rate NUMERIC(5,4) DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'IDR',
    exchange_rate_at_time NUMERIC(15,8) DEFAULT 1,
    idempotency_key UUID UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_isolation_policy" ON public.transactions
    FOR ALL
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR public.get_user_role((SELECT auth.uid())) IN ('admin', 'auditor')
    )
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Core indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_recurring_parent ON public.transactions(recurring_parent_id) WHERE recurring_parent_id IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_type_date ON public.transactions(user_id, type, date DESC);
CREATE INDEX idx_transactions_user_category ON public.transactions(user_id, category_id, date DESC);

-- Partial index for recurring transactions
CREATE INDEX idx_transactions_recurring_due ON public.transactions(user_id, recurring_next_date)
    WHERE is_recurring = TRUE AND recurring_next_date IS NOT NULL;

-- Idempotency key index (partial for non-null only)
CREATE INDEX idx_transactions_idempotency ON public.transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

COMMENT ON TABLE public.transactions IS 'High-volume transaction data with optimized indexes';

-- ============================================
-- TRANSFERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    to_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    from_currency TEXT NOT NULL DEFAULT 'IDR',
    to_currency TEXT NOT NULL DEFAULT 'IDR',
    exchange_rate NUMERIC(15,8) NOT NULL DEFAULT 1,
    converted_amount NUMERIC(15,2),
    fee_amount NUMERIC(15,2) DEFAULT 0,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers_isolation_policy" ON public.transfers
    FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX idx_transfers_user_id ON public.transfers(user_id);
CREATE INDEX idx_transfers_user_date ON public.transfers(user_id, date DESC);
CREATE INDEX idx_transfers_from_account ON public.transfers(from_account_id, date DESC);
CREATE INDEX idx_transfers_to_account ON public.transfers(to_account_id, date DESC);

COMMENT ON TABLE public.transfers IS 'Inter-account transfers with currency conversion support';

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'IDR',
    language TEXT NOT NULL DEFAULT 'id',
    theme TEXT NOT NULL DEFAULT 'system',
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    number_format TEXT NOT NULL DEFAULT 'id-ID',
    enable_receipt_scanning BOOLEAN DEFAULT TRUE,
    enable_recurring_notifications BOOLEAN DEFAULT TRUE,
    enable_budget_alerts BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    weekly_summary_day INTEGER DEFAULT 0,
    require_password_for_sensitive BOOLEAN DEFAULT TRUE,
    session_timeout_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_isolation_policy" ON public.settings
    FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX idx_settings_user_id ON public.settings(user_id);

COMMENT ON TABLE public.settings IS 'Per-user application settings and preferences';

-- ============================================
-- GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'IDR',
    deadline DATE,
    icon TEXT DEFAULT '🎯',
    color TEXT DEFAULT '#00B9A7',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_isolation_policy" ON public.goals
    FOR ALL
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR public.get_user_role((SELECT auth.uid())) IN ('admin', 'auditor')
    )
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_user_deadline ON public.goals(user_id, deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_goals_user_completed ON public.goals(user_id, is_completed) WHERE is_completed = FALSE;

COMMENT ON TABLE public.goals IS 'Financial goals tracking with deadline support';

-- ============================================
-- TRIGGER: Auto-assign 'user' role on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.assign_default_role() IS 'Auto-assigns user role to new signups';

-- ============================================
-- TRIGGER: Updated timestamp function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

REVOKE ALL ON public.accounts FROM anon;
REVOKE ALL ON public.categories FROM anon;
REVOKE ALL ON public.transactions FROM anon;
REVOKE ALL ON public.transfers FROM anon;
REVOKE ALL ON public.settings FROM anon;
REVOKE ALL ON public.goals FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
