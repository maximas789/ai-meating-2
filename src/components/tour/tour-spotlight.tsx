"use client";

import { useSyncExternalStore, useCallback, useRef } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";

interface TourSpotlightProps {
  /** Target element to spotlight */
  targetElement: HTMLElement | null;
  /** Whether the spotlight is visible */
  isVisible: boolean;
  /** Padding around the target element */
  padding?: number;
  /** Border radius for the cutout */
  borderRadius?: number;
  /** Click handler for the overlay (for skipping) */
  onClick?: () => void;
}

/**
 * Calculate SVG path for spotlight overlay with rounded cutout
 */
function calculateSpotlightPath(
  element: HTMLElement,
  padding: number,
  borderRadius: number
): string {
  const rect = element.getBoundingClientRect();
  const { innerWidth: w, innerHeight: h } = window;

  const left = rect.left - padding;
  const top = rect.top - padding;
  const right = rect.right + padding;
  const bottom = rect.bottom + padding;
  const r = Math.min(borderRadius, (right - left) / 2, (bottom - top) / 2);

  // Full viewport rectangle (clockwise) with rounded rectangle cutout (counter-clockwise)
  return `
    M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z
    M ${left + r} ${top}
    L ${right - r} ${top}
    Q ${right} ${top} ${right} ${top + r}
    L ${right} ${bottom - r}
    Q ${right} ${bottom} ${right - r} ${bottom}
    L ${left + r} ${bottom}
    Q ${left} ${bottom} ${left} ${bottom - r}
    L ${left} ${top + r}
    Q ${left} ${top} ${left + r} ${top}
    Z
  `;
}

/** Subscribe to resize/scroll events */
function subscribeToViewportChanges(callback: () => void) {
  window.addEventListener("resize", callback);
  window.addEventListener("scroll", callback, true);
  return () => {
    window.removeEventListener("resize", callback);
    window.removeEventListener("scroll", callback, true);
  };
}

/**
 * Full-screen spotlight overlay with cutout around target element
 */
export function TourSpotlight({
  targetElement,
  isVisible,
  padding = 8,
  borderRadius = 8,
  onClick,
}: TourSpotlightProps) {
  // Cache viewport size to avoid infinite loop with useSyncExternalStore
  const viewportCache = useRef({ w: 0, h: 0 });

  const getViewportSnapshot = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Only return new object if values changed
    if (viewportCache.current.w !== w || viewportCache.current.h !== h) {
      viewportCache.current = { w, h };
    }
    return viewportCache.current;
  }, []);

  const getServerSnapshot = useCallback(() => ({ w: 0, h: 0 }), []);

  const viewportSize = useSyncExternalStore(
    subscribeToViewportChanges,
    getViewportSnapshot,
    getServerSnapshot
  );

  // Calculate spotlight path synchronously (derived state)
  const spotlightPath =
    targetElement && isVisible
      ? calculateSpotlightPath(targetElement, padding, borderRadius)
      : "";

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const transition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {isVisible && spotlightPath && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          onClick={onClick}
          aria-hidden="true"
        >
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${viewportSize.w} ${viewportSize.h}`}
            preserveAspectRatio="none"
          >
            <motion.path
              d={spotlightPath}
              fill="rgba(0, 0, 0, 0.75)"
              fillRule="evenodd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transition}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
