-- ============================================
-- 009e: ADD MISSING DEFAULT CATEGORIES
-- Adds new categories to existing databases
-- ============================================

-- ============================================
-- ADD MISSING EXPENSE CATEGORIES
-- ============================================
INSERT INTO public.default_categories (name, type, color, icon, sort_order, budget_limit) VALUES
    ('Tagihan', 'expense', '#F39C12', '📝', 4, 1500000),
    ('Kesehatan', 'expense', '#E74C3C', '❤️', 6, NULL),
    ('Pendidikan', 'expense', '#3498DB', '📚', 7, NULL),
    ('Tempat Tinggal', 'expense', '#8E44AD', '🏠', 8, NULL),
    ('Perjalanan', 'expense', '#1ABC9C', '✈️', 9, NULL),
    ('Tabungan', 'expense', '#27AE60', '💰', 10, NULL),
    ('Langganan', 'expense', '#34495E', '📺', 12, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- UPDATE EXISTING CATEGORIES (icons only)
-- ============================================
UPDATE public.default_categories SET icon = '❤️' WHERE name = 'Kesehatan' AND type = 'expense';
UPDATE public.default_categories SET icon = '📝' WHERE name = 'Tagihan' AND type = 'expense';
UPDATE public.default_categories SET icon = '💼' WHERE name = 'Gaji' AND type = 'income';
UPDATE public.default_categories SET icon = '💻' WHERE name = 'Freelance' AND type = 'income';
UPDATE public.default_categories SET icon = '📈' WHERE name = 'Investasi' AND type = 'income';

-- ============================================
-- ADD FREELANCE INCOME CATEGORY
-- ============================================
INSERT INTO public.default_categories (name, type, color, icon, sort_order) VALUES
    ('Freelance', 'income', '#2ECC71', '💻', 2)
ON CONFLICT DO NOTHING;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
