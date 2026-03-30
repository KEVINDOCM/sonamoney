'use client';

import { useState, useEffect } from 'react';
import { hasCompletedOnboarding } from '@/lib/guest/guestStorage';

export function useOnboarding() {
  const [hasCompleted, setHasCompleted] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const completed = hasCompletedOnboarding();
    setHasCompleted(completed);
    setIsReady(true);
  }, []);

  return {
    hasCompleted,
    isReady,
    shouldShowTour: isReady && !hasCompleted,
  };
}
