/**
 * FeatureTour — Multi-Page Spotlight Onboarding Tour
 *
 * Navigates to each real page and spotlights real DOM elements using the
 * box-shadow cutout technique. The tour walks through all main app pages.
 *
 * Steps:
 *  0 – Welcome            (centered card, /home)
 *  1 – Avatar Hero CTA    (/home)         → clickable, navigates to avatar
 *  2 – Trilha Vida Real   (/real-life)    → tour navigates there
 *  3 – Chat de Voz        (/chat/voice-only)
 *  4 – Avatar             (/chat/with-avatar)
 *  5 – Perfil / Config    (/profile)
 *
 * Always auto-opens on localhost; once on production.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Bot, MessageSquare, Mic2, Settings2, Wand2, Flame, Globe, Sun, UserRound,
  Crown, ChevronRight, ChevronLeft, type LucideIcon,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setFeatureTourActive, TOUR_COMPLETED_KEY, TOUR_FORCE_OPEN_KEY } from '../utils/featureTourState';
import { useUser } from '../context/UserContext';
import { authService } from '../services/api';
import { mapApiUserToProfile } from '../utils/authMapping';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Rect { top: number; left: number; width: number; height: number; }

interface TourStep {
  titleKey:       string;
  descKey:        string;
  defaultTitle:   string;
  defaultDesc:    string;
  Icon:           LucideIcon;
  gradient:       string;
  glowColor:      string;
  /** Route to navigate to before spotlighting */
  route:          string;
  /** DOM element ID to spotlight. null = full-page intro */
  targetId:       string | null;
  /** If true, show a secondary CTA that navigates to ctaRoute */
  isInteractive?: boolean;
  ctaLabel?:      string;
  ctaRoute?:      string;
  openProfileSettings?: boolean;
  tooltipSide?:   'below' | 'above' | 'center';
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Definitions
// ─────────────────────────────────────────────────────────────────────────────

