import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { guidedLearningTopicSlugs, topicSlugs } from '../constants/topicSlugs';
import { useUser } from '../context/UserContext';
import { scenarioService, Scenario } from '../services/scenarioService';
import { Trash2, Lock, Wand2, BookOpen, Mic, Languages, Briefcase, Plane, MessageSquareQuote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGamification } from '../gamification/hooks/useGamification';
import { getScenarioIcon } from '../utils/iconSelector';
import ScenarioGeneratorModal from '../components/ScenarioGeneratorModal';

// ============================================================================
// ICON MAP
// ============================================================================
const TOPIC_ICONS: Record<string, React.ElementType> = {
  'grammar-essentials':    BookOpen,
  'vocabulary-builder':    Languages,
  'pronunciation-practice': Mic,
  'business-english':      Briefcase,
  'travel-phrases':        Plane,
  'idioms-slang':          MessageSquareQuote,
};

const TOPIC_GRADIENTS: Record<string, string> = {
  'grammar-essentials':    'linear-gradient(135deg,#3b82f6,#7c5cff)',
  'vocabulary-builder':    'linear-gradient(135deg,#00d4a8,#3b82f6)',
  'pronunciation-practice':'linear-gradient(135deg,#a855f7,#ec4899)',
  'business-english':      'linear-gradient(135deg,#f59e0b,#f97316)',
  'travel-phrases':        'linear-gradient(135deg,#ef4444,#f97316)',
  'idioms-slang':          'linear-gradient(135deg,#7c5cff,#ff4d6d)',
};

// ============================================================================
// COMPONENT
// ============================================================================

