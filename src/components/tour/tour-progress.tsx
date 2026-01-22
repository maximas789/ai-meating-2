"use client";

import { cn } from "@/lib/utils";

interface TourProgressProps {
  /** Current step index (0-based) */
  current: number;
  /** Total number of steps */
  total: number;
  /** Additional class names */
  className?: string;
}

/**
 * Dot-based progress indicator for the tour
 */
export function TourProgress({ current, total, className }: TourProgressProps) {
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-colors duration-200",
            i === current
              ? "bg-primary"
              : i < current
                ? "bg-primary/50"
                : "bg-muted-foreground/30"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
