"use client";

// ============================================
// ONBOARDING MODAL
// 3-step onboarding for AI assistant
// ============================================

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Check, X, Sparkles, Lightbulb, Shield } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onDecline: () => void;
  t: (key: string) => string;
}

const TOTAL_STEPS = 3;

export function OnboardingModal({
  isOpen,
  onComplete,
  onDecline,
  t,
}: OnboardingModalProps): React.ReactNode {
  const [currentStep, setCurrentStep] = useState<number>(1);

  function handleNext(): void {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  }

  function handleBack(): void {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleStart(): void {
    onComplete();
  }

  function renderStep1(): React.ReactNode {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className="w-16 h-16 bg-gold-100 dark:bg-gold-900/30 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-gold-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t("ai.onboardingStep1Title")}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
          {t("ai.onboardingStep1Desc")}
        </p>
      </div>
    );
  }

  function renderStep2(): React.ReactNode {
    const items = [
      t("ai.onboardingStep2Item1"),
      t("ai.onboardingStep2Item2"),
      t("ai.onboardingStep2Item3"),
      t("ai.onboardingStep2Item4"),
      t("ai.onboardingStep2Item5"),
    ];

    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-100 dark:bg-gold-900/30 rounded-full flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-gold-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("ai.onboardingStep2Title")}
          </h3>
        </div>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderStep3(): React.ReactNode {
    const dataSent = [
      t("ai.onboardingStep3Item1"),
      t("ai.onboardingStep3Item2"),
      t("ai.onboardingStep3Item3"),
    ];
    const dataNotSent = [
      t("ai.onboardingStep3Item4"),
      t("ai.onboardingStep3Item5"),
      t("ai.onboardingStep3Item6"),
    ];

    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-100 dark:bg-gold-900/30 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-gold-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("ai.onboardingStep3Title")}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
              {t("ai.onboardingStep3DataSent")}
            </p>
            <ul className="space-y-1">
              {dataSent.map((item, index) => (
                <li key={index} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
            <p className="text-xs font-medium text-rose-700 dark:text-rose-400 mb-2">
              {t("ai.onboardingStep3DataNotSent")}
            </p>
            <ul className="space-y-1">
              {dataNotSent.map((item, index) => (
                <li key={index} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <X className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("ai.onboardingStep3Powered")}
        </p>
        <p className="text-xs text-gold-600 dark:text-gold-400 font-medium">
          {t("ai.onboardingStep3Agreement")}
        </p>
      </div>
    );
  }

  function renderStepContent(): React.ReactNode {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  }

  function renderProgressDots(): React.ReactNode {
    return (
      <div className="flex justify-center gap-2 py-3">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <span
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index + 1 === currentStep
                ? "bg-gold-500"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDecline}
      title={t("ai.title")}
      description={t("ai.subtitle")}
    >
      <div className="max-w-sm mx-auto">
        {renderStepContent()}
        {renderProgressDots()}

        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {currentStep > 1 ? (
            <Button variant="ghost" onClick={handleBack}>
              {t("ai.onboardingBack")}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            {currentStep === TOTAL_STEPS && (
              <Button variant="secondary" onClick={onDecline}>
                {t("ai.onboardingDecline")}
              </Button>
            )}
            <Button
              onClick={currentStep === TOTAL_STEPS ? handleStart : handleNext}
              variant="primary"
            >
              {currentStep === TOTAL_STEPS
                ? t("ai.onboardingStart")
                : t("ai.onboardingNext")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
