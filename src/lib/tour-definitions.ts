/**
 * Tour Step Definitions
 *
 * Type definitions and step configurations for the product tour system.
 */

/** Position options for tour tooltips */
export type TourPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end';

/** Tour step type - either a centered modal or element spotlight */
export type TourStepType = 'spotlight' | 'modal';

/**
 * Configuration for a single tour step
 */
export interface TourStep {
  /** Unique identifier for this step */
  id: string;
  /** Type of step display */
  type: TourStepType;
  /** ID of the target element (matches data-tour-id attribute) */
  targetId?: string;
  /** Step title displayed in tooltip */
  title: string;
  /** Step description/instructions */
  description: string;
  /** Tooltip position relative to target element */
  position: TourPosition;
  /** Whether to add a highlight effect to the target */
  highlight?: boolean;
}

/**
 * Tour step definitions for the meeting page
 */
export const meetingTourSteps: TourStep[] = [
  {
    id: 'welcome',
    type: 'modal',
    title: 'Welcome to AI Meeting Assistant',
    description:
      "Let me show you around the interface. This tour takes about 30 seconds.",
    position: 'center',
  },
  {
    id: 'breathing-orb',
    type: 'spotlight',
    targetId: 'breathing-orb',
    title: 'The Breathing Orb',
    description:
      "This orb visualizes the assistant's state. Blue means idle, green means listening, purple means speaking.",
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'status-bar',
    type: 'spotlight',
    targetId: 'status-bar',
    title: 'Service Status',
    description:
      'Monitor your connected services here: Whisper for speech recognition, wake word detection, and Piper for text-to-speech.',
    position: 'bottom',
  },
  {
    id: 'meeting-controls',
    type: 'spotlight',
    targetId: 'meeting-controls',
    title: 'Meeting Controls',
    description:
      'Mute your mic, manually start recording, or toggle speaker output.',
    position: 'top',
  },
  {
    id: 'record-button',
    type: 'spotlight',
    targetId: 'record-button',
    title: 'Voice Recording',
    description:
      'Press to manually record. Or just say your wake word - the assistant is always listening when unmuted.',
    position: 'top',
  },
  {
    id: 'insights-sidebar',
    type: 'spotlight',
    targetId: 'insights-sidebar',
    title: 'Insights Feed',
    description:
      'All conversations and AI responses appear here. Scroll through your meeting history.',
    position: 'left',
  },
  {
    id: 'settings-button',
    type: 'spotlight',
    targetId: 'settings-button',
    title: 'Quick Settings',
    description: 'Change your wake word and other preferences here.',
    position: 'bottom-end',
  },
];