const GuidedLearning: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const navigate = useNavigate();
  const userId = user?.id || user?.name || 'guest';
  const category = 'learn';

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [scenarioGeneratorOpen, setScenarioGeneratorOpen] = useState(false);
  const [scenarioPage, setScenarioPage] = useState(1);
  const scenarioPageSize = 6;

  const { topicAccess, level } = useGamification();

  useEffect(() => { loadScenarios(); }, [userId]);
  useEffect(() => {
    setScenarioPage(1);
  }, [scenarios.length]);

  const loadScenarios = async () => {
    if (userId === 'guest') return;
    setLoading(true);
    try {
      const result = await scenarioService.getScenarios(userId, category, 1, 100);
      setScenarios(result.data);
    } catch (err) {
      console.error('Failed to load scenarios', err);
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
        alert(t('guidedLearningPage.deleteError', { defaultValue: 'Erro ao deletar.' }));
      }
    } catch (err) {
      console.error('Failed to delete scenario', err);
    } finally {
      setLoading(false);
    }
  };

  // Merge static + dynamic
  const allScenarios = [
    ...guidedLearningTopicSlugs.map(topicItem => {
      const dbMatch = scenarios.find(s => s.slug === topicItem.slug);
      const access = topicAccess.find(a => a.topicId === topicItem.id);
      const requiredLevel = access ? access.requiredLevel : 1;
      const isUnlocked = level >= requiredLevel;
      return {
        id: topicItem.id,
        user_id: null,
        category: 'learn',
        title: t(`scenarios.${topicItem.id}.title`, { defaultValue: topicItem.title }),
        description: t(`scenarios.${topicItem.id}.description`, { defaultValue: topicItem.description }),
        slug: topicItem.slug,
        is_locked: !isUnlocked,
        required_level: requiredLevel,
        xp_required: access ? access.xpRequired : 0,
        progress: topicItem.progress,
      };
    }),
    ...scenarios.filter(s => s.user_id !== null).map(s => ({
      ...s,
      title: s.title,
      description: s.description,
      is_locked: (s.required_level ?? 1) > level,
      required_level: s.required_level ?? 1,
      xp_required: 0,
      progress: 0,
    })),
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
    <div className="bv-page animate-fade-up" style={{ padding: '0 0 90px' }}>

      {/* HEADER */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div className="flex items-center justify-between gap-3">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('guidedLearningPage.title', { defaultValue: 'Aprendizado Guiado' })}
          </h1>
          <button
            type="button"
            onClick={() => setScenarioGeneratorOpen(true)}
            className="bv-btn-primary flex items-center gap-2 px-3 py-2 text-xs"
          >
            <Wand2 size={14} />
            <span className="hidden sm:inline">
              {t('guidedLearningPage.createModule', { defaultValue: 'Criar módulo' })}
            </span>
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {t('guidedLearningPage.subtitle', { defaultValue: 'Escolha um tópico para começar.' })}
        </p>
      </div>

      {/* GRID */}
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
        <div className="scenario-card-grid" style={{ padding: '0 20px' }}>
          {paginatedScenarios.length === 0 ? (
            <div className="bv-card" style={{ gridColumn: '1 / -1', padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {t('guidedLearningPage.noModulesFound', { defaultValue: 'Nenhum modulo encontrado.' })}
            </div>
          ) : paginatedScenarios.map(s => {
            const IconComp = s.user_id ? getScenarioIcon(s.title, s.description) : (TOPIC_ICONS[s.id] || BookOpen);
            const gradient = s.user_id
              ? 'linear-gradient(135deg,#7c5cff,#ff4d6d)'
              : (TOPIC_GRADIENTS[s.id] || 'linear-gradient(135deg,#7c5cff,#9b7dff)');

            if (s.is_locked) {
              return (
                <div
                  key={s.id}
                  className="bv-card"
                  style={{ padding: '16px', opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, marginBottom: 10,
                    background: 'var(--bg-card-alt)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    filter: 'grayscale(1)',
                  }}>
                    <IconComp size={20} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 3 }}>{s.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 8 }}>{s.description}</p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700,
                    background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)',
                    color: 'var(--accent-purple2)', borderRadius: 99, padding: '2px 8px',
                  }}>
                    <Lock size={9} /> {t('realLifePage.levelRequired', { level: s.required_level, defaultValue: `Nível ${s.required_level}` })}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={s.id}
                to={`/guided-learning/${s.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="bv-card bv-card-press"
                  style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Icon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}>
                      <IconComp size={20} color="#fff" />
                    </div>
                    {s.user_id && (
                      <button
                        onClick={(e) => handleDeleteScenario(e, s.id)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', padding: 0,
                          minWidth: 40, minHeight: 40, borderRadius: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Labels */}
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {s.title}
                    {s.user_id && (
                      <span style={{
                        marginLeft: 6, fontSize: 9, fontWeight: 700,
                        background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)',
                        color: 'var(--accent-purple2)', borderRadius: 99, padding: '1px 5px',
                        textTransform: 'uppercase',
                      }}>
                        {t('realLifePage.new', { defaultValue: 'NOVO' })}
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, flex: 1 }}>{s.description}</p>

                  {/* Progress */}
                  {s.progress > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div className="bv-progress-bg">
                        <div className="bv-progress-fill" style={{ width: `${s.progress}%` }} />
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                        {s.progress}%
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 4, color: 'var(--text-muted)', fontSize: 12 }}>
            <span>
              {paginationStart}-{paginationEnd} / {filteredScenarios.length}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="bv-btn-ghost"
                onClick={() => setScenarioPage(page => Math.max(1, page - 1))}
                disabled={safeScenarioPage <= 1}
                style={{ minWidth: 44, minHeight: 40, padding: '8px 10px', opacity: safeScenarioPage <= 1 ? 0.45 : 1 }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ minWidth: 54, textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {safeScenarioPage}/{scenarioPageCount}
              </span>
              <button
                type="button"
                className="bv-btn-ghost"
                onClick={() => setScenarioPage(page => Math.min(scenarioPageCount, page + 1))}
                disabled={safeScenarioPage >= scenarioPageCount}
                style={{ minWidth: 44, minHeight: 40, padding: '8px 10px', opacity: safeScenarioPage >= scenarioPageCount ? 0.45 : 1 }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <ScenarioGeneratorModal
        open={scenarioGeneratorOpen}
        category="learn"
        userId={userId}
        userEmail={user?.email}
        activePlanType={user?.activePlan?.type}
        isInTrial={user?.isInTrial}
        currentLevel={level}
        onClose={() => setScenarioGeneratorOpen(false)}
        onCreated={(createdScenario, startNow) => {
          setScenarios(current => [...current, createdScenario]);
          if (startNow) navigate(`/guided-learning/${createdScenario.slug}`);
        }}
      />

      {deleteConfirmId && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="bv-card animate-fade-up" style={{ padding: 24, maxWidth: 300, width: '90%', textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <Trash2 size={22} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              {t('guidedLearningPage.deleteTitle', { defaultValue: 'Deletar tópico?' })}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              {t('guidedLearningPage.deleteConfirm', { defaultValue: 'Esta ação não pode ser desfeita.' })}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="bv-btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirmId(null)}>
                {t('guidedLearningPage.cancel', { defaultValue: 'Cancelar' })}
              </button>
              <button
                onClick={confirmDeleteScenario}
                style={{
                  flex: 1, padding: '10px', borderRadius: 12,
                  background: '#ef4444', color: '#fff', fontWeight: 700,
                  fontSize: 14, border: 'none', cursor: 'pointer',
                }}
              >
                {t('guidedLearningPage.delete', { defaultValue: 'Deletar' })}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GuidedLearning;
