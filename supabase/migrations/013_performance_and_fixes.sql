-- ============================================
-- 013: PERFORMANCE & CONSISTENCY FIXES
-- Consolidated migration applying all remaining
-- improvements from the architecture audit.
-- Idempotent: safe to re-run.
-- ============================================

begin;

-- ────────────────────────────────────────────
-- 1. Fix goals table UUID default
--    All other tables use gen_random_uuid() (pgcrypto).
--    goals used the legacy uuid_generate_v4() (uuid-ossp).
-- ────────────────────────────────────────────
alter table public.goals
  alter column id set default gen_random_uuid();


-- ────────────────────────────────────────────
-- 2. Composite index: transactions (user_id, date DESC)
--    Eliminates sequential scans on dashboard
--    date-range queries filtering by user.
-- ────────────────────────────────────────────
create index if not exists idx_transactions_user_date
  on public.transactions (user_id, date desc);


-- ────────────────────────────────────────────
-- 3. Composite index: transactions (user_id, type)
--    Eliminates sequential scans for income/expense
--    aggregate sub-queries (dashboard totals, analytics).
-- ────────────────────────────────────────────
create index if not exists idx_transactions_user_type
  on public.transactions (user_id, type);


-- ────────────────────────────────────────────
-- 4. Composite index: transactions (user_id, category_id)
--    Speeds up budget adherence and per-category reports.
-- ────────────────────────────────────────────
create index if not exists idx_transactions_user_category
  on public.transactions (user_id, category_id);


-- ────────────────────────────────────────────
-- 5. Composite index: transfers (user_id, date DESC)
-- ────────────────────────────────────────────
create index if not exists idx_transfers_user_date
  on public.transfers (user_id, date desc);


-- ────────────────────────────────────────────
-- 6. Composite index: debts (user_id, is_active)
--    Common filter: active debts list.
-- ────────────────────────────────────────────
create index if not exists idx_debts_user_active
  on public.debts (user_id, is_active);


-- ────────────────────────────────────────────
-- 7. Composite index: debt_payments (debt_id, payment_date DESC)
--    Needed for payment history queries.
-- ────────────────────────────────────────────
create index if not exists idx_debt_payments_debt_date
  on public.debt_payments (debt_id, payment_date desc);


-- ────────────────────────────────────────────
-- 8. Constraint: transactions.amount must be positive
--    Prevents silent data corruption from negative inserts.
-- ────────────────────────────────────────────
alter table public.transactions
  drop constraint if exists transactions_amount_positive;

alter table public.transactions
  add constraint transactions_amount_positive
  check (amount > 0);


-- ────────────────────────────────────────────
-- 9. Constraint: debt_payments.amount must be positive
-- ────────────────────────────────────────────
alter table public.debt_payments
  drop constraint if exists debt_payments_amount_positive;

alter table public.debt_payments
  add constraint debt_payments_amount_positive
  check (amount > 0);


-- ────────────────────────────────────────────
-- 10. Constraint: goals target_amount must be positive
-- ────────────────────────────────────────────
alter table public.goals
  drop constraint if exists goals_target_amount_positive;

alter table public.goals
  add constraint goals_target_amount_positive
  check (target_amount > 0);


-- ────────────────────────────────────────────
-- 11. Validate amount constraint on existing rows
--     (non-destructive — logs violations without failing)
-- ────────────────────────────────────────────
-- NOTE: if existing rows violate the constraint the
-- alter table above will raise an error. Run this query
-- first to identify violators:
--   SELECT id, amount FROM public.transactions WHERE amount <= 0;
-- Then decide to fix or delete them before re-running.


-- ────────────────────────────────────────────
-- 12. Refresh PostgREST schema cache
-- ────────────────────────────────────────────
notify pgrst, 'reload schema';

commit;


-- ============================================
-- CLEANUP SCHEDULE (pg_cron)
-- Wire up cleanup functions via the Supabase
-- Dashboard → Database → Extensions → pg_cron,
-- or via SQL after enabling the extension:
--
--   select cron.schedule(
--     'cleanup-auth-attempts',
--     '0 */6 * * *',   -- every 6 hours
--     $$select cleanup_old_auth_attempts()$$
--   );
--
--   select cron.schedule(
--     'cleanup-audit-logs',
--     '0 3 * * *',      -- daily at 03:00
--     $$select cleanup_old_audit_logs()$$
--   );
--
--   select cron.schedule(
--     'cleanup-rate-limits',
--     '*/30 * * * *',   -- every 30 minutes
--     $$select cleanup_expired_rate_limits()$$
--   );
--
--   select cron.schedule(
--     'cleanup-ip-blocks',
--     '0 * * * *',      -- hourly
--     $$select cleanup_expired_ip_blocks()$$
--   );
--
--   select cron.schedule(
--     'cleanup-violations',
--     '0 4 * * 0',      -- weekly on Sunday at 04:00
--     $$select cleanup_old_violations()$$
--   );
-- ============================================
