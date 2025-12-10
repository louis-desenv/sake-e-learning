import React from 'react';
// Fix: Changed 'LearningGoal' from a type-only import to a value import.
import type { Language } from './types';
import { EnglishLevel, LearningGoal } from './types';
import { HomeIcon, ChatIcon, BookOpenIcon, VideoCameraIcon, UserCircleIcon, MicrophoneIcon } from './components/icons/NavIcons';


export const ENGLISH_LEVELS: EnglishLevel[] = [
  EnglishLevel.BEGINNER,
  EnglishLevel.INTERMEDIATE,
  EnglishLevel.ADVANCED,
];

export const LEARNING_GOALS: LearningGoal[] = [
  LearningGoal.CAREER,
  LearningGoal.TRAVEL,
  LearningGoal.CONVERSATION,
  LearningGoal.EXAMS,
];

export const LANGUAGES: Language[] = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Chinese', 'Russian', 'Arabic'
];

export const NAV_ITEMS = [
    { path: '/home', label: 'Home', icon: <HomeIcon /> },
    { path: '/chat', label: 'Chat', icon: <ChatIcon /> },
    { path: '/livekit-chat', label: 'Voice', icon: <MicrophoneIcon /> },
    { path: '/guided-learning', label: 'Learn', icon: <BookOpenIcon /> },
    { path: '/library', label: 'Library', icon: <VideoCameraIcon /> },
    { path: '/profile', label: 'Profile', icon: <UserCircleIcon /> },
];
