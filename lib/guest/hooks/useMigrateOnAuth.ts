'use client';

import { useEffect, useCallback, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  getAllGuestData,
  clearGuestData,
  setMigrationStatus,
  getMigrationStatus,
} from '../guestStorage';
import { migrateGuestData } from '../migrateGuestData';
import type { MigrationStatus } from '../constants';

interface UseMigrateOnAuthReturn {
  isMigrating: boolean;
  migrationStatus: MigrationStatus;
  lastMigrationResult: {
    transactionsMigrated: number;
    categoriesMigrated: number;
  } | null;
  error: string | null;
}

export function useMigrateOnAuth(): UseMigrateOnAuthReturn {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setLocalMigrationStatus] = useState<MigrationStatus>('pending');
  const [lastMigrationResult, setLastMigrationResult] = useState<{
    transactionsMigrated: number;
    categoriesMigrated: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performMigration = useCallback(async (userId: string) => {
    const currentStatus = getMigrationStatus();

    // Only migrate if not already completed
    if (currentStatus === 'completed' || currentStatus === 'in_progress') {
      return;
    }

    setIsMigrating(true);
    setLocalMigrationStatus('in_progress');
    setMigrationStatus('in_progress');
    setError(null);

    try {
      // Get all guest data
      const { transactions, categories } = getAllGuestData();

      // Skip if no data to migrate
      if (transactions.length === 0 && categories.length === 0) {
        setLocalMigrationStatus('completed');
        setMigrationStatus('completed');
        setIsMigrating(false);
        return;
      }

      // Call server action to migrate data
      const result = await migrateGuestData(userId, transactions, categories);

      if (result.success) {
        setLocalMigrationStatus('completed');
        setMigrationStatus('completed');
        setLastMigrationResult({
          transactionsMigrated: result.transactionsMigrated,
          categoriesMigrated: result.categoriesMigrated,
        });

        // Clear guest data after successful migration
        clearGuestData();
      } else {
        setLocalMigrationStatus('failed');
        setMigrationStatus('failed');
        setError(result.error || 'Migration failed');
      }
    } catch (err) {
      setLocalMigrationStatus('failed');
      setMigrationStatus('failed');
      setError(err instanceof Error ? err.message : 'Unknown error during migration');
    } finally {
      setIsMigrating(false);
    }
  }, []);

  useEffect(() => {
    // Initialize migration status from localStorage
    setLocalMigrationStatus(getMigrationStatus());

    // Set up Supabase auth state change listener
    const supabase = createSupabaseBrowserClient() as {
      auth: {
        onAuthStateChange: (
          callback: (event: string, session: { user?: { id: string } } | null) => void
        ) => { data: { subscription: { unsubscribe: () => void } } };
      };
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Trigger migration when user signs in
        performMigration(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [performMigration]);

  return {
    isMigrating,
    migrationStatus,
    lastMigrationResult,
    error,
  };
}
