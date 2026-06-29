export type TestAccessProfile = {
  email: string;
  label: string;
  reason: string;
  expiresAt?: string;
  scenarioGeneration?: {
    plan: 'standard' | 'pro' | 'super';
    manualDailyLimit: number;
    automaticDailyLimit: number;
  };
};

export const UNRESTRICTED_TEST_ACCOUNTS: TestAccessProfile[] = [
  {
    email: 'dev-test@sakae.com',
    label: 'Dev test account',
    reason: 'Internal QA account with all feature gates bypassed.',
    scenarioGeneration: {
      plan: 'super',
      manualDailyLimit: 10,
      automaticDailyLimit: 4,
    },
  },
  {
    email: 'gabrielxxavier01@gmail.com',
    label: 'Founder QA',
    reason: 'Primary owner account used to test paid flows before release.',
    scenarioGeneration: {
      plan: 'super',
      manualDailyLimit: 10,
      automaticDailyLimit: 4,
    },
  },
  {
    email: 'gx5@email.com',
    label: 'GX5 QA',
    reason: 'Manual testing account for plan, scenario, voice, and avatar flows.',
    scenarioGeneration: {
      plan: 'super',
      manualDailyLimit: 10,
      automaticDailyLimit: 4,
    },
  },
  {
    email: 'bielxf@gmail.com',
    label: 'Biel QA',
    reason: 'Manual testing account for plan, scenario, voice, and avatar flows.',
    scenarioGeneration: {
      plan: 'super',
      manualDailyLimit: 10,
      automaticDailyLimit: 4,
    },
  },
];

const unrestrictedTestEmails = new Set(
  UNRESTRICTED_TEST_ACCOUNTS.map(account => account.email.trim().toLowerCase()),
);

export const isUnrestrictedTestAccount = (email?: string | null): boolean =>
  !!email && unrestrictedTestEmails.has(email.trim().toLowerCase());

export const getTestAccessProfile = (email?: string | null): TestAccessProfile | null => {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  return UNRESTRICTED_TEST_ACCOUNTS.find(account => account.email === normalizedEmail) ?? null;
};

export type ScenarioGenerationTestStatus = {
  plan: 'standard' | 'pro' | 'super';
  isTrial: boolean;
  currentLevel: number;
  automaticDailyLimit: number;
  automaticUsedToday: number;
  automaticRemainingToday: number;
  manualDailyLimit: number;
  manualUsedToday: number;
  manualRemainingToday: number;
  automaticRequiredLevel: number;
  manualRequiredLevel: number;
  nextResetTimeUtc: string;
};

export const getScenarioGenerationTestStatus = (
  email: string | null | undefined,
  currentLevel: number,
): ScenarioGenerationTestStatus | null => {
  const profile = getTestAccessProfile(email);
  const scenarioGeneration = profile?.scenarioGeneration;
  if (!scenarioGeneration) return null;

  return {
    plan: scenarioGeneration.plan,
    isTrial: false,
    currentLevel,
    automaticDailyLimit: scenarioGeneration.automaticDailyLimit,
    automaticUsedToday: 0,
    automaticRemainingToday: scenarioGeneration.automaticDailyLimit,
    manualDailyLimit: scenarioGeneration.manualDailyLimit,
    manualUsedToday: 0,
    manualRemainingToday: scenarioGeneration.manualDailyLimit,
    automaticRequiredLevel: 1,
    manualRequiredLevel: 1,
    nextResetTimeUtc: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
};
