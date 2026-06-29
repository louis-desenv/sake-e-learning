/**
 * Onboarding Component
 *
 * Multi-step onboarding flow for collecting user profile information.
 * Guides new users through setting up their learning preferences.
 *
 * @fileoverview This component implements a 6-step onboarding wizard that collects
 * user's native language, learning language, interface language preference,
 * English level, learning goals, and name. The data is saved to the backend and localStorage.
 *
 * @dependencies react, react-i18next, ../types, ../constants, ./icons/NavIcons
 *
 * @author SAke E-Learning Team
 * @version 3.1.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserProfile, LearningGoal, Language, DailyGoal } from '../types';
import { ENGLISH_LEVELS, LEARNING_GOALS, LANGUAGES } from '../constants';
import { CheckCircleIcon } from './icons/NavIcons';
import { authService } from '../services/api';
import { loadLanguagePack } from '../i18n';
import { mapLangCode, detectBrowserLanguage } from '../utils/langUtils';
import { useTranslationProgress } from '../stores/translationStore';
import { Zap, Wind, TrendingUp, Flame, Check, Globe } from 'lucide-react';

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
  /** Pre-filled user name from registration/login */
  userName?: string;
}

// mapLang is now provided by ../utils/langUtils as mapLangCode
const mapLang = mapLangCode;

// ============================================================================
// COMPONENT
// ============================================================================

