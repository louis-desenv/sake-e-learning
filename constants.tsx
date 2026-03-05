/**
 * Application Constants
 *
 * Centralized configuration constants used throughout the application.
 * Contains enum arrays, navigation items, and language options.
 *
 * @fileoverview This file exports all constant values used across the application,
 * including language levels, learning goals, supported languages, and navigation configuration.
 *
 * @dependencies react, ./types, ./components/icons/NavIcons
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React from 'react';
// Fix: Changed 'LearningGoal' from a type-only import to a value import.
import type { Language } from './types';
import { EnglishLevel, LearningGoal } from './types';
import { HomeIcon, ChatIcon, BookOpenIcon, VideoCameraIcon, UserCircleIcon, MicrophoneIcon, AvatarIcon } from './components/icons/NavIcons';

// ============================================================================
// NAVIGATION ITEM TYPE
// ============================================================================

/**
 * Navigation item configuration structure.
 *
 * @interface NavItem
 */
interface NavItem {
  /** Route path for navigation */
  path: string;
  /** Display label for the navigation item */
  label: string;
  /** React element containing the icon */
  icon: React.ReactNode;
}

// ============================================================================
// ENGLISH LEVELS
// ============================================================================

/**
 * Array of all available English proficiency levels.
 * Used for onboarding level selection and filtering.
 *
 * @constant {EnglishLevel[]}
 */
export const ENGLISH_LEVELS: EnglishLevel[] = [
  EnglishLevel.BEGINNER,
  EnglishLevel.INTERMEDIATE,
  EnglishLevel.ADVANCED,
];

// ============================================================================
// LEARNING GOALS
// ============================================================================

/**
 * Array of all available learning goals.
 * Used for onboarding goal selection and personalization.
 *
 * @constant {LearningGoal[]}
 */
export const LEARNING_GOALS: LearningGoal[] = [
  LearningGoal.CAREER,
  LearningGoal.TRAVEL,
  LearningGoal.CONVERSATION,
  LearningGoal.EXAMS,
];

// ============================================================================
// SUPPORTED LANGUAGES
// ============================================================================

/**
 * Array of all supported native languages.
 * Used for onboarding language selection and bilingual support.
 *
 * @constant {Language[]}
 */
export const LANGUAGES: Language[] = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Chinese', 'Russian', 'Arabic'
];

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

/**
 * Main application navigation configuration.
 * Defines all routes available in the bottom navigation bar.
 *
 * @constant {NavItem[]}
 */
export const NAV_ITEMS: NavItem[] = [
    { path: '/home', label: 'Home', icon: <HomeIcon /> },
    { path: '/chat/with-avatar', label: 'Avatar', icon: <AvatarIcon /> },
    { path: '/real-life', label: 'Real-Life', icon: <ChatIcon /> },
    { path: '/livekit-chat', label: 'Voice', icon: <MicrophoneIcon /> },
    { path: '/guided-learning', label: 'Learn', icon: <BookOpenIcon /> },
    // LIBRARY - Commented out
    // { path: '/library', label: 'Library', icon: <VideoCameraIcon /> },
    { path: '/profile', label: 'Profile', icon: <UserCircleIcon /> },
];
