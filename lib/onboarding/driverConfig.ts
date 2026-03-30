import type { DriveStep } from 'driver.js';

export const onboardingSteps: DriveStep[] = [
  {
    element: '[data-tour="welcome"]',
    popover: {
      title: 'Welcome to SonaMoney!',
      description: 'Track your income and expenses effortlessly. Let\'s take a quick tour of the key features.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="add-transaction"]',
    popover: {
      title: 'Add Transactions',
      description: 'Click here to add your income or expenses. You can categorize them and even scan receipts!',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="dashboard"]',
    popover: {
      title: 'Your Dashboard',
      description: 'See your financial summary at a glance - total balance, income, and expenses.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="transactions-list"]',
    popover: {
      title: 'Recent Transactions',
      description: 'View and manage your recent transactions. Edit or delete them anytime.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Navigation Menu',
      description: 'Access Analytics, Budget, Calendar, Goals and more from the sidebar.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="guest-notice"]',
    popover: {
      title: 'Guest Mode',
      description: 'You\'re currently using guest mode with up to 10 transactions. Create a free account to unlock unlimited tracking!',
      side: 'bottom',
      align: 'center',
    },
  },
];

export const driverConfig = {
  showProgress: true,
  allowClose: true,
  overlayClickNext: false,
  stagePadding: 4,
  stageRadius: 8,
  popoverClass: 'sona-driver-theme',
  prevBtnText: '← Previous',
  nextBtnText: 'Next →',
  doneBtnText: 'Get Started!',
  progressText: '{{current}} of {{total}}',
};
