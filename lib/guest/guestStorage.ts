'use client';

import {
  STORAGE_KEYS,
  DEFAULT_GUEST_CATEGORIES,
  type GuestTransaction,
  type GuestCategory,
  type MigrationStatus,
} from './constants';

// Check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined';

// Initialize guest storage with default categories if empty
export function initializeGuestStorage(): void {
  if (!isBrowser()) return;

  const existingCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!existingCategories) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_GUEST_CATEGORIES));
  }

  const existingTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!existingTransactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  }
}

// Transaction operations
export function getGuestTransactions(): GuestTransaction[] {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!data) return [];

  try {
    return JSON.parse(data) as GuestTransaction[];
  } catch {
    return [];
  }
}

export function addGuestTransaction(
  transaction: Omit<GuestTransaction, 'id' | 'created_at'>
): GuestTransaction {
  if (!isBrowser()) throw new Error('Cannot add transaction in SSR');

  const transactions = getGuestTransactions();
  const newTransaction: GuestTransaction = {
    ...transaction,
    id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  };

  transactions.push(newTransaction);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

  return newTransaction;
}

export function updateGuestTransaction(
  id: string,
  updates: Partial<GuestTransaction>
): GuestTransaction | null {
  if (!isBrowser()) return null;

  const transactions = getGuestTransactions();
  const index = transactions.findIndex((t) => t.id === id);

  if (index === -1) return null;

  transactions[index] = { ...transactions[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

  return transactions[index];
}

export function deleteGuestTransaction(id: string): boolean {
  if (!isBrowser()) return false;

  const transactions = getGuestTransactions();
  const filtered = transactions.filter((t) => t.id !== id);

  if (filtered.length === transactions.length) return false;

  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
  return true;
}

export function getGuestTransactionCount(): number {
  return getGuestTransactions().length;
}

// Category operations
export function getGuestCategories(): GuestCategory[] {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!data) {
    // Initialize with defaults if empty
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_GUEST_CATEGORIES));
    return [...DEFAULT_GUEST_CATEGORIES];
  }

  try {
    return JSON.parse(data) as GuestCategory[];
  } catch {
    return [...DEFAULT_GUEST_CATEGORIES];
  }
}

export function addGuestCategory(category: Omit<GuestCategory, 'id'>): GuestCategory {
  if (!isBrowser()) throw new Error('Cannot add category in SSR');

  const categories = getGuestCategories();
  const newCategory: GuestCategory = {
    ...category,
    id: `guest-cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  categories.push(newCategory);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

  return newCategory;
}

export function updateGuestCategory(
  id: string,
  updates: Partial<GuestCategory>
): GuestCategory | null {
  if (!isBrowser()) return null;

  const categories = getGuestCategories();
  const index = categories.findIndex((c) => c.id === id);

  if (index === -1) return null;

  categories[index] = { ...categories[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

  return categories[index];
}

export function deleteGuestCategory(id: string): boolean {
  if (!isBrowser()) return false;

  const categories = getGuestCategories();
  const filtered = categories.filter((c) => c.id !== id);

  if (filtered.length === categories.length) return false;

  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
  return true;
}

// Migration status
export function getMigrationStatus(): MigrationStatus {
  if (!isBrowser()) return 'pending';

  const status = localStorage.getItem(STORAGE_KEYS.MIGRATION_STATUS);
  return (status as MigrationStatus) || 'pending';
}

export function setMigrationStatus(status: MigrationStatus): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.MIGRATION_STATUS, status);
}

// Onboarding status
export function hasCompletedOnboarding(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
}

export function setOnboardingCompleted(): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
}

// Clear all guest data (used after successful migration)
export function clearGuestData(): void {
  if (!isBrowser()) return;

  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.MIGRATION_STATUS);
  // Keep onboarding status to avoid showing tour again
}

// Get all guest data for migration
export function getAllGuestData(): {
  transactions: GuestTransaction[];
  categories: GuestCategory[];
} {
  return {
    transactions: getGuestTransactions(),
    categories: getGuestCategories(),
  };
}
