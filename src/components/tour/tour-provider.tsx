"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTour, type UseTourReturn } from "@/hooks/use-tour";
import type { TourStep } from "@/lib/tour-definitions";
import { TourSpotlight } from "./tour-spotlight";
import { TourTooltip } from "./tour-tooltip";

/** Check if code is running on client */
function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Return a stable getter function
  return useCallback(() => isMounted.current, []);
}

/**
 * Context value for tour state and controls
 */
interface TourContextValue extends UseTourReturn {
  /** Currently targeted DOM element */
  targetElement: HTMLElement | null;
}

const TourContext = createContext<TourContextValue | null>(null);

/**
 * Hook to access tour context
 * @throws Error if used outside TourProvider
 */
export function useTourContext(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTourContext must be used within a TourProvider");
  }
  return context;
}

interface TourProviderProps {
  /** Tour identifier */
  tourId: string;
  /** Array of tour steps */
  steps: TourStep[];
  /** Whether to auto-start the tour on mount */
  autoStart?: boolean;
  /** Callback when tour completes */
  onComplete?: () => void;
  /** Callback when tour is skipped */
  onSkip?: () => void;
  /** Children to render */
  children: ReactNode;
}

/**
 * Tour provider component that manages tour state and renders overlay
 */
export function TourProvider({
  tourId,
  steps,
  autoStart = false,
  onComplete,
  onSkip,
  children,
}: TourProviderProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const getIsMounted = useIsMounted();

  const tour = useTour({
    tourId,
    steps,
    autoStart,
    onStart: () => {
      // Store current focus to restore later
      previousFocusRef.current = document.activeElement as HTMLElement;
    },
    onComplete: () => {
      // Restore focus
      previousFocusRef.current?.focus();
      onComplete?.();
    },
    onSkip: () => {
      // Restore focus
      previousFocusRef.current?.focus();
      onSkip?.();
    },
  });

  const { isActive, currentStepData, nextStep, prevStep, skipTour } = tour;

  // Find target element using useMemo (derived state, no effect needed)
  const targetElement = useMemo(() => {
    // Check if we're on client side
    if (typeof document === "undefined") return null;

    if (!isActive || !currentStepData) return null;

    if (currentStepData.type === "modal" || !currentStepData.targetId) {
      return null;
    }

    // Find element by data-tour-id attribute
    const element = document.querySelector<HTMLElement>(
      `[data-tour-id="${currentStepData.targetId}"]`
    );

    if (!element) {
      console.warn(
        `Tour: Could not find element with data-tour-id="${currentStepData.targetId}"`
      );
    }

    return element ?? null;
  }, [isActive, currentStepData]);

  // Scroll target into view when it changes
  useEffect(() => {
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetElement]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isActive) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          skipTour();
          break;
        case "ArrowRight":
        case "Enter":
          e.preventDefault();
          nextStep();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevStep();
          break;
      }
    },
    [isActive, nextStep, prevStep, skipTour]
  );

  useEffect(() => {
    if (!isActive) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, handleKeyDown]);

  // Context value
  const contextValue: TourContextValue = {
    ...tour,
    targetElement,
  };

  // Render overlay via portal
  const renderOverlay = () => {
    if (!getIsMounted() || !isActive || !currentStepData) return null;

    const isSpotlight =
      currentStepData.type === "spotlight" && targetElement !== null;

    return createPortal(
      <>
        {/* ARIA live region for screen readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          Step {tour.currentStep + 1} of {tour.totalSteps}: {currentStepData.title}
        </div>

        {/* Spotlight overlay (only for spotlight steps with target) */}
        <TourSpotlight
          targetElement={targetElement}
          isVisible={isSpotlight}
          onClick={skipTour}
        />

        {/* Modal backdrop (for modal steps without target) */}
        {currentStepData.type === "modal" && (
          <div
            className="fixed inset-0 z-[100] bg-black/75"
            onClick={skipTour}
            aria-hidden="true"
          />
        )}

        {/* Tooltip */}
        <TourTooltip
          isVisible={true}
          targetElement={targetElement}
          position={currentStepData.position}
          title={currentStepData.title}
          description={currentStepData.description}
          currentStep={tour.currentStep}
          totalSteps={tour.totalSteps}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
        />
      </>,
      document.body
    );
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {renderOverlay()}
    </TourContext.Provider>
  );
}
