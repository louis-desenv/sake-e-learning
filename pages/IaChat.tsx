import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TextChatUI from '../components/TextChatUI';
import VoiceChatUI from '../components/VoiceChatUI';
import { practiceTopicSlugs, getScenarioFromSlug, getTopicBySlug, topicSlugs } from '../constants/topicSlugs';
import { useUser } from '../context/UserContext';
import { scenarioService, Scenario } from '../services/scenarioService';
import {
  Lock, Trash2, Route, Infinity, Clock, Wand2, ChevronRight,
  Phone, Briefcase, Plane, Users, BookOpen, Mic, Languages, MessageSquare,
  Coffee, UtensilsCrossed, Home, Handshake, Fish, ShoppingCart, Dumbbell,
  ChevronLeft,
} from 'lucide-react';
import { useGamification } from '../gamification/hooks/useGamification';
import { getScenarioIcon } from '../utils/iconSelector';
import ScenarioGeneratorModal from '../components/ScenarioGeneratorModal';

// ============================================================================
// GUIDED LEARNING TOPIC IDS
// ============================================================================
const guidedLearningTopicIds = ['grammar-essentials', 'vocabulary-builder', 'pronunciation-practice', 'business-english', 'travel-phrases', 'idioms-slang'];

// ============================================================================
// ICON & GRADIENT MAPS
// ============================================================================
const ICON_GRADIENTS: Record<string, string> = {
  'phone-screen':         'linear-gradient(135deg,#3b82f6,#7c5cff)',
  'job-interviews':       'linear-gradient(135deg,#f59e0b,#ef4444)',
  'travel-conversations': 'linear-gradient(135deg,#00d4a8,#3b82f6)',
  'business-meetings':    'linear-gradient(135deg,#a855f7,#ec4899)',
  'grammar-essentials':   'linear-gradient(135deg,#7c5cff,#ff4d6d)',
  'vocabulary-builder':   'linear-gradient(135deg,#00d4a8,#3b82f6)',
  'pronunciation-practice':'linear-gradient(135deg,#a855f7,#ec4899)',
  'business-english':     'linear-gradient(135deg,#f59e0b,#f97316)',
  'travel-phrases':       'linear-gradient(135deg,#ef4444,#f97316)',
  'idioms-slang':         'linear-gradient(135deg,#7c5cff,#9b7dff)',
};

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg,#3b82f6,#7c5cff)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#00d4a8,#3b82f6)',
  'linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#7c5cff,#ff4d6d)',
];

const TOPIC_ICONS: Record<string, React.ElementType> = {
  'phone-screen':          Phone,
  'job-interviews':        Briefcase,
  'travel-conversations':  Plane,
  'business-meetings':     Handshake,
  'grammar-essentials':    BookOpen,
  'vocabulary-builder':    Languages,
  'pronunciation-practice': Mic,
  'business-english':      Briefcase,
  'travel-phrases':        Plane,
  'idioms-slang':          MessageSquare,
};

// ============================================================================
// TIMELINE SCENARIO ITEM
// ============================================================================
interface ScenarioItemProps {
  scenario: any;
  index: number;
  category: string;
  isLast: boolean;
  onDelete?: (e: React.MouseEvent, id: string) => void;
}

