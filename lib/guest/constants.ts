// Guest mode constants
export const GUEST_TRANSACTION_LIMIT = 10;

// localStorage keys
export const STORAGE_KEYS = {
  TRANSACTIONS: 'sona_guest_transactions',
  CATEGORIES: 'sona_guest_categories',
  SETTINGS: 'sona_guest_settings',
  ONBOARDING_COMPLETED: 'sona_onboarding_completed',
  MIGRATION_STATUS: 'sona_migration_status',
} as const;

// Migration status types
export type MigrationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Guest category type
export interface GuestCategory {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  icon: string;
  budget_limit: number | null;
}

// Default categories for guest users
export const DEFAULT_GUEST_CATEGORIES: GuestCategory[] = [
  { id: 'guest-food', name: 'Food & Dining', color: '#FF6B6B', type: 'expense', icon: 'utensils', budget_limit: null },
  { id: 'guest-transport', name: 'Transport', color: '#4ECDC4', type: 'expense', icon: 'car', budget_limit: null },
  { id: 'guest-shopping', name: 'Shopping', color: '#45B7D1', type: 'expense', icon: 'shopping-bag', budget_limit: null },
  { id: 'guest-entertainment', name: 'Entertainment', color: '#96CEB4', type: 'expense', icon: 'film', budget_limit: null },
  { id: 'guest-bills', name: 'Bills & Utilities', color: '#FFEAA7', type: 'expense', icon: 'receipt', budget_limit: null },
  { id: 'guest-salary', name: 'Salary', color: '#00B9A7', type: 'income', icon: 'dollar-sign', budget_limit: null },
  { id: 'guest-freelance', name: 'Freelance', color: '#74B9FF', type: 'income', icon: 'briefcase', budget_limit: null },
];

// Guest transaction type (mirrors Supabase structure)
export interface GuestTransaction {
  id: string;
  category_id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  notes: string | null;
  is_recurring: boolean;
  recurring_interval: number | null;
  recurring_unit: 'day' | 'week' | 'month' | null;
  recurring_next_date: string | null;
  currency: string;
  created_at: string;
}

// Guest category type
export interface GuestCategory {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  icon: string;
  budget_limit: number | null;
}
