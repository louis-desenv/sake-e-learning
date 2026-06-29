/**
 * Navigation Icons Component
 *
 * Collection of SVG icon components used throughout the application.
 * Provides consistent iconography with customizable className styling.
 *
 * @fileoverview This file exports individual icon components as React functional
 * components, each accepting a className prop for Tailwind CSS customization.
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
 * Props for icon components.
 *
 * @interface IconProps
 */
interface IconProps {
  /** Optional Tailwind CSS classes for styling */
  className?: string;
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================

/**
 * Home icon component.
 * Displays a house icon for navigation to home/dashboard.
 *
 * @component HomeIcon
 * @param {IconProps} props - Icon styling props
 * @returns {JSX.Element} Home icon SVG
 *
 * @example
 * ```tsx
 * <HomeIcon className="h-6 w-6 text-blue-500" />
 * ```
 */
export const HomeIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

/**
 * Chat/conversation icon component.
 * Displays a speech bubble icon for messaging/chat features.
 *
 * @component ChatIcon
 * @param {IconProps} props - Icon styling props
 * @returns {JSX.Element} Chat icon SVG
 */
export const ChatIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

/**
 * Book/learning icon component.
 * Displays an open book icon for educational content.
 *
 * @component BookOpenIcon
 * @param {IconProps} props - Icon styling props
 * @returns {JSX.Element} Book icon SVG
 */
export const BookOpenIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

/**
 * Video/camera icon component.
 * Displays a video camera icon for video-related features.
 *
 * @component VideoCameraIcon
 * @param {IconProps} props - Icon styling props
 * @returns {JSX.Element} Video camera icon SVG
 */
export const VideoCameraIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

/**
 * User profile icon component.
 * Displays a user silhouette icon for profile/account features.
 *
 * @component UserCircleIcon
 * @param {IconProps} props - Icon styling props
 * @returns {JSX.Element} User icon SVG
 */
export const UserCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

/**
 * Avatar/face icon component.
 * Displays a user face/avatar icon for avatar chat features.
 *
 * @component AvatarIcon
 * @param {IconProps} props - Icon styling props
 * @returns {JSX.Element} Avatar icon SVG
 */
export const AvatarIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Check circle/success icon component.
 * Displays a checkmark in a circle for completion states.
 *
 * @component CheckCircleIcon
 * @param {IconProps} props - Icon styling props
 * @returns {JSX.Element} Check circle icon SVG
 */
export const CheckCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Microphone icon component.
 * Displays a microphone icon for voice/audio features.
 *
 * @component MicrophoneIcon
 * @param {IconProps} props - Icon styling props
 * @returns {JSX.Element} Microphone icon SVG
 */
export const MicrophoneIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

/**
 * Star icon component.
 * Displays a star icon for premium/plans features.
 *
 * @component StarIcon
 * @param {IconProps} props - Icon styling props
 * @returns {JSX.Element} Star icon SVG
 */
export const StarIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);
