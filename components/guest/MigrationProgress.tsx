'use client';

import { useEffect, useState } from 'react';
import { useMigrateOnAuth } from '@/lib/guest/hooks/useMigrateOnAuth';
import { useToast } from '@/lib/hooks/useToast';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function MigrationProgress() {
  const { isMigrating, migrationStatus, lastMigrationResult, error } = useMigrateOnAuth();
  const { toast } = useToast();
  const { t, mounted } = useTranslation();
  const [showSuccess, setShowSuccess] = useState(false);

  // Show toast notifications for migration status
  useEffect(() => {
    if (migrationStatus === 'completed' && lastMigrationResult && !showSuccess) {
      setShowSuccess(true);
      toast.success(
        mounted
          ? t('guest.migrationSuccess') ||
              `Welcome! Your ${lastMigrationResult.transactionsMigrated} transactions have been saved.`
          : `Welcome! Your ${lastMigrationResult.transactionsMigrated} transactions have been saved.`
      );
    }

    if (migrationStatus === 'failed' && error) {
      toast.error(
        mounted
          ? t('guest.migrationError') || 'Failed to migrate some data. Your transactions are still available.'
          : 'Failed to migrate some data. Your transactions are still available.'
      );
    }
  }, [migrationStatus, lastMigrationResult, error, toast, t, mounted, showSuccess]);

  // Show loading indicator when migrating
  if (isMigrating) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00B9A7]" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {mounted ? t('guest.migrating') || 'Syncing your data...' : 'Syncing your data...'}
            </p>
            <p className="text-xs text-gray-500">
              {mounted
                ? t('guest.migratingDescription') || 'Please wait while we save your transactions'
                : 'Please wait while we save your transactions'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not migrating
  return null;
}
