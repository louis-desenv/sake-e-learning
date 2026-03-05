/**
 * Onboarding Component
 *
 * Multi-step onboarding flow for collecting user profile information.
 * Guides new users through setting up their learning preferences.
 *
 * @fileoverview This component implements a 4-step onboarding wizard that collects
 * user's name, English level, learning goals, and native language. The data is
 * temporarily stored and passed to the parent component for account creation.
 *
 * @dependencies react, ../types, ../constants, ./icons/NavIcons
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { useState } from 'react';
import type { UserProfile, LearningGoal } from '../types';
import { EnglishLevel } from '../types';
import { ENGLISH_LEVELS, LEARNING_GOALS, LANGUAGES } from '../constants';
import { CheckCircleIcon } from './icons/NavIcons';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the Onboarding component.
 *
 * @interface OnboardingProps
 */
interface OnboardingProps {
  /** Callback invoked when onboarding is completed */
  onOnboardingComplete: (profile: UserProfile) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Multi-step onboarding wizard for new users.
 * Collects user profile information through a progressive form.
 *
 * @component Onboarding
 * @param {OnboardingProps} props - Component props
 * @returns {JSX.Element} Multi-step onboarding form
 *
 * @example
 * ```tsx
 * <Onboarding
 *   onOnboardingComplete={(profile) => {
 *     console.log('User profile:', profile);
 *     // Proceed to registration/login
 *   }}
 * />
 * ```
 */
const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete }) => {
  // Current step in the onboarding flow (1-4)
  const [step, setStep] = useState(1);

  // Partial user profile being built through the onboarding process
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    goals: [],
  });

  /**
   * Advances to the next step.
   */
  const handleNext = () => setStep((s) => s + 1);

  /**
   * Goes back to the previous step.
   */
  const handleBack = () => setStep((s) => s - 1);

  /**
   * Toggles a learning goal in the user's profile.
   * Adds the goal if not present, removes it if already selected.
   *
   * @param {LearningGoal} goal - The learning goal to toggle
   */
  const handleGoalToggle = (goal: LearningGoal) => {
    setProfile((p) => {
      const currentGoals = p.goals || [];
      const newGoals = currentGoals.includes(goal)
        ? currentGoals.filter((g) => g !== goal)
        : [...currentGoals, goal];
      return { ...p, goals: newGoals };
    });
  };

  /**
   * Validates and submits the completed profile.
   * Shows an alert if any required fields are missing.
   */
  const handleSubmit = () => {
    if (profile.name && profile.level && profile.goals?.length && profile.nativeLanguage) {
      onOnboardingComplete(profile as UserProfile);
    } else {
      alert("Please complete all fields.");
    }
  };

  /**
   * Renders the appropriate form step based on current step number.
   *
   * @returns {JSX.Element | null} The current step's UI
   */
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Welcome to SAke!
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Let's get to know you. What's your name?
            </p>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your name"
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
            />
          </div>
        );
      case 2:
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              What's your English level?
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              This helps us tailor the lessons for you.
            </p>
            <div className="flex flex-col gap-2 sm:gap-3">
              {ENGLISH_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setProfile({ ...profile, level })}
                  className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 transition-all text-sm sm:text-base ${
                    profile.level === level
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              What are your learning goals?
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Select all that apply.
            </p>
            <div className="flex flex-col gap-2 sm:gap-3">
              {LEARNING_GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => handleGoalToggle(goal)}
                  className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 transition-all flex justify-between items-center text-sm sm:text-base ${
                    profile.goals?.includes(goal)
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  <span>{goal}</span>
                  {profile.goals?.includes(goal) && <CheckCircleIcon />}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              What's your native language?
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              This allows for adaptive bilingual support.
            </p>
            <select
              value={profile.nativeLanguage}
              onChange={(e) =>
                setProfile({ ...profile, nativeLanguage: e.target.value as any })
              }
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-sm sm:text-base"
            >
              <option value="">Select a language</option>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  // Calculate progress percentage for the progress bar
  const progress = (step / 4) * 100;

  return (
    <div className="flex flex-col bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md mx-auto my-4 sm:my-6 md:my-8">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4 sm:h-2.5 sm:mb-6">
        <div
          className="bg-blue-600 h-2 sm:h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Current step content */}
      <div className="flex-1 flex items-center justify-center min-h-[180px] sm:min-h-50">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center gap-2 sm:gap-3 mt-4 sm:mt-6 md:mt-8">
        {/* Back button (hidden on first step) */}
        {step > 1 && (
          <button
            onClick={handleBack}
            className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors text-sm sm:text-base"
          >
            Back
          </button>
        )}
        <div className="flex-1" />

        {/* Next button (hidden on last step) */}
        {step < 4 && (
          <button
            onClick={handleNext}
            disabled={!profile.name && step === 1}
            className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Next
          </button>
        )}

        {/* Finish button (shown only on last step) */}
        {step === 4 && (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-white bg-green-500 hover:bg-green-600 transition-colors text-sm sm:text-base"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
