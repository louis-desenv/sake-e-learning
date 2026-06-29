import { ApiUserDto, EnglishLevel, LearningGoal, UserProfile } from '../types';

const getOnboardingData = (): Partial<UserProfile> | null => {
  try {
    const data = localStorage.getItem('onboardingData');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const mapApiUserToProfile = (apiUser: ApiUserDto): UserProfile => {
  const onboardingData = getOnboardingData();

  return {
    id: apiUser.id?.toString(),
    name: apiUser.name,
    email: apiUser.email,
    hasPassword: apiUser.hasPassword,
    level: (apiUser.englishLevel as EnglishLevel) || onboardingData?.level || EnglishLevel.BEGINNER,
    goals: (apiUser.learningGoals as LearningGoal[]) || onboardingData?.goals || [LearningGoal.CONVERSATION],
    interests: onboardingData?.interests || 'General English',
    nativeLanguage: (apiUser.nativeLanguage as any) || onboardingData?.nativeLanguage || ('Portuguese' as any),
    interfaceLanguage: apiUser.interfaceLanguage || onboardingData?.interfaceLanguage,
    activePlan: apiUser.activePlan,
    isInTrial: apiUser.isInTrial,
    trialEndDate: apiUser.trialEndDate,
    hasUsedTrial: apiUser.hasUsedTrial,
    hasCompletedOnboarding: apiUser.hasCompletedOnboarding,
    hasSeenFeatureTour: apiUser.hasSeenFeatureTour,
    featureTourCompletedAtUtc: apiUser.featureTourCompletedAtUtc,
    dailyGoal: (apiUser.dailyGoal as any) || onboardingData?.dailyGoal,
  };
};
