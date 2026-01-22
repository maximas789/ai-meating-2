"use client";

import { useEffect, useRef, useCallback, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourPosition } from "@/lib/tour-definitions";
import { cn } from "@/lib/utils";
import { TourProgress } from "./tour-progress";

/** Get all focusable elements within a container */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/** Tooltip dimensions for positioning calculations */
interface TooltipSize {
  width: number;
  height: number;
}

/** Gap between target element and tooltip */
const GAP = 16;

/** Tooltip max width */
const TOOLTIP_WIDTH = 320;

/** Subscribe to resize/scroll events */
function subscribeToViewportChanges(callback: () => void) {
  window.addEventListener("resize", callback);
  window.addEventListener("scroll", callback, true);
  return () => {
    window.removeEventListener("resize", callback);
    window.removeEventListener("scroll", callback, true);
  };
}

/** Snapshot for viewport-based re-renders */
let viewportVersion = 0;
function getViewportSnapshot() {
  return viewportVersion;
}
function getServerViewportSnapshot() {
  return 0;
}

/**
 * Calculate tooltip position relative to target element
 */
function getTooltipPosition(
  targetRect: DOMRect | null,
  position: TourPosition,
  tooltipSize: TooltipSize
): { top: number; left: number } {
  // Center position (for modal-type steps)
  if (!targetRect || position === "center") {
    return {
      top: (window.innerHeight - tooltipSize.height) / 2,
      left: (window.innerWidth - tooltipSize.width) / 2,
    };
  }

  const { top, bottom, left, right, width, height } = targetRect;
  const centerX = left + width / 2;
  const centerY = top + height / 2;

  let tooltipTop: number;
  let tooltipLeft: number;

  switch (position) {
    case "bottom":
      tooltipTop = bottom + GAP;
      tooltipLeft = centerX - tooltipSize.width / 2;
      break;
    case "bottom-start":
      tooltipTop = bottom + GAP;
      tooltipLeft = left;
      break;
    case "bottom-end":
      tooltipTop = bottom + GAP;
      tooltipLeft = right - tooltipSize.width;
      break;
    case "top":
      tooltipTop = top - tooltipSize.height - GAP;
      tooltipLeft = centerX - tooltipSize.width / 2;
      break;
    case "top-start":
      tooltipTop = top - tooltipSize.height - GAP;
      tooltipLeft = left;
      break;
    case "top-end":
      tooltipTop = top - tooltipSize.height - GAP;
      tooltipLeft = right - tooltipSize.width;
      break;
    case "left":
      tooltipTop = centerY - tooltipSize.height / 2;
      tooltipLeft = left - tooltipSize.width - GAP;
      break;
    case "right":
      tooltipTop = centerY - tooltipSize.height / 2;
      tooltipLeft = right + GAP;
      break;
    default:
      tooltipTop = bottom + GAP;
      tooltipLeft = centerX - tooltipSize.width / 2;
  }

  // Clamp to viewport bounds with padding
  const padding = 16;
  tooltipLeft = Math.max(
    padding,
    Math.min(tooltipLeft, window.innerWidth - tooltipSize.width - padding)
  );
  tooltipTop = Math.max(
    padding,
    Math.min(tooltipTop, window.innerHeight - tooltipSize.height - padding)
  );

  return { top: tooltipTop, left: tooltipLeft };
}

interface TourTooltipProps {
  /** Whether the tooltip is visible */
  isVisible: boolean;
  /** Target element (null for modal/center position) */
  targetElement: HTMLElement | null;
  /** Tooltip position relative to target */
  position: TourPosition;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Handler for next button */
  onNext: () => void;
  /** Handler for previous button */
  onPrev: () => void;
  /** Handler for skip/close button */
  onSkip: () => void;
}

/**
 * Positioned tooltip for tour steps
 */
export function TourTooltip({
  isVisible,
  targetElement,
  position,
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const tooltipSizeRef = useRef<TooltipSize>({
    width: TOOLTIP_WIDTH,
    height: 200,
  });

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Auto-focus the Next button when tooltip becomes visible or step changes
  useEffect(() => {
    if (!isVisible || !nextButtonRef.current) return;

    // Small delay to ensure animation has started
    const timer = setTimeout(() => {
      nextButtonRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isVisible, currentStep]);

  // Handle Tab key for focus trapping
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab" || !tooltipRef.current) return;

      const focusable = getFocusableElements(tooltipRef.current);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) return;

      const active = document.activeElement;

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  // Subscribe to viewport changes for re-renders (this avoids setState in effect)
  useSyncExternalStore(
    useCallback((callback) => {
      const wrappedCallback = () => {
        viewportVersion++;
        callback();
      };
      return subscribeToViewportChanges(wrappedCallback);
    }, []),
    getViewportSnapshot,
    getServerViewportSnapshot
  );

  // Measure tooltip size after render via ref (no setState needed)
  useEffect(() => {
    if (tooltipRef.current && isVisible) {
      tooltipSizeRef.current = {
        width: tooltipRef.current.offsetWidth,
        height: tooltipRef.current.offsetHeight,
      };
    }
  }, [isVisible, title, description]);

  // Calculate position synchronously (derived from props and refs)
  const targetRect = targetElement?.getBoundingClientRect() ?? null;
  const tooltipPosition = getTooltipPosition(targetRect, position, tooltipSizeRef.current);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const transition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeOut" as const };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          className={cn(
            "fixed z-[101] w-80 max-w-[calc(100vw-2rem)]",
            "bg-card border border-border rounded-lg shadow-xl",
            "pointer-events-auto"
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={transition}
          role="dialog"
          aria-labelledby="tour-tooltip-title"
          aria-describedby="tour-tooltip-description"
          aria-modal="true"
          onKeyDown={handleKeyDown}
        >
          {/* Close button */}
          <button
            className={cn(
              "absolute top-2 right-2 p-1 rounded-sm",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
            onClick={onSkip}
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="p-4 pr-10">
            <h3
              id="tour-tooltip-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h3>
            <p
              id="tour-tooltip-description"
              className="mt-2 text-sm text-muted-foreground"
            >
              {description}
            </p>
          </div>

          {/* Footer with progress and navigation */}
          <div className="flex items-center justify-between px-4 pb-4">
            <TourProgress current={currentStep} total={totalSteps} />

            <div className="flex gap-2">
              {!isFirstStep && (
                <Button variant="ghost" size="sm" onClick={onPrev}>
                  Back
                </Button>
              )}
              <Button ref={nextButtonRef} size="sm" onClick={onNext}>
                {isLastStep ? "Done" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