const STEPS: TourStep[] = [
  {
    titleKey:    'dashboard.tour.step0Title',
    descKey:     'dashboard.tour.step0Desc',
    defaultTitle: 'Bem-vindo ao FlowSpeak',
    defaultDesc:  'Conheça as principais áreas do aplicativo e onde começar sua prática.',
    Icon:        Sparkles,
    gradient:    'linear-gradient(135deg,#a855f7,#ec4899)',
    glowColor:   'rgba(168,85,247,0.4)',
    route:       '/home',
    targetId:    null,
    tooltipSide: 'center',
  },
  {
    titleKey:    'dashboard.tour.progressTitle',
    descKey:     'dashboard.tour.progressDesc',
    defaultTitle: 'Nível e progresso',
    defaultDesc:  'Seu XP define o nível atual e libera novos recursos e cenários.',
    Icon:        Sparkles,
    gradient:    'linear-gradient(135deg,#f59e0b,#ef4444)',
    glowColor:   'rgba(245,158,11,0.4)',
    route:       '/home',
    targetId:    'tour-xp-progress',
    tooltipSide: 'below',
  },
  {
    titleKey:    'dashboard.tour.streakTitle',
    descKey:     'dashboard.tour.streakDesc',
    defaultTitle: 'Sequência semanal',
    defaultDesc:  'Acompanhe os dias praticados e mantenha uma rotina consistente durante a semana.',
    Icon:        Flame,
    gradient:    'linear-gradient(135deg,#f97316,#ef4444)',
    glowColor:   'rgba(249,115,22,0.4)',
    route:       '/home',
    targetId:    'tour-weekly-streak',
    tooltipSide: 'above',
  },
  {
    titleKey:    'dashboard.tour.avatarHeroTitle',
    descKey:     'dashboard.tour.avatarHeroDesc',
    defaultTitle: 'Tutor com Avatar',
    defaultDesc:  'Esta é a experiência mais imersiva para treinar fala e escuta com um tutor visual.',
    Icon:        Bot,
    gradient:    'linear-gradient(135deg,#ec4899,#f97316)',
    glowColor:   'rgba(236,72,153,0.4)',
    route:       '/home',
    targetId:    'tour-avatar-hero',
    tooltipSide: 'below',
  },
  {
    titleKey:    'dashboard.tour.quickAccessTitle',
    descKey:     'dashboard.tour.quickAccessDesc',
    defaultTitle: 'Acesso rápido',
    defaultDesc:  'Use estes atalhos para abrir cenários, voz, planos e perfil sem procurar pelos menus.',
    Icon:        Sparkles,
    gradient:    'linear-gradient(135deg,#7c5cff,#0ea5e9)',
    glowColor:   'rgba(124,92,255,0.4)',
    route:       '/home',
    targetId:    'tour-quick-access',
    tooltipSide: 'above',
  },
  {
    titleKey:    'dashboard.tour.step2Title',
    descKey:     'dashboard.tour.step2Desc',
    defaultTitle: 'Cenários da vida real',
    defaultDesc:  'Pratique situações concretas e desbloqueie atividades de acordo com seu nível.',
    Icon:        MessageSquare,
    gradient:    'linear-gradient(135deg,#0ea5e9,#6366f1)',
    glowColor:   'rgba(14,165,233,0.4)',
    route:       '/real-life',
    targetId:    'tour-real-life-page',
    tooltipSide: 'center',
  },
  {
    titleKey:    'dashboard.tour.scenarioListTitle',
    descKey:     'dashboard.tour.scenarioListDesc',
    defaultTitle: 'Caminho de cenários',
    defaultDesc:  'Cada cenário informa o nível necessário. Os cadeados continuam valendo fora do tour.',
    Icon:        MessageSquare,
    gradient:    'linear-gradient(135deg,#0ea5e9,#6366f1)',
    glowColor:   'rgba(14,165,233,0.4)',
    route:       '/real-life',
    targetId:    'tour-scenario-list',
    tooltipSide: 'above',
  },
  {
    titleKey:    'dashboard.tour.generatorTitle',
    descKey:     'dashboard.tour.generatorDesc',
    defaultTitle: 'Gerador personalizado',
    defaultDesc:  'Descreva o que deseja praticar e crie um cenário adaptado ao seu plano e nível.',
    Icon:        Wand2,
    gradient:    'linear-gradient(135deg,#8b5cf6,#ec4899)',
    glowColor:   'rgba(139,92,246,0.4)',
    route:       '/real-life',
    targetId:    'tour-scenario-generator',
    tooltipSide: 'below',
  },
  {
    titleKey:    'dashboard.tour.step4Title',
    descKey:     'dashboard.tour.step4Desc',
    defaultTitle: 'Chat de voz',
    defaultDesc:  'Converse em tempo real e acompanhe o limite diário disponível no seu plano.',
    Icon:        Mic2,
    gradient:    'linear-gradient(135deg,#10b981,#0ea5e9)',
    glowColor:   'rgba(16,185,129,0.4)',
    route:       '/chat/voice-only',
    targetId:    'tour-voice-page',
    tooltipSide: 'center',
  },
  {
    titleKey:    'dashboard.tour.step3Title',
    descKey:     'dashboard.tour.step3Desc',
    defaultTitle: 'Tutor com avatar',
    defaultDesc:  'Pratique uma conversa imersiva com avatar quando o recurso estiver liberado.',
    Icon:        Bot,
    gradient:    'linear-gradient(135deg,#ec4899,#f97316)',
    glowColor:   'rgba(236,72,153,0.4)',
    route:       '/chat/with-avatar',
    targetId:    'tour-avatar-page',
    tooltipSide: 'center',
  },
  {
    titleKey:    'dashboard.tour.profileOverviewTitle',
    descKey:     'dashboard.tour.profileOverviewDesc',
    defaultTitle: 'Seu perfil e evolução',
    defaultDesc:  'Aqui você acompanha nível, XP, sequência, tempo praticado, desempenho semanal e histórico de atividades.',
    Icon:        UserRound,
    gradient:    'linear-gradient(135deg,#7c5cff,#0ea5e9)',
    glowColor:   'rgba(124,92,255,0.4)',
    route:       '/profile',
    targetId:    'tour-profile-overview',
    openProfileSettings: false,
    tooltipSide: 'center',
  },
  {
    titleKey:    'dashboard.tour.profileSubscriptionTitle',
    descKey:     'dashboard.tour.profileSubscriptionDesc',
    defaultTitle: 'Assinatura no perfil',
    defaultDesc:  'Veja seu plano atual, trial ou conta gratuita. Por aqui você abre os planos ou gerencia sua assinatura.',
    Icon:        Crown,
    gradient:    'linear-gradient(135deg,#a855f7,#ec4899)',
    glowColor:   'rgba(168,85,247,0.4)',
    route:       '/profile',
    targetId:    'tour-profile-subscription',
    openProfileSettings: false,
    tooltipSide: 'above',
  },
  {
    titleKey:    'dashboard.tour.profileSettingsButtonTitle',
    descKey:     'dashboard.tour.profileSettingsButtonDesc',
    defaultTitle: 'Configurações do perfil',
    defaultDesc:  'Use este botão para alterar preferências de aprendizado, idioma, tema e conta.',
    Icon:        Settings2,
    gradient:    'linear-gradient(135deg,#64748b,#7c5cff)',
    glowColor:   'rgba(124,92,255,0.4)',
    route:       '/profile',
    targetId:    'tour-profile-settings-button',
    openProfileSettings: false,
    tooltipSide: 'below',
  },
  {
    titleKey:    'dashboard.tour.learningSettingsTitle',
    descKey:     'dashboard.tour.learningSettingsDesc',
    defaultTitle: 'Preferências de aprendizado',
    defaultDesc:  'Revise seu nível, idioma nativo, objetivos e meta diária sempre que precisar.',
    Icon:        Settings2,
    gradient:    'linear-gradient(135deg,#f59e0b,#ef4444)',
    glowColor:   'rgba(245,158,11,0.4)',
    route:       '/profile',
    targetId:    'tour-learning-settings',
    openProfileSettings: true,
    tooltipSide: 'below',
  },
  {
    titleKey:    'dashboard.tour.languageSettingsTitle',
    descKey:     'dashboard.tour.languageSettingsDesc',
    defaultTitle: 'Idioma do aplicativo',
    defaultDesc:  'Escolha o idioma usado nos menus, feedbacks e explicações da plataforma.',
    Icon:        Globe,
    gradient:    'linear-gradient(135deg,#0ea5e9,#6366f1)',
    glowColor:   'rgba(14,165,233,0.4)',
    route:       '/profile',
    targetId:    'tour-language-settings',
    openProfileSettings: true,
    tooltipSide: 'below',
  },
  {
    titleKey:    'dashboard.tour.themeSettingsTitle',
    descKey:     'dashboard.tour.themeSettingsDesc',
    defaultTitle: 'Tema visual',
    defaultDesc:  'Alterne entre os temas claro e escuro de acordo com sua preferência.',
    Icon:        Sun,
    gradient:    'linear-gradient(135deg,#f59e0b,#f97316)',
    glowColor:   'rgba(245,158,11,0.4)',
    route:       '/profile',
    targetId:    'tour-theme-settings',
    openProfileSettings: true,
    tooltipSide: 'below',
  },
  {
    titleKey:    'dashboard.tour.accountSettingsTitle',
    descKey:     'dashboard.tour.accountSettingsDesc',
    defaultTitle: 'Conta e assinatura',
    defaultDesc:  'Gerencie sua assinatura e as ações disponíveis para sua conta.',
    Icon:        UserRound,
    gradient:    'linear-gradient(135deg,#7c5cff,#ec4899)',
    glowColor:   'rgba(124,92,255,0.4)',
    route:       '/profile',
    targetId:    'tour-account-settings',
    openProfileSettings: true,
    tooltipSide: 'above',
  },
];