const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete, userName }) => {
  const { t, i18n } = useTranslation();
  const translationProgress = useTranslationProgress();
  // Current step in the onboarding flow (1-7)
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Whether the native language was auto-detected from the browser locale
  const [wasAutoDetected, setWasAutoDetected] = useState(false);

  // Partial user profile being built through the onboarding process
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: userName || '',
    goals: [],
  });

  /**
   * On mount: auto-detect browser language and pre-select it.
   * The user can change it — this is just a smart default.
   */
  useEffect(() => {
    const detected = detectBrowserLanguage();
    if (detected && LANGUAGES.includes(detected as Language)) {
      setProfile(prev => ({ ...prev, nativeLanguage: detected as Language }));
      setWasAutoDetected(true);
      // Pre-load the language pack so the UI starts translating immediately
      loadLanguagePack(mapLang(detected));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Advances to the next step.
   */
  const handleNext = () => setStep((s) => s + 1);

  /**
   * Goes back to the previous step.
   */
  const handleBack = () => {
    // If going back from step 4 (level) to step 3 (interface language preference),
    // restore the temporary language based on step 1 selection
    if (step === 4 && profile.nativeLanguage) {
      loadLanguagePack(mapLang(profile.nativeLanguage));
    }
    setStep((s) => s - 1);
  };

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
  const handleSubmit = async () => {
    if (profile.name && profile.level && profile.goals?.length && profile.nativeLanguage && profile.interfaceLanguage) {
      setIsSubmitting(true);
      try {
        const onboardingData = {
          name: profile.name,
          englishLevel: profile.level,
          goals: profile.goals,
          nativeLanguage: profile.nativeLanguage,
          interfaceLanguage: profile.interfaceLanguage,
          dailyGoal: profile.dailyGoal
        };
        await authService.saveOnboarding(onboardingData);
        
        // Also save interface language preference in UserProfile (local storage / state)
        const completedProfile = {
          ...profile,
          hasCompletedOnboarding: true,
          interests: ''
        } as UserProfile;
        
        onOnboardingComplete(completedProfile);
      } catch (error) {
        console.error('Failed to save onboarding data', error);
        alert(t('onboarding.errorSaving', { defaultValue: 'An error occurred while saving your profile. Please try again.' }));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert(t('onboarding.fillAllFields', { defaultValue: 'Please fill in all fields.' }));
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !profile.nativeLanguage;
    if (step === 2) return false; // Learning language is English
    if (step === 3) return !profile.interfaceLanguage;
    if (step === 4) return !profile.level;
    if (step === 5) return !profile.goals || profile.goals.length === 0;
    if (step === 6) return !profile.dailyGoal;
    return false;
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
              {t('onboarding.step1Title')}
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {t('onboarding.step1Desc')}
            </p>
            <select
              value={profile.nativeLanguage || ''}
              onChange={(e) => {
                const val = e.target.value as Language;
                setProfile({ ...profile, nativeLanguage: val });
                setWasAutoDetected(false); // user manually chose — hide auto-detect badge
                if (val) loadLanguagePack(mapLang(val));
              }}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-sm sm:text-base text-gray-900"
            >
              <option value="" className="text-gray-900 bg-white">{t('onboarding.selectLanguage')}</option>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="text-gray-900 bg-white">
                  {t(`onboarding.languages.${lang}`, { defaultValue: lang })}
                </option>
              ))}
            </select>

            {/* Discrete auto-detect indicator — no text, just a small icon hint */}
            {wasAutoDetected && profile.nativeLanguage && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                <Globe size={11} />
                {t('onboarding.autoDetected', { defaultValue: 'Suggested based on your device.' })}
              </p>
            )}
          </div>
        );
      case 2:
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {t('onboarding.stepLearningLangTitle')}
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {t('onboarding.stepLearningLangDesc')}
            </p>
            <div className="flex flex-col gap-2 sm:gap-3">
              <button
                className="w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 bg-blue-500 text-white border-blue-500 shadow-md transition-all text-sm sm:text-base cursor-default"
                type="button"
              >
                {t('onboarding.english')}
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {t('onboarding.stepInterfaceLangTitle')}
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {t('onboarding.stepInterfaceLangDesc')}
            </p>
            <div className="flex flex-col gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setProfile({ ...profile, interfaceLanguage: 'native' });
                  if (profile.nativeLanguage) {
                    loadLanguagePack(mapLang(profile.nativeLanguage));
                  }
                }}
                className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 transition-all text-sm sm:text-base ${
                  profile.interfaceLanguage === 'native'
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
                }`}
              >
                {t('onboarding.nativeOption', { lang: profile.nativeLanguage ? t(`onboarding.languages.${profile.nativeLanguage}`) : '' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfile({ ...profile, interfaceLanguage: 'learning' });
                  loadLanguagePack('en');
                }}
                className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 transition-all text-sm sm:text-base ${
                  profile.interfaceLanguage === 'learning'
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
                }`}
              >
                {t('onboarding.learningOption')}
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {t('onboarding.step2Title')}
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {t('onboarding.step2Desc')}
            </p>
            <div className="flex flex-col gap-2 sm:gap-3">
              {ENGLISH_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setProfile({ ...profile, level })}
                  className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 transition-all text-sm sm:text-base ${
                    profile.level === level
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
                  }`}
                >
                  {t(`onboarding.levels.${level}`, { defaultValue: level })}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {t('onboarding.step3Title')}
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {t('onboarding.step3Desc')}
            </p>
            <div className="flex flex-col gap-2 sm:gap-3">
              {LEARNING_GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleGoalToggle(goal)}
                  className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border-2 transition-all flex justify-between items-center text-sm sm:text-base ${
                    profile.goals?.includes(goal)
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
                  }`}
                >
                  <span>{t(`onboarding.goals.${goal}`, { defaultValue: goal })}</span>
                  {profile.goals?.includes(goal) && <CheckCircleIcon />}
                </button>
              ))}
            </div>
          </div>
        );
      case 6: {
        const DAILY_GOALS: { key: DailyGoal; minutes: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
          { key: 'Spark', minutes: '3',  Icon: Zap },
          { key: 'Flow',  minutes: '10', Icon: Wind },
          { key: 'Boost', minutes: '20', Icon: TrendingUp },
          { key: 'Surge', minutes: '30', Icon: Flame },
        ];
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {t('onboarding.stepDailyGoalTitle', { defaultValue: "What's your daily practice goal?" })}
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {t('onboarding.stepDailyGoalDesc', { defaultValue: 'Choose how much time you want to dedicate each day.' })}
            </p>
            <div className="flex flex-col gap-3">
              {DAILY_GOALS.map(({ key, minutes, Icon }) => {
                const isSelected = profile.dailyGoal === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setProfile({ ...profile, dailyGoal: key })}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-300 text-gray-800'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${
                      isSelected ? 'text-white' : 'text-blue-500'
                    }`}>
                      <Icon size={18} />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          {t(`onboarding.dailyGoals.${key}`, { defaultValue: key })}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {t(`onboarding.dailyGoals.${key}Minutes`, { defaultValue: `${minutes} min / day` })}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {t(`onboarding.dailyGoals.${key}Desc`, { defaultValue: '' })}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-white flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }
      case 7:
        return (
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {t('onboarding.step4Title')}
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {t('onboarding.step4Desc')}
            </p>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder={t('onboarding.placeholderName')}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Calculate progress percentage for the progress bar (7 steps total)
  const progress = (step / 7) * 100;

  return (
    <div className="min-h-[90vh] w-full flex items-center justify-center px-4 py-8">
      <div className="flex flex-col bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md text-gray-800 animate-fade-up">
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

        {/* Translation loading pill — visible only while a language pack is streaming */}
        {translationProgress.isLoading && (
          <div className="mt-4 sm:mt-5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex flex-col gap-1.5 animate-pulse-slow">
            <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {t('onboarding.preparingInterface', { defaultValue: 'Preparing interface in your language...' })}
              </span>
              <span className="tabular-nums text-blue-500">
                {translationProgress.progress}%
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${translationProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center gap-2 sm:gap-3 mt-4 sm:mt-6 md:mt-8">
          {/* Back button (hidden on first step) */}
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors text-sm sm:text-base"
            >
              {t('onboarding.btnBack')}
            </button>
          )}
          <div className="flex-1" />

          {/* Next button (hidden on last step) */}
          {step < 7 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled() || (step === 1 && translationProgress.isLoading)}
              className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-white bg-blue-600 transition-colors text-sm sm:text-base ${
                isNextDisabled() || (step === 1 && translationProgress.isLoading)
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:-translate-y-0.5 hover:shadow-lg'
              }`}
            >
              {t('onboarding.btnNext')}
            </button>
          )}

          {/* Submit button (shown only on last step) */}
          {step === 7 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!profile.name || isSubmitting}
              className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-white bg-green-500 shadow-md transition-all text-sm sm:text-base ${
                !profile.name || isSubmitting
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:-translate-y-0.5 hover:shadow-lg hover:bg-green-600'
              }`}
            >
              {isSubmitting ? t('onboarding.btnSaving') : t('onboarding.btnFinish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
