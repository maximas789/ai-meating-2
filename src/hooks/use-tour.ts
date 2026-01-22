"use client";

import { useState, useCallback, useEffect } from "react";
import type { TourStep } from "@/lib/tour-definitions";
import { markTourCompleted } from "@/lib/tour-storage";

/**
 * Options for the useTour hook
 */
export interface UseTourOptions {
  /**
   * Unique identifier for this tour
   */
  tourId: string;

  /**
   * Array of tour steps to display
   */
  steps: TourStep[];

  /**
   * Whether to auto-start the tour on mount
   * Default: false
   */
  autoStart?: boolean;

  /**
   * Callback when tour starts
   */
  onStart?: () => void;

  /**
   * Callback when tour completes (all steps finished)
   */
  onComplete?: () => void;

  /**
   * Callback when tour is skipped
   */
  onSkip?: () => void;
}

/**
 * Return value from the useTour hook
 */
export interface UseTourReturn {
  /**
   * Whether the tour is currently active
   */
  isActive: boolean;

  /**
   * Current step index (0-based)
   */
  currentStep: number;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Current step data, or null if tour is not active
   */
  currentStepData: TourStep | null;

  /**
   * Start or restart the tour from the beginning
   */
  startTour: () => void;

  /**
   * Advance to the next step, or complete if on last step
   */
  nextStep: () => void;

  /**
   * Go back to the previous step
   */
  prevStep: () => void;

  /**
   * Skip/exit the tour without completing
   */
  skipTour: () => void;

  /**
   * Jump to a specific step by index
   */
  goToStep: (step: number) => void;
}

/**
 * Hook for managing product tour state
 *
 * @param options - Tour configuration options
 * @returns Tour state and control functions
 *
 * @example
 * ```tsx
 * const tour = useTour({
 *   tourId: 'meeting',
 *   steps: meetingTourSteps,
 *   autoStart: shouldShowTour(),
 * });
 *
 * if (tour.isActive) {
 *   // Render tour UI
 * }
 * ```
 */
export function useTour(options: UseTourOptions): UseTourReturn {
  const { steps, autoStart = false, onStart, onComplete, onSkip } = options;

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = steps.length;
  const currentStepData = isActive ? steps[currentStep] ?? null : null;

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    onStart?.();
  }, [onStart]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    markTourCompleted();
    onComplete?.();
  }, [onComplete]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    markTourCompleted();
    onSkip?.();
  }, [onSkip]);

  const nextStep = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      completeTour();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  // Auto-start effect
  useEffect(() => {
    if (autoStart && !isActive) {
      startTour();
    }
    // Only run on mount when autoStart is true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps,
    currentStepData,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    goToStep,
  };
}
