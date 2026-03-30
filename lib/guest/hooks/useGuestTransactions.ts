'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getGuestTransactions,
  addGuestTransaction,
  updateGuestTransaction,
  deleteGuestTransaction,
  getGuestTransactionCount,
  initializeGuestStorage,
} from '../guestStorage';
import { GUEST_TRANSACTION_LIMIT, type GuestTransaction } from '../constants';

interface UseGuestTransactionsReturn {
  transactions: GuestTransaction[];
  isLoading: boolean;
  count: number;
  hasReachedLimit: boolean;
  remainingSlots: number;
  addTransaction: (
    transaction: Omit<GuestTransaction, 'id' | 'created_at'>
  ) => GuestTransaction | null;
  updateTransaction: (
    id: string,
    updates: Partial<GuestTransaction>
  ) => GuestTransaction | null;
  deleteTransaction: (id: string) => boolean;
  refreshTransactions: () => void;
}

export function useGuestTransactions(): UseGuestTransactionsReturn {
  const [transactions, setTransactions] = useState<GuestTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize storage on first load
  useEffect(() => {
    initializeGuestStorage();
    refreshTransactions();
  }, []);

  const refreshTransactions = useCallback(() => {
    setIsLoading(true);
    const data = getGuestTransactions();
    setTransactions(data);
    setIsLoading(false);
  }, []);

  const count = transactions.length;
  const hasReachedLimit = count >= GUEST_TRANSACTION_LIMIT;
  const remainingSlots = Math.max(0, GUEST_TRANSACTION_LIMIT - count);

  const addTransaction = useCallback(
    (transaction: Omit<GuestTransaction, 'id' | 'created_at'>): GuestTransaction | null => {
      if (hasReachedLimit) {
        return null;
      }

      try {
        const newTransaction = addGuestTransaction(transaction);
        setTransactions((prev) => [...prev, newTransaction]);
        return newTransaction;
      } catch {
        return null;
      }
    },
    [hasReachedLimit]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<GuestTransaction>): GuestTransaction | null => {
      const updated = updateGuestTransaction(id, updates);
      if (updated) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? updated : t))
        );
      }
      return updated;
    },
    []
  );

  const deleteTransaction = useCallback((id: string): boolean => {
    const success = deleteGuestTransaction(id);
    if (success) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
    return success;
  }, []);

  return {
    transactions,
    isLoading,
    count,
    hasReachedLimit,
    remainingSlots,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions,
  };
}
