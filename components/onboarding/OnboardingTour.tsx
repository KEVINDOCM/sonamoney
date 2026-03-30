'use client';

import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { onboardingSteps, driverConfig } from '@/lib/onboarding/driverConfig';
import { hasCompletedOnboarding, setOnboardingCompleted } from '@/lib/guest/guestStorage';

interface OnboardingTourProps {
  isGuest: boolean;
}

export function OnboardingTour({ isGuest }: OnboardingTourProps) {
  const [shouldRun, setShouldRun] = useState(false);

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = hasCompletedOnboarding();
    if (!completed) {
      // Delay slightly to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        setShouldRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!shouldRun) return;

    // Filter out guest-specific step if user is authenticated
    const steps = isGuest 
      ? onboardingSteps 
      : onboardingSteps.filter(step => step.element !== '[data-tour="guest-notice"]');

    const driverObj = driver({
      ...driverConfig,
      steps,
      onDestroyStarted: () => {
        // Mark onboarding as completed when tour is closed
        setOnboardingCompleted();
        driverObj.destroy();
      },
    });

    // Start the tour
    driverObj.drive();

    return () => {
      driverObj.destroy();
    };
  }, [shouldRun, isGuest]);

  return null;
}
