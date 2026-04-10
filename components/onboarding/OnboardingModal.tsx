"use client";

import { useState, useEffect } from "react";
import { X, Wallet, BarChart3, Target, TrendingUp, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StepData {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  highlight: string | null;
  cta: string;
}

const STEPS: StepData[] = [
  {
    step: 0,
    icon: Wallet,
    title: "Welcome to Money Tracer",
    description: "Your personal finance companion. Track every rupiah, understand your spending, and take control of your money.",
    highlight: null,
    cta: "Get Started",
  },
  {
    step: 1,
    icon: BarChart3,
    title: "Track Your Transactions",
    description: "Add income and expenses in seconds. Categorize them to see exactly where your money comes from and goes.",
    highlight: "Start by adding your first transaction using the Add Transaction button.",
    cta: "Next",
  },
  {
    step: 2,
    icon: Target,
    title: "Set Monthly Budgets",
    description: "Set spending limits for each expense category. Get visual warnings before you overspend.",
    highlight: "Visit the Budget page to set your first monthly limit.",
    cta: "Next",
  },
  {
    step: 3,
    icon: TrendingUp,
    title: "Understand Your Money",
    description: "The Analytics page gives you charts and insights about your spending patterns and trends.",
    highlight: "Check Analytics after adding a few transactions to see your patterns.",
    cta: "Start Tracking →",
  },
];

export function OnboardingModal(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("mt_onboarding_done");
    if (hasCompletedOnboarding !== "1") {
      setIsVisible(true);
    }
  }, []);

  const handleClose = (): void => {
    setIsClosing(true);
    setTimeout(() => {
      localStorage.setItem("mt_onboarding_done", "1");
      setIsVisible(false);
      setIsClosing(false);
    }, 350);
  };

  const handleNext = (): void => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = (): void => {
    handleClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      // eslint-disable-next-line react/forbid-component-props
      style={{
        animation: isClosing
          ? "fadeInOverlay 0.35s ease reverse both"
          : "fadeInOverlay 0.3s ease both",
      }}
      onClick={handleSkip}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        // eslint-disable-next-line react/forbid-component-props
        style={{
          animation: isClosing
            ? "slideDown 0.35s cubic-bezier(0.4, 0, 1, 1) both"
            : "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          {/* eslint-disable-next-line react/forbid-component-props */}
          <div
            className="h-1 bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Modal body */}
        <div className="p-6 lg:p-8">
          {/* Icon */}
          {/* eslint-disable-next-line react/forbid-component-props */}
          <div
            className="text-center mb-6 select-none"
            style={{
              animation: "popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1ms both",
            }}
          >
            {(() => {
              const IconComponent = STEPS[currentStep].icon;
              return <IconComponent className="w-14 h-14 mx-auto text-blue-600" />;
            })()}
          </div>

          {/* Title */}
          {/* eslint-disable-next-line react/forbid-component-props */}
          <h2
            className="text-xl lg:text-2xl font-bold text-gray-900 text-center mb-3"
            style={{
              animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 50ms both",
            }}
          >
            {STEPS[currentStep].title}
          </h2>

          {/* Description */}
          {/* eslint-disable-next-line react/forbid-component-props */}
          <p
            className="text-sm text-gray-500 text-center leading-relaxed mb-4"
            style={{
              animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 100ms both",
            }}
          >
            {STEPS[currentStep].description}
          </p>

          {/* Highlight */}
          {STEPS[currentStep].highlight && (
            // eslint-disable-next-line react/forbid-component-props
            <div
              className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-xs text-blue-700 text-center leading-relaxed"
              style={{
                animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 150ms both",
              }}
            >
              <Lightbulb className="w-3.5 h-3.5 inline-block mr-1" /> {STEPS[currentStep].highlight}
            </div>
          )}

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                aria-label={`Go to step ${i + 1}`}
                title={`Go to step ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 h-2 bg-blue-600"
                    : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            {/* CTA Button */}
            <button
              onClick={handleNext}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-colors duration-200 text-sm"
            >
              {STEPS[currentStep].cta}
            </button>

            {/* Skip button */}
            {currentStep < STEPS.length - 1 && (
              <button
                onClick={handleSkip}
                className="w-full h-9 text-gray-400 hover:text-gray-600 text-xs transition-colors duration-200"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>

        {/* Close X button */}
        <button
          onClick={handleSkip}
          title="Close onboarding"
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
