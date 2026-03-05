/**
 * Call Icons Component
 *
 * Collection of SVG icons for video call and audio interfaces.
 * Provides camera, microphone, and phone icons with customizable styling.
 *
 * @fileoverview This file exports icon components specifically designed for
 * video call interfaces, including camera toggle, microphone, and call control icons.
 *
 * @dependencies react
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React from 'react';

// ============================================================================
// PROP TYPES
// ============================================================================

/**
 * Props for call icon components.
 *
 * @interface CallIconProps
 */
interface CallIconProps {
  /** Optional Tailwind CSS classes for styling */
  className?: string;
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================

/**
 * Camera on icon component.
 * Displays a video camera for enabled camera state.
 *
 * @component CameraIcon
 * @param {CallIconProps} props - Icon styling props
 * @returns {JSX.Element} Camera icon SVG
 *
 * @example
 * ```tsx
 * <CameraIcon className="w-6 h-6 text-white" />
 * ```
 */
export const CameraIcon = ({ className }: CallIconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10l4-2v8l-4-2M5 6h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
    />
  </svg>
);

/**
 * Camera off icon component.
 * Displays a camera with slash overlay for disabled camera state.
 *
 * @component CameraOffIcon
 * @param {CallIconProps} props - Icon styling props
 * @returns {JSX.Element} Camera off icon SVG
 */
export const CameraOffIcon = ({ className }: CallIconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3l18 18M10 6h5a2 2 0 012 2v1l4-2v8l-4-2v1a2 2 0 01-2 2H6"
    />
  </svg>
);

/**
 * Microphone icon component.
 * Displays a microphone for audio input controls.
 *
 * @component MicrophoneIcon
 * @param {CallIconProps} props - Icon styling props
 * @returns {JSX.Element} Microphone icon SVG
 */
export const MicrophoneIcon = ({ className }: CallIconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 1v11m0 0a3 3 0 003-3V4a3 3 0 10-6 0v5a3 3 0 003 3zm0 0v4m-4 0h8"
    />
  </svg>
);

/**
 * Phone icon component.
 * Displays a telephone handset for call controls.
 *
 * @component PhoneIcon
 * @param {CallIconProps} props - Icon styling props
 * @returns {JSX.Element} Phone icon SVG
 */
export const PhoneIcon = ({ className }: CallIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 5.5C2 4.1 3.1 3 4.5 3h2a1 1 0 011 1l1 4a1 1 0 01-.3.95l-1.7 1.7a16 16 0 007.6 7.6l1.7-1.7a1 1 0 01.95-.3l4 1a1 1 0 011 1v2A2.5 2.5 0 0119.5 22C10.4 22 2 13.6 2 5.5z" />
  </svg>
);