const ScenarioTimelineItem: React.FC<ScenarioItemProps> = ({ scenario: s, index, category, isLast, onDelete }) => {
  const { t } = useTranslation();
  const IconComp: React.ElementType = s.user_id ? getScenarioIcon(s.title, s.description) : (TOPIC_ICONS[s.id] || MessageSquare);
  const gradient = ICON_GRADIENTS[s.id] ?? FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];

  if (s.is_locked) {
    return (
      <div style={{ position: 'relative', paddingLeft: 70, paddingBottom: isLast ? 0 : 8 }}>
        {/* Vertical line */}
        {!isLast && (
          <div style={{
            position: 'absolute', left: 25, top: 52, bottom: 0,
            width: 2, background: 'var(--border-subtle)',
          }} />
        )}

        {/* Icon circle — locked */}
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: 50, height: 50, borderRadius: '50%',
          background: 'var(--bg-card-alt)',
          border: '1px solid var(--border-mid)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          filter: 'grayscale(1)', opacity: 0.35,
        }}>
          <IconComp size={20} color="var(--text-muted)" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div style={{ padding: '8px 0 8px 4px', opacity: 0.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</p>
            <Lock size={14} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{s.description}</p>
          {s.required_level > 1 && (
            <span style={{
              display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700,
              background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)',
              color: 'var(--accent-purple2)', borderRadius: 99, padding: '2px 8px',
            }}>
              {t('realLifePage.levelRequired', { level: s.required_level, defaultValue: `Nível ${s.required_level} necessário` })}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 70, paddingBottom: isLast ? 0 : 8 }}>
      {/* Vertical line */}
      {!isLast && (
        <div style={{
          position: 'absolute', left: 25, top: 52, bottom: 0,
          width: 2,
          background: 'linear-gradient(to bottom, var(--accent-purple), var(--border-subtle))',
        }} />
      )}

      {/* Icon circle — unlocked */}
      <div style={{
        position: 'absolute', left: 0, top: 0,
        width: 50, height: 50, borderRadius: '50%',
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}>
        <IconComp size={22} color="#fff" strokeWidth={1.75} />
      </div>

      {/* Content row */}
      <Link
        to={`/${category}/${s.slug}`}
        style={{ display: 'block', textDecoration: 'none' }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            transition: 'background 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)';
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-mid)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)';
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</p>
                {s.user_id && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: 0,
                    background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)',
                    color: 'var(--accent-purple2)', borderRadius: 99, padding: '1px 6px', textTransform: 'uppercase',
                  }}>
                    {t('realLifePage.new', { defaultValue: 'NOVO' })}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.description}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
              {s.user_id && onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(e, s.id);
                  }}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 0, borderRadius: 10,
                    minWidth: 40, minHeight: 40, justifyContent: 'center',
                    display: 'flex', alignItems: 'center',
                    position: 'relative',
                    zIndex: 2,
                  }}
                  title={t('realLifePage.deleteScenarioTitle', { defaultValue: 'Deletar cenário' })}
                >
                  <Trash2 size={14} />
                </button>
              )}
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          </div>

          {/*
            Scenario progress bar disabled for now.
            Previous UI kept here for later:

            {s.progress > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="bv-progress-bg">
                  <div className="bv-progress-fill" style={{ width: `${s.progress}%` }} />
                </div>
              </div>
            )}
          */}
        </div>
      </Link>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const IaChat: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { scenarioSlug, topicSlug } = params;

  const slug = scenarioSlug || topicSlug;
  const isGuidedLearning = location.pathname.startsWith('/guided-learning/');
  const category = isGuidedLearning ? 'learn' : 'real-life';

  const mode = location.state?.mode;
  const topic = location.state?.topic;

  const { user } = useUser();
  const userId = user?.id || user?.name || 'guest';

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [slugNotFound, setSlugNotFound] = useState(false);
  const [scenarioLoaded, setScenarioLoaded] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [scenarioGeneratorOpen, setScenarioGeneratorOpen] = useState(false);
  const [scenarioPage, setScenarioPage] = useState(1);
  const scenarioPageSize = 6;

  const { topicAccess, level } = useGamification();

  useEffect(() => {
    if (slug) {
      loadSingleScenario(slug);
    } else {
      setActiveScenario(null);
      setSlugNotFound(false);
      setScenarioLoaded(false);
      if (!topic && mode !== 'voice') {
        loadScenarios();
      }
    }
  }, [category, userId, slug, topic, mode]);

  useEffect(() => {
    setScenarioPage(1);
  }, [scenarios.length, category]);

  const loadSingleScenario = async (slugToLoad: string) => {
    setLoading(true);
    setScenarioLoaded(false);
    try {
      const result = await scenarioService.getScenarioBySlug(slugToLoad, userId);
      if (result) {
        setActiveScenario(result);
        setScenarioLoaded(true);
      } else {
        const staticTopic = getTopicBySlug(slugToLoad);
        if (staticTopic) {
          const staticScenario: Scenario = {
            id: staticTopic.id,
            user_id: null,
            category: isGuidedLearning ? 'learn' : 'real-life',
            title: t(`scenarios.${staticTopic.id}.title`, { defaultValue: staticTopic.title }),
            description: t(`scenarios.${staticTopic.id}.description`, { defaultValue: staticTopic.description }),
            slug: staticTopic.slug,
            scenario_id: staticTopic.scenarioId,
            system_prompt: null,
            is_locked: false,
            required_messages: 0,
            created_at: new Date().toISOString(),
          };
          setActiveScenario(staticScenario);
          setScenarioLoaded(true);
        } else {
          setSlugNotFound(true);
        }
      }
    } catch (error) {
      console.error('Failed to load scenario by slug', error);
      setSlugNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = async () => {
    if (userId === 'guest') return;
    setLoading(true);
    try {
      const result = await scenarioService.getScenarios(userId, category, 1, 100);
      setScenarios(result.data);
    } catch (error) {
      console.error('Failed to load scenarios', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScenario = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDeleteScenario = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      setLoading(true);
      const success = await scenarioService.deleteScenario(id);
      if (success) {
        await loadScenarios();
      } else {
        alert(t('iaChatPage.deleteError'));
      }
    } catch (error) {
      console.error('Failed to delete scenario', error);
      alert(t('realLifePage.deleteGenericError', { defaultValue: 'Erro ao deletar cenário.' }));
    } finally {
      setLoading(false);
    }
  };

  // ─── Voice mode ─────────────────────────────────────────────────────────────
  if (mode === 'voice') {
    return (
      <div className="bv-page" style={{ padding: '20px 20px 90px' }}>
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('iaChatPage.avatarTitle')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{t('iaChatPage.avatarDesc')}</p>
        </header>
        <VoiceChatUI />
      </div>
    );
  }

  // ─── Single scenario (by slug) ───────────────────────────────────────────────
  if (slug) {
    if (loading || !scenarioLoaded) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid var(--accent-purple)',
            borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      );
    }

    if (slugNotFound || !activeScenario) {
      return <Navigate to={isGuidedLearning ? '/guided-learning' : '/real-life'} replace />;
    }

    const backTo = isGuidedLearning ? '/guided-learning' : '/real-life';
    const requiredLevel = activeScenario.required_level ?? 1;
    if (activeScenario.user_id && requiredLevel > level) {
      return (
        <div className="bv-page flex min-h-[70vh] items-center justify-center px-5">
          <div className="bv-card w-full max-w-sm p-6 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--accent-purple2)' }}
            >
              <Lock size={24} />
            </div>
            <h2 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>
              {t('realLifePage.generatedLockedTitle', { defaultValue: 'Cenário bloqueado por nível' })}
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('realLifePage.generatedLockedDescription', {
                level: requiredLevel,
                defaultValue: `Continue praticando para desbloquear este cenário no nível ${requiredLevel}.`,
              })}
            </p>
            <button type="button" className="bv-btn-primary mt-5 w-full py-3" onClick={() => navigate(backTo)}>
              {t('common.back', { defaultValue: 'Voltar' })}
            </button>
          </div>
        </div>
      );
    }
    const staticTopic = topicSlugs.find(t =>
      t.slug === activeScenario.slug ||
      t.id === activeScenario.slug ||
      t.scenarioId === activeScenario.scenario_id
    );
    const translationId = staticTopic ? staticTopic.id : activeScenario.id;

    const topicConfig = {
      id: activeScenario.id,
      slug: activeScenario.slug,
      scenarioId: activeScenario.scenario_id as any,
      title: t(`scenarios.${translationId}.title`, { defaultValue: activeScenario.title }),
      description: t(`scenarios.${translationId}.description`, { defaultValue: activeScenario.description }),
      goal: '',
      progress: 0,
      borderColor: 'border-t-purple-500',
      progressColor: 'bg-purple-500',
      gradientFrom: 'from-purple-400',
      gradientTo: 'to-purple-600',
    };

    return (
      <div className="max-w-4xl mx-auto w-full h-[calc(100dvh-105px)] md:h-[88vh] md:my-auto flex flex-col overflow-hidden px-4 pt-2 pb-2 md:pt-8 md:pb-4">
        <TextChatUI
          scenario={activeScenario.scenario_id as any}
          topicConfig={topicConfig}
          backTo={backTo}
          customSystemPrompt={activeScenario.system_prompt || undefined}
        />
      </div>
    );
  }

  // ─── Legacy state navigation ────────────────────────────────────────────────
  if (topic) {
    const selectedTopic = topicSlugs.find(t => t.id === topic);
    const scenario = getScenarioFromSlug(topic);
    if (selectedTopic && scenario) {
      const isGuided = guidedLearningTopicIds.includes(selectedTopic.id);
      const backTo = isGuided ? '/guided-learning' : '/real-life';
      return (
        <div className="max-w-4xl mx-auto w-full h-[calc(100dvh-105px)] md:h-[88vh] md:my-auto flex flex-col overflow-hidden px-4 pt-2 pb-2 md:pt-8 md:pb-4">
          <TextChatUI scenario={scenario} />
        </div>
      );
    }
  }

  // ─── Scenario list ───────────────────────────────────────────────────────────
  const allScenarios = [
    ...practiceTopicSlugs.map(topicItem => {
      const dbMatch = scenarios.find(s => s.slug === topicItem.slug);
      const access = topicAccess.find(a => a.topicId === topicItem.id);
      const requiredLevel = access ? access.requiredLevel : 1;
      const isStaticUnlocked = level >= requiredLevel;
      return {
        id: topicItem.id,
        user_id: null,
        category: 'real-life',
        title: t(`scenarios.${topicItem.id}.title`, { defaultValue: topicItem.title }),
        description: t(`scenarios.${topicItem.id}.description`, { defaultValue: topicItem.description }),
        slug: topicItem.slug,
        scenario_id: topicItem.scenarioId,
        system_prompt: null,
        is_locked: !isStaticUnlocked,
        required_level: requiredLevel,
        xp_required: access ? access.xpRequired : 0,
        required_messages: dbMatch ? dbMatch.required_messages : 0,
        created_at: dbMatch ? dbMatch.created_at : new Date().toISOString(),
        goal: t(`scenarios.${topicItem.id}.goal`, { defaultValue: topicItem.goal }),
        progress: topicItem.progress,
        borderColor: topicItem.borderColor,
        progressColor: topicItem.progressColor,
      };
    }),
    ...scenarios.filter(s => s.user_id !== null).map(s => {
      const staticTopic = topicSlugs.find(t =>
        t.slug === s.slug || t.id === s.slug || t.scenarioId === s.scenario_id
      );
      return {
        ...s,
        title: staticTopic ? t(`scenarios.${staticTopic.id}.title`, { defaultValue: s.title }) : s.title,
        description: staticTopic ? t(`scenarios.${staticTopic.id}.description`, { defaultValue: s.description }) : s.description,
        goal: t('realLifePage.adaptiveChallenge', { defaultValue: 'Desafio Adaptativo' }),
        progress: 0,
        borderColor: 'border-t-indigo-500',
        progressColor: 'bg-indigo-500',
        is_locked: (s.required_level ?? 1) > level,
        required_level: s.required_level ?? 1,
        xp_required: 0,
      };
    }),
  ];

  const filteredScenarios = allScenarios;
  const scenarioPageCount = Math.max(1, Math.ceil(filteredScenarios.length / scenarioPageSize));
  const safeScenarioPage = Math.min(scenarioPage, scenarioPageCount);
  const paginatedScenarios = filteredScenarios.slice(
    (safeScenarioPage - 1) * scenarioPageSize,
    safeScenarioPage * scenarioPageSize,
  );
  const paginationStart = filteredScenarios.length === 0 ? 0 : (safeScenarioPage - 1) * scenarioPageSize + 1;
  const paginationEnd = Math.min(safeScenarioPage * scenarioPageSize, filteredScenarios.length);

  return (
    <div id="tour-real-life-page" className="bv-page animate-fade-up" style={{ padding: '0 0 90px' }}>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('realLifePage.title', { defaultValue: 'Trilha Real Life' })}
          </h1>
          <button
            id="tour-scenario-generator"
            type="button"
            onClick={() => setScenarioGeneratorOpen(true)}
            className="bv-btn-primary flex items-center gap-2 px-3 py-2 text-xs min-h-10"
          >
            <Wand2 size={14} />
            <span className="hidden sm:inline">
              {t('realLifePage.createScenario', { defaultValue: 'Criar cenário' })}
            </span>
          </button>
        </div>

        {/* Info pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 99, padding: '5px 12px', fontSize: 12, color: 'var(--text-muted)',
          }}>
            <Route size={12} />
            {t('realLifePage.bullet1Short', { defaultValue: 'Trilhe o caminho à fluência' })}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 99, padding: '5px 12px', fontSize: 12, color: 'var(--text-muted)',
          }}>
            <Infinity size={12} />
            {t('realLifePage.bullet3Short', { defaultValue: 'Módulos ilimitados' })}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)',
            borderRadius: 99, padding: '5px 12px', fontSize: 12, color: 'var(--accent-purple2)',
          }}>
            <Languages size={12} />
            {t('realLifePage.bullet2', { defaultValue: 'Simule vocabulário e expressões de nativos como se morasse no exterior' })}
          </span>
        </div>

        {/* Level indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('realLifePage.level', { defaultValue: 'Cenários' })}
          </p>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {allScenarios.filter(s => !s.is_locked).length}/{allScenarios.length}
          </span>
        </div>
      </div>

      {/* ── TIMELINE ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid var(--accent-purple)',
            borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      ) : (
        <div id="tour-scenario-list" style={{ padding: '0 20px' }}>
          {paginatedScenarios.length === 0 ? (
            <div className="bv-card" style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {t('realLifePage.noScenariosFound', { defaultValue: 'Nenhum cenario encontrado.' })}
            </div>
          ) : (
            paginatedScenarios.map((s, i) => (
              <ScenarioTimelineItem
                key={s.id}
                scenario={s}
                index={(safeScenarioPage - 1) * scenarioPageSize + i}
                category={category}
                isLast={i === paginatedScenarios.length - 1}
                onDelete={s.user_id ? handleDeleteScenario : undefined}
              />
            ))
          )}
          <div className="bv-pagination">
            <span className="bv-pagination-info">
              {paginationStart}-{paginationEnd} / {filteredScenarios.length}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="bv-pagination-btn"
                onClick={() => setScenarioPage(page => Math.max(1, page - 1))}
                disabled={safeScenarioPage <= 1}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                {safeScenarioPage} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {scenarioPageCount}</span>
              </span>
              <button
                type="button"
                className="bv-pagination-btn"
                onClick={() => setScenarioPage(page => Math.min(scenarioPageCount, page + 1))}
                disabled={safeScenarioPage >= scenarioPageCount}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────── */}
      <ScenarioGeneratorModal
        open={scenarioGeneratorOpen}
        category="real-life"
        userId={userId}
        userEmail={user?.email}
        activePlanType={user?.activePlan?.type}
        isInTrial={user?.isInTrial}
        currentLevel={level}
        onClose={() => setScenarioGeneratorOpen(false)}
        onCreated={(createdScenario, startNow) => {
          setScenarios(current => [...current, createdScenario]);
          if (startNow) navigate(`/real-life/${createdScenario.slug}`);
        }}
      />

      {deleteConfirmId && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="bv-card animate-fade-up" style={{
            padding: 24, maxWidth: 320, width: '90%', textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Trash2 size={24} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              {t('realLifePage.deleteTitle', { defaultValue: 'Deletar Cenário?' })}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              {t('realLifePage.deleteConfirm', { defaultValue: 'Esta ação não pode ser desfeita.' })}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="bv-btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirmId(null)}>
                {t('realLifePage.cancel', { defaultValue: 'Cancelar' })}
              </button>
              <button
                onClick={confirmDeleteScenario}
                style={{
                  flex: 1, padding: '10px', borderRadius: 12,
                  background: '#ef4444', color: '#fff', fontWeight: 700,
                  fontSize: 14, border: 'none', cursor: 'pointer',
                }}
              >
                {t('realLifePage.delete', { defaultValue: 'Deletar' })}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default IaChat;
