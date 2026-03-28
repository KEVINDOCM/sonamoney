-- ============================================
-- 005: CATEGORIES & SEED DATA
-- Default categories and user onboarding
-- ============================================

-- ============================================
-- DEFAULT CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.default_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📁',
    budget_limit NUMERIC(15,2),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS - default categories are public

CREATE INDEX idx_default_categories_type ON public.default_categories(type, sort_order);

COMMENT ON TABLE public.default_categories IS 'System default categories for new user onboarding';

-- ============================================
-- SEED DEFAULT CATEGORIES (expense)
-- ============================================
INSERT INTO public.default_categories (name, type, color, icon, sort_order, budget_limit) VALUES
    ('Makanan', 'expense', '#FF6B6B', '🍔', 1, 2000000),
    ('Transportasi', 'expense', '#4ECDC4', '🚗', 2, 1000000),
    ('Belanja', 'expense', '#FFE66D', '🛍️', 3, 1500000),
    ('Tagihan', 'expense', '#F39C12', '📝', 4, 1500000),
    ('Hiburan', 'expense', '#9B59B6', '🎬', 5, NULL),
    ('Kesehatan', 'expense', '#E74C3C', '❤️', 6, NULL),
    ('Pendidikan', 'expense', '#3498DB', '📚', 7, NULL),
    ('Tempat Tinggal', 'expense', '#8E44AD', '🏠', 8, NULL),
    ('Perjalanan', 'expense', '#1ABC9C', '✈️', 9, NULL),
    ('Tabungan', 'expense', '#27AE60', '�', 10, NULL),
    ('Hadiah', 'expense', '#E91E63', '🎁', 11, NULL),
    ('Langganan', 'expense', '#34495E', '📺', 12, NULL),
    ('Lainnya', 'expense', '#95A5A6', '📦', 13, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DEFAULT CATEGORIES (income)
-- ============================================
INSERT INTO public.default_categories (name, type, color, icon, sort_order) VALUES
    ('Gaji', 'income', '#27AE60', '�', 1),
    ('Freelance', 'income', '#2ECC71', '💻', 2),
    ('Investasi', 'income', '#3498DB', '�', 3),
    ('Hadiah', 'income', '#9B59B6', '🎁', 4),
    ('Lainnya', 'income', '#95A5A6', '📦', 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTION: Seed default categories for new user
-- ============================================
DROP FUNCTION IF EXISTS public.seed_user_categories(UUID);

CREATE OR REPLACE FUNCTION public.seed_user_categories(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
    v_count2 INTEGER := 0;
BEGIN
    -- Insert default expense categories for user
    INSERT INTO public.categories (
        user_id, name, type, color, icon, budget_limit, is_default, sort_order
    )
    SELECT 
        p_user_id,
        dc.name,
        dc.type,
        dc.color,
        dc.icon,
        dc.budget_limit,
        TRUE,
        dc.sort_order
    FROM public.default_categories dc
    WHERE dc.type = 'expense' AND dc.is_active = TRUE
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Insert default income categories for user
    INSERT INTO public.categories (
        user_id, name, type, color, icon, budget_limit, is_default, sort_order
    )
    SELECT 
        p_user_id,
        dc.name,
        dc.type,
        dc.color,
        dc.icon,
        dc.budget_limit,
        TRUE,
        dc.sort_order
    FROM public.default_categories dc
    WHERE dc.type = 'income' AND dc.is_active = TRUE
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS v_count2 = ROW_COUNT;
    
    RETURN v_count + v_count2;
END;
$$;

-- ============================================
-- FUNCTION: Create default account for new user
-- ============================================
CREATE OR REPLACE FUNCTION public.seed_default_account(
    p_user_id UUID,
    p_currency TEXT DEFAULT 'IDR'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account_id UUID;
BEGIN
    INSERT INTO public.accounts (
        user_id, name, type, currency, balance, is_default, icon
    ) VALUES (
        p_user_id,
        'Dompet Utama',
        'regular',
        p_currency,
        0,
        TRUE,
        '💵'
    )
    RETURNING id INTO v_account_id;
    
    RETURN v_account_id;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- ============================================
-- FUNCTION: Complete user onboarding
-- ============================================
CREATE OR REPLACE FUNCTION public.onboard_new_user(
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
    v_account_id UUID;
    v_categories_count INTEGER;
    v_settings_id UUID;
BEGIN
    -- Create default settings
    INSERT INTO public.settings (
        user_id, currency, language
    ) VALUES (
        p_user_id, p_currency, p_language
    )
    ON CONFLICT (user_id) DO UPDATE SET
        updated_at = NOW()
    RETURNING id INTO v_settings_id;
    
    -- Assign default role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default account
    v_account_id := public.seed_default_account(p_user_id, p_currency);
    
    -- Seed default categories
    v_categories_count := public.seed_user_categories(p_user_id);
    
    -- Log onboarding
    PERFORM public.log_security_event(
        p_user_id,
        'user.onboarded',
        'success',
        'users',
        'create',
        NULL,
        NULL,
        jsonb_build_object(
            'currency', p_currency,
            'language', p_language,
            'categories_created', v_categories_count,
            'account_created', v_account_id IS NOT NULL
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'account_id', v_account_id,
        'categories_created', v_categories_count,
        'settings_id', v_settings_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON public.default_categories TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_user_categories TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_default_account TO service_role;
GRANT EXECUTE ON FUNCTION public.onboard_new_user TO service_role;

REVOKE ALL ON public.default_categories FROM anon;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
