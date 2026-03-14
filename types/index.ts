export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon?: string | null;
  budget_limit: number | null;
  created_at: string;
}

export type AccountType = "reguler" | "tabungan" | "utang";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  icon: string | null;
  currency: string;
  balance: number;
  is_default: boolean;
  created_at: string;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  account_id?: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  notes: string | null;
  created_at: string;
  // Recurring transaction fields
  is_recurring?: boolean;
  recurring_interval?: number | null;
  recurring_unit?: string | null;
  recurring_next_date?: string | null;
  recurring_parent_id?: string | null;
  // Tax and commission fields
  tax_rate?: number | null;
  commission_rate?: number | null;
  // Currency fields
  currency?: string;
  exchange_rate_at_time?: number;
}

export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
  from_account?: { name: string; icon: string | null };
  to_account?: { name: string; icon: string | null };
}

export interface TransactionWithCategory extends Transaction {
  categories: {
    name: string;
    color: string;
    type: string;
    icon: string | null;
  } | null;
}

export interface CategoryWithBudget extends Category {
  spent?: number;
}

export interface TransferWithAccounts extends Transfer {
  from_account: { name: string; icon: string | null };
  to_account: { name: string; icon: string | null };
}

