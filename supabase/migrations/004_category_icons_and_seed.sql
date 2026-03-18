-- ============================================
-- 004: ADD CATEGORY ICONS AND DEFAULT CATEGORIES
-- ============================================

-- Add icon column to categories if not exists
alter table public.categories 
add column if not exists icon text default '📁';

-- Create table for default/system categories (template for new users)
create table if not exists public.default_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  icon text not null default '📁',
  budget_limit numeric,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- Insert default expense categories
insert into public.default_categories (name, type, color, icon, sort_order) values
  ('Makanan', 'expense', '#FF6B6B', '🍔', 1),
  ('Transportasi', 'expense', '#4ECDC4', '🚗', 2),
  ('Belanja', 'expense', '#FFE66D', '🛍️', 3),
  ('Hiburan', 'expense', '#9B59B6', '🎬', 4),
  ('Kesehatan', 'expense', '#E74C3C', '🏥', 5),
  ('Pendidikan', 'expense', '#3498DB', '📚', 6),
  ('Tagihan', 'expense', '#F39C12', '💡', 7),
  ('Investasi', 'expense', '#27AE60', '📈', 8),
  ('Donasi', 'expense', '#E91E63', '🎁', 9),
  ('Lainnya', 'expense', '#95A5A6', '📦', 10)
on conflict do nothing;

-- Insert default income categories
insert into public.default_categories (name, type, color, icon, sort_order) values
  ('Gaji', 'income', '#27AE60', '💰', 1),
  ('Bonus', 'income', '#2ECC71', '🎉', 2),
  ('Investasi', 'income', '#3498DB', '📊', 3),
  ('Hadiah', 'income', '#9B59B6', '🎁', 4),
  ('Lainnya', 'income', '#95A5A6', '📦', 5)
on conflict do nothing;

-- Function to seed default categories for a new user
create or replace function public.seed_user_categories(p_user_id uuid)
returns void
set search_path = ''
as $$
begin
  -- Insert default expense categories for user
  insert into public.categories (user_id, name, type, color, icon, budget_limit)
  select 
    p_user_id,
    name,
    type,
    color,
    icon,
    case 
      when name = 'Makanan' then 2000000
      when name = 'Transportasi' then 1000000
      when name = 'Belanja' then 1500000
      when name = 'Tagihan' then 1500000
      else null
    end
  from public.default_categories
  where type = 'expense' and is_active = true;
  
  -- Insert default income categories for user
  insert into public.categories (user_id, name, type, color, icon, budget_limit)
  select 
    p_user_id,
    name,
    type,
    color,
    icon,
    null
  from public.default_categories
  where type = 'income' and is_active = true;
end;
$$ language plpgsql;

-- Trigger to auto-seed categories when new user signs up
create or replace function public.handle_new_user_categories()
returns trigger
set search_path = ''
as $$
begin
  -- Seed default categories for new user
  perform public.seed_user_categories(new.id);
  return new;
end;
$$ language plpgsql;

-- Create trigger on auth.users (optional - uncomment if you want auto-seed)
-- drop trigger if exists on_auth_user_created_categories on auth.users;
-- create trigger on_auth_user_created_categories
--   after insert on auth.users
--   for each row
--   execute function public.handle_new_user_categories();