const PAD    = 10;  // padding around spotlight hole
const GUTTER = 18;  // gap between spotlight edge and tooltip

// ─────────────────────────────────────────────────────────────────────────────
// useSpotlightRect — measures & tracks the target DOM element
// ─────────────────────────────────────────────────────────────────────────────

function useSpotlightRect(targetId: string | null, active: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const raf = useRef(0);

  const measure = useCallback(() => {
    if (!targetId) { setRect(null); return; }
    const el = document.getElementById(targetId);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [targetId]);

  useEffect(() => {
    if (!active) { setRect(null); return; }
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Wait for route change + scroll to settle
    const t = setTimeout(measure, 550);
    return () => clearTimeout(t);
  }, [active, targetId, measure]);

  useEffect(() => {
    if (!active) return;
    const onUpdate = () => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(measure); };
    window.addEventListener('resize', onUpdate);
    window.addEventListener('scroll', onUpdate, true);
    return () => {
      window.removeEventListener('resize', onUpdate);
      window.removeEventListener('scroll', onUpdate, true);
      cancelAnimationFrame(raf.current);
    };
  }, [active, measure]);

  return rect;
}

// ─────────────────────────────────────────────────────────────────────────────
// SpotlightBox — box-shadow cutout over the real element
// ─────────────────────────────────────────────────────────────────────────────

