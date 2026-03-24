-- Fix RLS policies for performance optimization
-- Use (select auth.uid()) pattern for initplan optimization

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

-- Create new policies using (select auth.uid()) for performance optimization (initplan)
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING ((select auth.uid()) = user_id);
  
CREATE POLICY "Users can insert own accounts" ON public.accounts
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
  
CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING ((select auth.uid()) = user_id);
  
CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Also fix categories policies
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Also fix transactions policies  
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING ((select auth.uid()) = user_id);
