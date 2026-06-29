import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  Loader2,
  Lock,
  Plane,
  RefreshCw,
  Sparkles,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adaptationService } from '../services/adaptationService';
import { Scenario } from '../services/scenarioService';
import {
  getScenarioGenerationStatus,
  ScenarioCategory,
  ScenarioGenerationApiError,
  ScenarioGenerationResponse,
  ScenarioGenerationStatus,
} from '../services/scenarioGenerationApiService';
import { getScenarioGenerationTestStatus } from '../utils/testAccounts';

interface ScenarioGeneratorModalProps {
  open: boolean;
  category: ScenarioCategory;
  userId: string;
  userEmail?: string;
  activePlanType?: string;
  isInTrial?: boolean;
  currentLevel: number;
  onClose: () => void;
  onCreated: (scenario: Scenario, startNow: boolean) => void;
}

const POPULAR_INTENTS = [
  {
    icon: Briefcase,
    labelPt: 'Entrevista de emprego',
    labelEn: 'Job interview',
    promptPt: 'Tenho uma entrevista em breve e quero praticar perguntas comportamentais em inglês.',
    promptEn: 'I have a job interview soon and want to practice behavioral questions in English.',
  },
  {
    icon: Plane,
    labelPt: 'Viagem',
    labelEn: 'Travel',
    promptPt: 'Quero praticar uma situação de viagem que exija resolver um problema inesperado.',
    promptEn: 'I want to practice a travel situation where I need to solve an unexpected problem.',
  },
  {
    icon: Users,
    labelPt: 'Reunião de negócios',
    labelEn: 'Business meeting',
    promptPt: 'Quero praticar como apresentar uma ideia e responder objeções em uma reunião.',
    promptEn: 'I want to practice presenting an idea and handling objections in a meeting.',
  },
  {
    icon: BookOpen,
    labelPt: 'Inglês acadêmico',
    labelEn: 'Academic English',
    promptPt: 'Quero praticar como explicar um tema acadêmico com clareza e responder perguntas.',
    promptEn: 'I want to practice explaining an academic topic clearly and answering questions.',
  },
];

const getPlanLabel = (plan?: ScenarioGenerationStatus['plan'], language = 'pt') => {
  const labels = {
    free: language === 'en' ? 'Free' : 'Grátis',
    trial: 'Trial',
    standard: 'Standard',
    pro: 'Pro',
    super: 'Top',
  };
  return plan ? labels[plan] : '';
};