const SpotlightBox: React.FC<{ rect: Rect; glowColor: string }> = ({ rect, glowColor }) => (
  <motion.div
    key={`${rect.top}-${rect.left}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.28 }}
    style={{
      position:      'fixed',
      top:           rect.top,
      left:          rect.left,
      width:         rect.width,
      height:        rect.height,
      borderRadius:  16,
      zIndex:        9991,
      pointerEvents: 'none',
      // Giant box-shadow dims everything outside + glowing border
      boxShadow:     `0 0 0 9999px rgba(5,6,15,0.84), 0 0 0 2px rgba(168,85,247,0.8), 0 0 36px ${glowColor}`,
    }}
  />
);

const FullOverlay: React.FC = () => (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(5,6,15,0.82)',
    backdropFilter: 'blur(6px)',
    zIndex: 9990,
    pointerEvents: 'none',
  }} />
);

// ─────────────────────────────────────────────────────────────────────────────
// TooltipCard
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipProps {
  step:      TourStep;
  rect:      Rect | null;
  stepIdx:   number;
  total:     number;
  direction: 1 | -1;
  isLast:    boolean;
  onNext:    () => void;
  onPrev:    () => void;
  onSkip:    () => void;
  onCta:     () => void;
}

const TIP_W = 340;
const TIP_MARGIN = 16;
const TIP_EST_H = 248;

const TooltipCard: React.FC<TooltipProps> = ({
  step, rect, stepIdx, total, direction, isLast, onNext, onPrev, onSkip, onCta,
}) => {
  const { t } = useTranslation();
  const { Icon } = step;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let posStyle: React.CSSProperties;
  const w = Math.min(TIP_W, vw - TIP_MARGIN * 2);

  if (!rect || step.tooltipSide === 'center') {
    posStyle = {
      position:  'fixed',
      top:       Math.max(12, Math.min(vh - TIP_EST_H - 12, vh / 2 - TIP_EST_H / 2)),
      left:      Math.max(TIP_MARGIN, (vw - w) / 2),
      width:     w,
    };
  } else {
    let   tipLeft = rect.left + rect.width / 2 - w / 2;
    tipLeft       = Math.max(TIP_MARGIN, Math.min(tipLeft, vw - w - TIP_MARGIN));
    const below   = rect.top + rect.height + GUTTER;
    const above   = rect.top - TIP_EST_H - GUTTER;
    const tipTop  = below + TIP_EST_H < vh - 12 ? below
                  : above > 12             ? above
                  : Math.max(12, vh / 2 - TIP_EST_H / 2);
    posStyle = { position: 'fixed', top: tipTop, left: tipLeft, width: w };
  }

  const variants = {
    enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 16 : -16 }),
    center: { opacity: 1, y: 0 },
    exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -12 : 12 }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{
          ...posStyle,
          zIndex:       9995,
          background:   'rgba(13,15,24,0.98)',
          border:       '1px solid rgba(139,92,246,0.22)',
          borderRadius: 20,
          boxShadow:    `0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 32px ${step.glowColor}`,
          overflow:     'hidden',
          maxHeight:    'calc(100dvh - 24px)',
        }}
      >
        {/* Top gradient strip */}
        <div style={{ height: 4, background: step.gradient, boxShadow: `0 0 16px ${step.glowColor}` }} />

        <div style={{ padding: '16px 18px', maxHeight: 'calc(100dvh - 28px)', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <motion.div
              key={`icon-${stepIdx}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                background: step.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${step.glowColor}`,
              }}
            >
              <Icon size={18} color="#fff" strokeWidth={1.8} />
            </motion.div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#5a6180', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                {stepIdx + 1} / {total}
              </p>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f0f2ff', margin: '2px 0 0' }}>
                {t(step.titleKey, { defaultValue: step.defaultTitle })}
              </h3>
            </div>

          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: '#a0a8c0', lineHeight: 1.58, margin: '0 0 14px' }}>
            {t(step.descKey, { defaultValue: step.defaultDesc })}
          </p>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                height: 4, borderRadius: 2,
                width: i === stepIdx ? 20 : 6,
                background: i === stepIdx ? '#fff' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Navigation buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(92px,1fr) auto minmax(92px,1fr)',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0 }}>
              {stepIdx > 0 && (
                <button onClick={onPrev} style={{
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                  color: '#a0a8c0', fontSize: 12, fontWeight: 600,
                  padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                  minHeight: 40,
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  <ChevronLeft size={13} /> {t('common.back', { defaultValue: 'Voltar' })}
                </button>
              )}
            </div>

            <button
              onClick={onSkip}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#8f96b2',
                cursor: 'pointer',
                padding: '8px 6px',
                minHeight: 40,
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {t('common.skipTour', { defaultValue: 'Pular tutorial' })}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0 }}>
              {/* Interactive CTA (Avatar Hero step) */}
              {step.isInteractive && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onCta}
                  style={{
                    background: step.gradient, border: 'none', color: '#fff',
                    fontSize: 13, fontWeight: 700,
                    padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                    boxShadow: `0 4px 16px ${step.glowColor}`,
                    display: 'flex', alignItems: 'center', gap: 5,
                    minHeight: 40,
                    animation: 'pulse-tour 2s ease-in-out infinite',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Bot size={14} />
                  {step.ctaLabel}
                </motion.button>
              )}

              <button onClick={onNext} style={{
                background: isLast
                  ? 'linear-gradient(135deg,#10b981,#0ea5e9)'
                  : step.isInteractive
                    ? 'rgba(255,255,255,0.08)'
                    : step.gradient,
                border: step.isInteractive ? '1px solid rgba(255,255,255,0.12)' : 'none',
                color: '#fff', fontSize: 13, fontWeight: 700,
                padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                minHeight: 40,
                boxShadow: isLast ? '0 4px 14px rgba(16,185,129,0.35)' : undefined,
                whiteSpace: 'nowrap',
              }}>
                {isLast
                  ? t('common.start', { defaultValue: 'Começar' })
                  : step.isInteractive
                    ? t('common.skip', { defaultValue: 'Pular' })
                    : t('common.next', { defaultValue: 'Próximo' })}
                {!isLast && !step.isInteractive && <ChevronRight size={13} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const FeatureTour: React.FC = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, updateUser } = useUser();
  const [isOpen, setIsOpen]           = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection]     = useState<1 | -1>(1);
  const [navigating, setNavigating]   = useState(false);

  const step = STEPS[currentStep];

  // Auto-open once after onboarding. The backend flag is the source of truth;
  // localStorage remains only as a fallback for older sessions.
  useEffect(() => {
    const openTour = () => {
      setCurrentStep(0);
      setDirection(1);
      setFeatureTourActive(true);
      setIsOpen(true);
    };

    const onboardingDone = user?.hasCompletedOnboarding === true;
    const shouldForceOpen = onboardingDone && sessionStorage.getItem(TOUR_FORCE_OPEN_KEY) === 'true';
    const shouldAutoOpen = onboardingDone && user?.hasSeenFeatureTour !== true && !localStorage.getItem(TOUR_COMPLETED_KEY);

    if (shouldForceOpen || shouldAutoOpen) {
      const t = setTimeout(() => {
        sessionStorage.removeItem(TOUR_FORCE_OPEN_KEY);
        setFeatureTourActive(true);
        setIsOpen(true);
      }, 900);
      window.addEventListener('flowspeak:open-tour', openTour);
      return () => {
        clearTimeout(t);
        window.removeEventListener('flowspeak:open-tour', openTour);
      };
    }

    window.addEventListener('flowspeak:open-tour', openTour);
    return () => window.removeEventListener('flowspeak:open-tour', openTour);
  }, [user?.hasCompletedOnboarding, user?.hasSeenFeatureTour]);

  // When step changes, navigate to the step's route if different from current
  useEffect(() => {
    if (!isOpen) return;
    const stepRoute = step.route;
    const currentPath = location.pathname;
    if (currentPath !== stepRoute) {
      setNavigating(true);
      navigate(stepRoute);
      // Give the page time to mount
      const t = setTimeout(() => setNavigating(false), 700);
      return () => clearTimeout(t);
    }
    setNavigating(false);
  }, [isOpen, currentStep, step.route, navigate, location.pathname]);

  useEffect(() => {
    if (!isOpen || step.route !== '/profile' || location.pathname !== '/profile') return;
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent(
        step.openProfileSettings
          ? 'flowspeak:open-profile-settings'
          : 'flowspeak:show-profile-overview',
      ));
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, currentStep, location.pathname, step.route]);

  // Track spotlight rect — only active once navigation settled
  const rect = useSpotlightRect(step.targetId, isOpen && !navigating);

  const finish = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setFeatureTourActive(false);
    setIsOpen(false);
    navigate('/home');

    void authService.completeFeatureTour()
      .then((response) => {
        if (response.user) {
          updateUser(mapApiUserToProfile(response.user));
        } else if (user) {
          updateUser({
            ...user,
            hasSeenFeatureTour: true,
            featureTourCompletedAtUtc: new Date().toISOString(),
          });
        }
      })
      .catch((error) => {
        console.warn('Could not persist feature tour completion:', error);
      });
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) { setDirection(1); setCurrentStep(s => s + 1); }
    else finish();
  };

  const prev = () => {
    if (currentStep > 0) { setDirection(-1); setCurrentStep(s => s - 1); }
  };

  const handleCta = () => {
    const s = STEPS[currentStep];
    finish();
    if (s.ctaRoute) navigate(s.ctaRoute);
  };

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const isLast = currentStep === STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes pulse-tour {
          0%,100% { box-shadow: 0 4px 16px rgba(236,72,153,0.4); }
          50%      { box-shadow: 0 4px 28px rgba(236,72,153,0.75); }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 9989 }}
      />

      {/* Overlay */}
      <AnimatePresence mode="wait">
        {rect ? (
          <SpotlightBox key={`rect-${currentStep}`} rect={rect} glowColor={step.glowColor} />
        ) : (
          <FullOverlay key={`full-${currentStep}`} />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <TooltipCard
        step={step}
        rect={rect}
        stepIdx={currentStep}
        total={STEPS.length}
        direction={direction}
        isLast={isLast}
        onNext={next}
        onPrev={prev}
        onSkip={finish}
        onCta={handleCta}
      />
    </>
  );
};

export default FeatureTour;

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHIVED — Previous version: Rich modal with inline feature previews
 * ─────────────────────────────────────────────────────────────────────────────
 * Commit reference: 27f3099 on layout-v2
 * The previous version used a centered modal with WelcomePreview, HomePreview,
 * RealLifePreview, AvatarPreview, VoicePreview, LearningSettingsPreview.
 */
