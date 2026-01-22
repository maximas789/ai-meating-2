/**
 * Tour Storage Utilities
 *
 * Manages localStorage persistence for product tour completion state.
 * Supports versioning to allow re-showing tours when new features are added.
 */

/** localStorage key for tour completion status */
const TOUR_COMPLETED_KEY = 'tour:meeting:completed';

/** localStorage key for tour version */
const TOUR_VERSION_KEY = 'tour:version';

/** Current tour version - increment to re-show tour for all users */
const CURRENT_TOUR_VERSION = '1.0.0';

/**
 * Check if the tour has been completed
 * @returns true if the tour was previously completed
 */
export function isTourCompleted(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Get the stored tour version
 * @returns the stored version string or null if not set
 */
export function getTourVersion(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(TOUR_VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Mark the tour as completed and store the current version
 */
export function markTourCompleted(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    localStorage.setItem(TOUR_VERSION_KEY, CURRENT_TOUR_VERSION);
  } catch {
    console.error('Failed to save tour completion state');
  }
}

/**
 * Reset the tour state, allowing it to be shown again
 */
export function resetTour(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.removeItem(TOUR_VERSION_KEY);
  } catch {
    console.error('Failed to reset tour state');
  }
}

/**
 * Determine if the tour should be shown
 * Returns true if:
 * - Tour has never been completed, OR
 * - Tour version has changed since last completion
 *
 * @returns true if the tour should be displayed
 */
export function shouldShowTour(): boolean {
  if (typeof window === 'undefined') return false;

  // If tour not completed, show it
  if (!isTourCompleted()) {
    return true;
  }

  // If tour version changed, show it again
  const storedVersion = getTourVersion();
  if (storedVersion !== CURRENT_TOUR_VERSION) {
    return true;
  }

  return false;
}