const ScenarioGeneratorModal: React.FC<ScenarioGeneratorModalProps> = ({
  open,
  category,
  userId,
  userEmail,
  currentLevel,
  onClose,
  onCreated,
}) => {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [intent, setIntent] = useState('');
  const [status, setStatus] = useState<ScenarioGenerationStatus | null>(null);
  const [generated, setGenerated] = useState<ScenarioGenerationResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const testStatus = useMemo(
    () => getScenarioGenerationTestStatus(userEmail, currentLevel),
    [userEmail, currentLevel],
  );
  const hasScenarioGenerationTestAccess = Boolean(testStatus);

  useEffect(() => {
    if (!open) return;

    setGenerated(null);
    setError(null);
    setIsLoadingStatus(true);
    getScenarioGenerationStatus()
      .then((remoteStatus) => {
        setStatus(testStatus ?? remoteStatus);
      })
      .catch((loadError) => {
        console.error('[ScenarioGeneratorModal] Failed to load scenario generation status:', loadError);
        if (testStatus) {
          setStatus(testStatus);
          return;
        }
        setStatus(null);
        setError(isEnglish
          ? 'Could not load your scenario generation limits.'
          : 'Nao foi possivel carregar seus limites de geracao de cenario.');
      })
      .finally(() => setIsLoadingStatus(false));
  }, [open, isEnglish, testStatus]);

  if (!open) return null;

  const manualRemaining = status?.manualRemainingToday ?? 0;
  const manualAvailable = manualRemaining > 0;
  const intentIsValid = intent.trim().length >= 12;
  const manualPlanLocked = status?.plan === 'free';
  const manualLevelLocked = Boolean(status && status.plan !== 'free' && status.currentLevel < status.manualRequiredLevel);
  const lockedTitle = manualPlanLocked
    ? (isEnglish ? 'Custom scenarios are a paid feature' : 'Cenários personalizados são um recurso pago')
    : manualLevelLocked
      ? (isEnglish ? `Unlocks at level ${status?.manualRequiredLevel}` : `Libera no nível ${status?.manualRequiredLevel}`)
      : (isEnglish ? 'Daily limit reached' : 'Limite diário atingido');
  const lockedDescription = manualPlanLocked
    ? (isEnglish
      ? 'Ready-made scenarios stay available. AI-created custom scenarios are included in paid plans because each generation uses model credits.'
      : 'Os cenários prontos continuam disponíveis. A criação personalizada com IA fica nos planos pagos porque cada geração usa créditos de modelo.')
    : manualLevelLocked
      ? (isEnglish
        ? 'Keep practicing in text chat to level up and unlock custom scenario creation.'
        : 'Continue praticando no chat de texto para subir de nível e liberar a criação personalizada.')
      : (isEnglish
        ? 'Your custom scenario limit renews tomorrow. You can still practice with ready-made scenarios today.'
        : 'Seu limite de criação personalizada renova amanhã. Hoje você ainda pode praticar com os cenários prontos.');

  const handleGenerate = async () => {
    if (!intentIsValid || !manualAvailable || isGenerating || !status) return;

    setError(null);
    setIsGenerating(true);
    try {
      const result = hasScenarioGenerationTestAccess
        ? await adaptationService.generateManualScenarioForTestAccess({
            category,
            intent: intent.trim(),
            entitlements: status,
          })
        : await adaptationService.generateManualScenario({
            userId,
            category,
            intent: intent.trim(),
          });
      setGenerated(result);
      setStatus(result.entitlements);
    } catch (generationError) {
      if (generationError instanceof ScenarioGenerationApiError) {
        if (generationError.entitlements) {
          setStatus(generationError.entitlements);
        }
        setError(generationError.message);
      } else {
        setError(isEnglish
          ? 'The scenario could not be generated. Please try again.'
          : 'Não foi possível gerar o cenário. Tente novamente.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (startNow: boolean) => {
    if (!generated || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const savedScenario = await adaptationService.saveGeneratedScenario({
        userId,
        category,
        draft: generated.scenario,
        requiredLevel: generated.requiredLevel,
        generationSource: 'manual',
      });

      if (!savedScenario) {
        throw new Error('Scenario save failed');
      }

      onCreated(savedScenario, startNow);
      onClose();
    } catch (saveError) {
      console.error('[ScenarioGeneratorModal] Failed to save generated scenario:', saveError);
      setError(isEnglish
        ? 'The scenario was generated but could not be saved.'
        : 'O cenário foi gerado, mas não foi possível salvá-lo.');
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md md:pl-[240px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isGenerating && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scenario-generator-title"
        className="bv-card animate-fade-up flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden shadow-2xl"
        style={{ border: '1px solid var(--border-mid)', background: 'var(--bg-card)' }}
      >
        <header
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: 'var(--accent-purple)', color: '#fff' }}
            >
              <Wand2 size={19} />
            </div>
            <div>
              <h2 id="scenario-generator-title" className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {isEnglish ? 'Create a custom scenario' : 'Criar cenário personalizado'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {category === 'learn'
                  ? (isEnglish ? 'Build a focused learning module.' : 'Crie um módulo de aprendizado focado.')
                  : (isEnglish ? 'Build a practical real-life simulation.' : 'Crie uma simulação prática de vida real.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating || isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/5 disabled:opacity-40"
            style={{ color: 'var(--text-muted)' }}
            aria-label={isEnglish ? 'Close' : 'Fechar'}
          >
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5">
          {isLoadingStatus ? (
            <div className="flex min-h-64 items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm">{isEnglish ? 'Loading your plan...' : 'Carregando seu plano...'}</span>
            </div>
          ) : generated ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-purple2)' }}>
                    {isEnglish ? 'Scenario ready' : 'Cenário pronto'}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {generated.scenario.title}
                  </h3>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    color: generated.requiredLevel <= (status?.currentLevel ?? 1) ? '#34d399' : '#fbbf24',
                    background: generated.requiredLevel <= (status?.currentLevel ?? 1)
                      ? 'rgba(16,185,129,0.12)'
                      : 'rgba(245,158,11,0.12)',
                  }}
                >
                  {isEnglish ? `Level ${generated.requiredLevel}` : `Nível ${generated.requiredLevel}`}
                </span>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {generated.scenario.description}
              </p>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {isEnglish ? 'Practice challenges' : 'Desafios da prática'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {generated.scenario.challenges.map(challenge => (
                    <span
                      key={challenge}
                      className="rounded-full px-3 py-1.5 text-xs"
                      style={{
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-mid)',
                        background: 'var(--bg-card-alt)',
                      }}
                    >
                      {challenge}
                    </span>
                  ))}
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                <section className="rounded-lg p-3" style={{ background: 'var(--bg-card-alt)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {isEnglish ? 'Your role' : 'Seu papel'}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {generated.scenario.studentRole}
                  </p>
                </section>
                <section className="rounded-lg p-3" style={{ background: 'var(--bg-card-alt)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {isEnglish ? 'Tutor role' : 'Papel do tutor'}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {generated.scenario.tutorRole}
                  </p>
                </section>
              </div>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {isEnglish ? 'Useful vocabulary' : 'Vocabulário útil'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {generated.scenario.vocabulary.map(word => (
                    <span
                      key={word}
                      className="rounded-md px-2.5 py-1 text-xs font-semibold"
                      style={{ color: 'var(--accent-purple2)', background: 'rgba(124,92,255,0.12)' }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </section>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setGenerated(null)}
                  disabled={isSaving || (status?.manualRemainingToday ?? 0) <= 0}
                  className="bv-btn-ghost flex flex-1 items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw size={15} />
                  {isEnglish ? 'Generate another' : 'Gerar outra versão'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="bv-btn-ghost flex flex-1 items-center justify-center gap-2 py-3 disabled:opacity-50"
                >
                  <Check size={15} />
                  {isEnglish ? 'Save for later' : 'Salvar para depois'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="bv-btn-primary flex flex-1 items-center justify-center gap-2 py-3 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {isEnglish ? 'Start now' : 'Começar agora'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2.5"
                style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-purple2)' }} />
                  <span>
                    {isEnglish ? 'Plan' : 'Plano'}: <strong>{getPlanLabel(status?.plan, i18n.language)}</strong>
                  </span>
                </div>
                <span className="text-xs font-semibold" style={{ color: manualAvailable ? '#34d399' : '#fbbf24' }}>
                  {manualAvailable
                    ? (isEnglish ? `${manualRemaining} generation(s) left today` : `${manualRemaining} geração(ões) restante(s) hoje`)
                    : (isEnglish ? 'Manual generation unavailable' : 'Geração manual indisponível')}
                </span>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {isEnglish ? 'What do you want to practice?' : 'O que você quer praticar?'}
                </label>
                <textarea
                  value={intent}
                  onChange={event => setIntent(event.target.value.slice(0, 500))}
                  disabled={!manualAvailable || isGenerating}
                  rows={5}
                  placeholder={isEnglish
                    ? 'Example: I have a job interview at a tech startup next week...'
                    : 'Exemplo: Tenho uma entrevista em uma startup de tecnologia na próxima semana...'}
                  className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    color: 'var(--text-primary)',
                    background: 'var(--bg-card-alt)',
                    borderColor: 'var(--border-mid)',
                  }}
                />
                <div className="mt-1 flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{isEnglish ? 'Be specific about the situation and goal.' : 'Seja específico sobre a situação e o objetivo.'}</span>
                  <span>{intent.length}/500</span>
                </div>
              </div>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {isEnglish ? 'Popular use cases' : 'Ideias populares'}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {POPULAR_INTENTS.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.labelEn}
                        type="button"
                        disabled={!manualAvailable || isGenerating}
                        onClick={() => setIntent(isEnglish ? item.promptEn : item.promptPt)}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors hover:border-violet-500/50 disabled:opacity-40"
                        style={{
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-card-alt)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <Icon size={15} style={{ color: 'var(--accent-purple2)' }} />
                        <span>{isEnglish ? item.labelEn : item.labelPt}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {!manualAvailable && (
                <div
                  className="flex items-start gap-3 rounded-lg border p-3"
                  style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.08)' }}
                >
                  <Lock size={18} className="mt-0.5 shrink-0 text-amber-400" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-300">
                      {lockedTitle}
                    </p>
                    <p className="mt-1 text-xs text-amber-200/70">
                      {lockedDescription}
                    </p>
                  </div>
                  {status?.plan === 'free' && (
                    <button
                      type="button"
                      onClick={() => { window.location.hash = '#/plans'; onClose(); }}
                      className="rounded-md bg-amber-400 px-3 py-2 text-xs font-bold text-gray-950"
                    >
                      {isEnglish ? 'View plans' : 'Ver planos'}
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!intentIsValid || !manualAvailable || isGenerating}
                className="bv-btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGenerating ? <Loader2 size={17} className="animate-spin" /> : <Wand2 size={17} />}
                {isGenerating
                  ? (isEnglish ? 'Building your scenario...' : 'Criando seu cenário...')
                  : (isEnglish ? 'Generate preview' : 'Gerar prévia')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ScenarioGeneratorModal;
