'use client';

import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface TransactionLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionCount: number;
}

export function TransactionLimitModal({
  isOpen,
  onClose,
  transactionCount,
}: TransactionLimitModalProps) {
  const { t, mounted } = useTranslation();

  return (
    <Modal
      title={mounted ? t('guest.limitTitle') || 'Transaction Limit Reached' : 'Transaction Limit Reached'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex flex-col gap-6">
        {/* Icon and message */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00B9A7] to-[#0099A0] mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
            {mounted
              ? t('guest.limitReached') || 'You\'ve reached the limit!'
              : 'You\'ve reached the limit!'}
          </h3>
          <p className="text-sm text-gray-600">
            {mounted
              ? t('guest.limitDescription') ||
                `You've added ${transactionCount} transactions as a guest. Create a free account to unlock unlimited transactions and access all features.`
              : `You've added ${transactionCount} transactions as a guest. Create a free account to unlock unlimited transactions and access all features.`}
          </p>
        </div>

        {/* Benefits list */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {mounted ? t('guest.upgradeBenefits') || 'Upgrade to get:' : 'Upgrade to get:'}
          </p>
          <ul className="space-y-2">
            {[
              mounted ? t('guest.benefit1') || 'Unlimited transactions' : 'Unlimited transactions',
              mounted ? t('guest.benefit2') || 'Cloud sync across devices' : 'Cloud sync across devices',
              mounted ? t('guest.benefit3') || 'Advanced analytics & reports' : 'Advanced analytics & reports',
              mounted ? t('guest.benefit4') || 'Budget tracking & goals' : 'Budget tracking & goals',
              mounted ? t('guest.benefit5') || 'AI-powered insights' : 'AI-powered insights',
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <svg
                  className="w-4 h-4 text-[#00B9A7] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <div onClick={onClose}>
            <Link href="/signup" className="block">
              <Button className="w-full">
              {mounted ? t('guest.createAccount') || 'Create Free Account' : 'Create Free Account'}
              </Button>
            </Link>
          </div>
          <Button variant="secondary" onClick={onClose} className="w-full">
            {mounted ? t('common.maybeLater') || 'Maybe Later' : 'Maybe Later'}
          </Button>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-gray-500">
          {mounted ? t('guest.alreadyHaveAccount') || 'Already have an account?' : 'Already have an account?'}{' '}
          <div onClick={onClose}>
            <Link href="/login" className="text-[#00B9A7] font-semibold hover:text-[#0099A0] transition-colors">
              {mounted ? t('auth.login') || 'Sign in' : 'Sign in'}
            </Link>
          </div>
        </p>
      </div>
    </Modal>
  );
}
