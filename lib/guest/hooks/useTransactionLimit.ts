'use client';

import { useState, useEffect, useCallback } from 'react';
import { GUEST_TRANSACTION_LIMIT } from '../constants';
import { getGuestTransactionCount } from '../guestStorage';

interface UseTransactionLimitReturn {
  count: number;
  hasReachedLimit: boolean;
  remainingSlots: number;
  refreshCount: () => void;
}

export function useTransactionLimit(): UseTransactionLimitReturn {
  const [count, setCount] = useState(0);

  const refreshCount = useCallback(() => {
    const currentCount = getGuestTransactionCount();
    setCount(currentCount);
  }, []);

  // Refresh count on mount and when localStorage changes
  useEffect(() => {
    refreshCount();

    // Listen for storage events from other tabs
    const handleStorageChange = () => {
      refreshCount();
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    const handleCustomEvent = () => {
      refreshCount();
    };
    window.addEventListener('guest-transaction-updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('guest-transaction-updated', handleCustomEvent);
    };
  }, [refreshCount]);

  const hasReachedLimit = count >= GUEST_TRANSACTION_LIMIT;
  const remainingSlots = Math.max(0, GUEST_TRANSACTION_LIMIT - count);

  return {
    count,
    hasReachedLimit,
    remainingSlots,
    refreshCount,
  };
}

// Helper to dispatch custom event when transactions change
export function dispatchTransactionUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guest-transaction-updated'));
  }
}
