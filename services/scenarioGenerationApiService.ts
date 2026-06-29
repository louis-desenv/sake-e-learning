import { getApiRootUrl } from '../utils/apiUrl';

const SCENARIO_GENERATION_API_URL = `${getApiRootUrl()}/ScenarioGeneration`;

export type ScenarioGenerationType = 'automatic' | 'manual';
export type ScenarioCategory = 'real-life' | 'learn';

export interface ScenarioGenerationStatus {
  plan: 'free' | 'trial' | 'standard' | 'pro' | 'super';
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
}

export interface GeneratedScenarioDraft {
  title: string;
  description: string;
  slug: string;
  goal: string;
  tutorRole: string;
  studentRole: string;
  challenges: string[];
  vocabulary: string[];
  systemPrompt: string;
}

export interface ScenarioGenerationResponse {
  scenario: GeneratedScenarioDraft;
  requiredLevel: number;
  generationSource: ScenarioGenerationType;
  entitlements: ScenarioGenerationStatus;
}

export class ScenarioGenerationApiError extends Error {
  status: number;
  entitlements?: ScenarioGenerationStatus;

  constructor(message: string, status: number, entitlements?: ScenarioGenerationStatus) {
    super(message);
    this.name = 'ScenarioGenerationApiError';
    this.status = status;
    this.entitlements = entitlements;
  }
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleUnauthorized = () => {
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
};

export const getScenarioGenerationStatus = async (): Promise<ScenarioGenerationStatus> => {
  const response = await fetch(`${SCENARIO_GENERATION_API_URL}/status`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    handleUnauthorized();
  }

  if (!response.ok) {
    throw new ScenarioGenerationApiError(
      'Não foi possível carregar os limites de geração.',
      response.status,
    );
  }

  return response.json();
};

export const generateScenarioDraft = async (request: {
  category: ScenarioCategory;
  generationType: ScenarioGenerationType;
  intent?: string;
  transcript?: string;
}): Promise<ScenarioGenerationResponse> => {
  const response = await fetch(`${SCENARIO_GENERATION_API_URL}/generate`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    handleUnauthorized();
  }

  if (!response.ok) {
    throw new ScenarioGenerationApiError(
      payload.message || 'Não foi possível gerar o cenário.',
      response.status,
      payload.entitlements,
    );
  }

  return payload as ScenarioGenerationResponse;
};
