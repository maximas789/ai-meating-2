/**
 * Tour Components
 *
 * Product tour system for guided onboarding.
 *
 * @example
 * ```tsx
 * import { TourProvider, useTourContext } from '@/components/tour';
 * import { meetingTourSteps } from '@/lib/tour-definitions';
 * import { shouldShowTour } from '@/lib/tour-storage';
 *
 * function App() {
 *   return (
 *     <TourProvider
 *       tourId="meeting"
 *       steps={meetingTourSteps}
 *       autoStart={shouldShowTour()}
 *     >
 *       <YourContent />
 *     </TourProvider>
 *   );
 * }
 * ```
 */

export { TourProvider, useTourContext } from "./tour-provider";
export { TourSpotlight } from "./tour-spotlight";
export { TourTooltip } from "./tour-tooltip";
export { TourProgress } from "./tour-progress";
