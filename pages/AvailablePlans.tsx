import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import {
  CheckCircle, XCircle, Calendar, ShieldCheck, Zap, Crown,
  ArrowLeft, ArrowRight, Shield, Gift, Clock, Sparkles,
  Star, Lock, MessageSquare, Mic, BookOpen, History, PartyPopper
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { createCheckoutSession } from '../services/paymentApiService';

type BillingCycle = 'annual' | 'monthly';
type PlanType = 'standard' | 'pro' | 'super';

// Plano Top temporariamente oculto. Para reativar, trocar para true.
const SHOW_TOP_PLAN = false;
const PLAN_PRICES_BRL: Record<PlanType, number> = {
  standard: 79,
  pro: 197,
  super: 397,
};

const formatBrl = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const AvailablePlans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const { t, i18n } = useTranslation();
  const [isLightTheme, setIsLightTheme] = useState(false);

  useEffect(() => {
    setSelectedPlan(SHOW_TOP_PLAN ? 'super' : 'pro');
    const checkTheme = () => setIsLightTheme(document.body.classList.contains('light-theme'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Trial state
  const trialDaysLeft = React.useMemo(() => {
    if (!user?.isInTrial || !user?.trialEndDate) return null;
    const diff = new Date(user.trialEndDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [user?.isInTrial, user?.trialEndDate]);

  const isInTrial = !!user?.isInTrial && !user?.activePlan;
  const isPaidUser = !!user?.activePlan;
  const isFreeUser = !isPaidUser && !isInTrial;
  const hasUsedTrial = !!user?.hasUsedTrial;

  const onPurchase = async () => {
    setIsProcessing(true);
    try {
      window.location.href = await createCheckoutSession(selectedPlan, billingCycle);
    } catch (error) {
      console.error('Erro no checkout:', error);
      window.alert(t('plansPage.serverError', { defaultValue: 'Falha ao se comunicar com o servidor de pagamento.' }));
    } finally {
      setIsProcessing(false);
    }
  };

  const isAnnual = billingCycle === 'annual';
  const isStandardSelected = selectedPlan === 'standard';
  const isProSelected = selectedPlan === 'pro';
  const isTopSelected = selectedPlan === 'super';

  const getPriceDisplay = (plan: PlanType) => {
    const monthlyBrl = PLAN_PRICES_BRL[plan];
    const chargedBrl = isAnnual ? monthlyBrl * 12 : monthlyBrl;
    return {
      value: formatBrl(chargedBrl),
      period: isAnnual ? t('plansPage.perYear', { defaultValue: '/ano' }) : t('plansPage.perMonth', { defaultValue: '/mês' }),
      monthly: isAnnual
        ? `${formatBrl(monthlyBrl)}${t('plansPage.perMonth', { defaultValue: '/mês' })} ${t('plansPage.per12Months', { defaultValue: 'por 12 meses' })}`
        : t('plansPage.billingNoticeSecure', { defaultValue: 'Cobrança mensal' }),
    };
  };

  const standardPrice = getPriceDisplay('standard');
  const proPrice = getPriceDisplay('pro');
  const topPrice = getPriceDisplay('super');

  const shimmer = (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
      initial={{ left: '-100%' }}
      animate={{ left: '200%' }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
    />
  );

  const featureRows = [
    { icon: <MessageSquare size={14} />, label: t('plansPage.features.textChat', { defaultValue: 'Chat de Texto' }), free: '10/dia', standard: '100/dia', pro: '500/dia', top: t('plansPage.unlimited', { defaultValue: 'Ilimitado' }) },
    { icon: <Mic size={14} />, label: t('plansPage.features.voiceChat', { defaultValue: 'Chat de Voz' }), free: t('plansPage.oneTimeVoiceTrial', { defaultValue: 'Teste único 3 min' }), standard: `10 ${t('plansPage.minAbbr', { defaultValue: 'min' })}/dia`, pro: `30 ${t('plansPage.minAbbr', { defaultValue: 'min' })}/dia`, top: t('plansPage.unlimited', { defaultValue: 'Ilimitado' }) },
    { icon: <BookOpen size={14} />, label: t('plansPage.features.scenarios', { defaultValue: 'Cenários personalizados/dia' }), free: false, standard: '3', pro: '6', top: '10' },
    { icon: <History size={14} />, label: t('plansPage.features.history', { defaultValue: 'Histórico de Conversas' }), free: t('plansPage.todayLatestConversation', { defaultValue: 'Última conversa de hoje' }), standard: true, pro: true, top: true },
    { icon: <Star size={14} />, label: t('plansPage.features.avatar', { defaultValue: 'Avatar IA Realista' }), free: t('plansPage.oneTimeAvatarTrial', { defaultValue: 'Teste único 2 min' }), standard: false, pro: `10 ${t('plansPage.minAbbr', { defaultValue: 'min' })}/dia`, top: `30 ${t('plansPage.minAbbr', { defaultValue: 'min' })}/dia` },
  ];

  const bg = isLightTheme ? '#f8f9fb' : '#090a0f';
  const card = isLightTheme ? '#ffffff' : '#0f111a';
  const cardBorder = isLightTheme ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
  const textPrimary = isLightTheme ? '#0f0f1a' : '#f0f0ff';
  const textMuted = isLightTheme ? '#64748b' : '#6b7280';

  const visiblePlanColumns = [
    { key: 'free', label: t('plansPage.free', { defaultValue: 'Free' }), icon: <Lock size={12} className="text-slate-500" />, color: textMuted },
    { key: 'standard', label: t('plansPage.standard', { defaultValue: 'Standard' }), icon: <Zap size={12} className="text-indigo-400" />, color: isLightTheme ? '#4f46e5' : '#818cf8' },
    { key: 'pro', label: t('plansPage.pro', { defaultValue: 'Pro' }), icon: <Zap size={12} className="text-purple-400" />, color: isLightTheme ? '#7c5cff' : '#a78bfa' },
    ...(SHOW_TOP_PLAN
      ? [{ key: 'top', label: t('plansPage.top', { defaultValue: 'Top' }), icon: <Crown size={12} className="text-amber-400" />, color: isLightTheme ? '#b45309' : '#fbbf24' }]
      : []),
  ] as const;

  const renderFeatureValue = (value: string | boolean, color: string) => {
    if (typeof value === 'boolean') {
      return value
        ? <CheckCircle size={16} className="text-emerald-500" />
        : <XCircle size={16} className="text-slate-600" />;
    }

    return (
      <span className="text-xs font-bold text-center leading-tight" style={{ color }}>
        {value}
      </span>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Back */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer bg-transparent border-none"
          style={{ color: textMuted }}
        >
          <ArrowLeft size={15} />
          <span>{t('common.back', { defaultValue: 'Voltar' })}</span>
        </button>

        {/* ── HERO — Free Trial Highlight ────────────────────────────────────── */}
        {isFreeUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[28px] p-8 sm:p-10"
            style={{
              background: isLightTheme
                ? 'linear-gradient(135deg, #f5f0ff 0%, #fff5fa 50%, #fff0f5 100%)'
                : 'linear-gradient(135deg, #18153c 0%, #1a0e2e 50%, #1e0a1a 100%)',
              border: isLightTheme ? '1px solid rgba(124,92,255,0.25)' : '1px solid rgba(124,92,255,0.3)',
              color: isLightTheme ? 'var(--text-primary)' : '#ffffff',
            }}
          >
            {/* Glow blobs */}
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: isLightTheme ? 'radial-gradient(circle, rgba(124,92,255,0.15) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(124,92,255,0.35) 0%, transparent 65%)' }} />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: isLightTheme ? 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 65%)' }} />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Icon badge */}
              <div className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: isLightTheme ? 'rgba(124,92,255,0.08)' : 'linear-gradient(135deg, rgba(124,92,255,0.3), rgba(236,72,153,0.2))',
                  border: isLightTheme ? '1px solid rgba(124,92,255,0.2)' : '1px solid rgba(124,92,255,0.4)'
                }}>
                <Gift size={30} style={{ color: 'var(--accent-purple2)' }} />
              </div>

              <div className="flex-1">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide mb-3"
                  style={{
                    background: isLightTheme ? 'rgba(124,92,255,0.08)' : 'rgba(124,92,255,0.25)',
                    border: isLightTheme ? '1px solid rgba(124,92,255,0.2)' : '1px solid rgba(124,92,255,0.4)',
                    color: 'var(--accent-purple2)'
                  }}>
                  <Sparkles size={10} />
                  {t('plansPage.trialBadge', { defaultValue: 'Teste Grátis' })}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2" style={{ color: isLightTheme ? 'var(--text-primary)' : 'white' }}>
                  7 {t('plansPage.days', { defaultValue: 'dias' })}{' '}
                  <span style={{ background: 'linear-gradient(90deg, #7c5cff, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {t('plansPage.completelyFree', { defaultValue: 'completamente grátis' })}
                  </span>
                </h1>
                <p className="text-sm sm:text-base max-w-lg leading-relaxed" style={{ color: isLightTheme ? 'var(--text-secondary)' : 'rgba(255,255,255,0.7)' }}>
                  {t('plansPage.trialHeroDesc', { defaultValue: 'Experimente o FlowSpeak Pro com acesso ampliado. Comece agora, sem compromisso.' })}
                </p>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={onPurchase}
                disabled={isProcessing}
                className="relative shrink-0 px-8 py-4 rounded-2xl text-white font-extrabold text-base overflow-hidden cursor-pointer border-none"
                style={{ background: 'linear-gradient(90deg, #7c5cff, #ec4899)', boxShadow: '0 8px 30px rgba(124,92,255,0.3)' }}
              >
                {shimmer}
                <span className="relative flex items-center gap-2">
                  {isProcessing ? t('plansPage.processing', { defaultValue: 'Processando...' }) : (
                    <>
                      <Zap size={16} />
                      {t('plansPage.trialHeroBtn', { defaultValue: 'Começar Trial Grátis' })}
                      <ArrowRight size={16} />
                    </>
                  )}
                </span>
              </motion.button>
            </div>

            {/* Trust pills */}
            <div className="relative mt-6 flex flex-wrap gap-3">
              {[
                { icon: <Shield size={12} />, label: t('plansPage.noChargesPill', { defaultValue: 'Sem cobranças durante os 7 dias' }) },
                { icon: <Clock size={12} />, label: t('plansPage.cancelAnytime', { defaultValue: 'Cancele quando quiser' }) },
                { icon: <ShieldCheck size={12} />, label: t('plansPage.secureData', { defaultValue: 'Dados seguros' }) },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: isLightTheme ? 'var(--text-secondary)' : 'rgba(255,255,255,0.6)' }}>
                  <span style={{ color: 'var(--accent-purple2)' }}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── TRIAL ACTIVE banner ─────────────────────────────────────────────── */}
        {isInTrial && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[24px] p-6 border"
            style={{
              background: isLightTheme
                ? 'linear-gradient(135deg, #f5f0ff, #fff0f9)'
                : 'linear-gradient(135deg, rgba(124,92,255,0.12), rgba(236,72,153,0.08))',
              borderColor: isLightTheme ? 'rgba(124,92,255,0.35)' : 'rgba(124,92,255,0.3)',
            }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.18) 0%, transparent 65%)' }} />

            <div className="flex items-center gap-4">
              {/* Days badge */}
              <div className="shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black border"
                style={{
                  background: 'linear-gradient(135deg, #7c5cff, #ec4899)',
                  boxShadow: '0 4px 20px rgba(124,92,255,0.4)',
                  borderColor: 'transparent',
                  color: 'white'
                }}>
                <span className="text-2xl leading-none">{trialDaysLeft}</span>
                <span className="text-[9px] font-bold opacity-80">{t('plansPage.days', { defaultValue: 'dias' })}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white"
                    style={{ background: 'linear-gradient(90deg, #7c5cff, #ec4899)' }}>
                    {t('plansPage.trialActive', { defaultValue: 'TRIAL ATIVO' })}
                  </span>
                </div>
                <h2 className="text-xl font-black mb-0.5" style={{ color: textPrimary }}>
                  {trialDaysLeft === 1
                    ? t('plansPage.lastDayTrial', { defaultValue: 'Último dia de trial!' })
                    : t('plansPage.daysRemaining', { count: trialDaysLeft, defaultValue: `${trialDaysLeft} dias restantes` })}
                </h2>
                <p className="text-xs" style={{ color: textMuted }}>
                  {t('plansPage.subscribeToContinue', { defaultValue: 'Assine para continuar com acesso completo após o trial.' })}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onPurchase}
                disabled={isProcessing}
                className="shrink-0 hidden sm:flex px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer border-none items-center gap-1.5"
                style={{ background: 'linear-gradient(90deg, #7c5cff, #ec4899)' }}
              >
                <ShieldCheck size={14} />
                {t('plansPage.subscribeNow', { defaultValue: 'Assinar agora' })}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── PAID PLAN banner ──────────────────────────────────────────────── */}
        {isPaidUser && user?.activePlan && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] p-6 border"
            style={{
              background: isLightTheme ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.08)',
              borderColor: isLightTheme ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <ShieldCheck size={22} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-0.5">{t('plansPage.activeSubscription', { defaultValue: 'Assinatura Ativa' })}</p>
                  <h2 className="text-lg font-black" style={{ color: textPrimary }}>
                    Plano {user.activePlan.type === 'super' ? t('plansPage.top', { defaultValue: 'Top' }) : user.activePlan.type === 'pro' ? 'Pro' : 'Standard'}
                    <span className="text-xs font-medium text-emerald-500 ml-2">✓ {t('plansPage.activeLabel', { defaultValue: 'ATIVO' })}</span>
                  </h2>
                </div>
              </div>
              <div className="text-right text-xs" style={{ color: textMuted }}>
                <div className="flex items-center gap-1 mb-1">
                  <Calendar size={12} />
                  <span>{t('plansPage.startedAt', { defaultValue: 'Iniciado em' })} {user.activePlan.startDate
                    ? new Date(user.activePlan.startDate).toLocaleDateString(i18n.language || 'pt-BR')
                    : '—'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={12} className="text-amber-400" />
                  <span>{user.activePlan.cycle === 'annual' ? t('plansPage.annual', { defaultValue: 'Anual' }) : t('plansPage.monthly', { defaultValue: 'Mensal' })}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── COMPARISON TABLE — what you get per tier ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[24px] overflow-hidden border"
          style={{ background: card, borderColor: cardBorder }}
        >
          <div className="p-5 border-b" style={{ borderColor: cardBorder }}>
            <h2 className="text-base font-extrabold" style={{ color: textPrimary }}>{t('plansPage.benefitsIncluded', { defaultValue: 'Benefícios inclusos' })}</h2>
          </div>

          <div className="sm:hidden divide-y" style={{ borderColor: cardBorder }}>
            {featureRows.map((row, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: textPrimary }}>
                  <span style={{ color: '#7c5cff' }}>{row.icon}</span>
                  <span className="min-w-0 leading-snug">{row.label}</span>
                </div>
                <div className={`grid ${SHOW_TOP_PLAN ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                  {visiblePlanColumns.map((column) => {
                    const value = row[column.key as 'free' | 'standard' | 'pro' | 'top'];
                    return (
                      <div
                        key={column.key}
                        className="min-h-[58px] rounded-xl border px-2.5 py-2 flex flex-col items-center justify-center gap-1"
                        style={{
                          background: isLightTheme ? 'rgba(15,23,42,0.025)' : 'rgba(255,255,255,0.035)',
                          borderColor: cardBorder,
                        }}
                      >
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase leading-none" style={{ color: textMuted }}>
                          {column.icon}
                          <span>{column.label}</span>
                        </div>
                        <div className="h-5 flex items-center justify-center">
                          {renderFeatureValue(value, column.color)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            <div className={`grid ${SHOW_TOP_PLAN ? 'grid-cols-5' : 'grid-cols-4'} text-center text-xs font-bold uppercase tracking-normal px-3 py-3 border-b`} style={{ borderColor: cardBorder, color: textMuted }}>
              <div className="text-left">{t('plansPage.featureHeader', { defaultValue: 'Recurso' })}</div>
              {visiblePlanColumns.map((column) => (
                <div key={column.key}>
                  <div className="flex flex-col items-center gap-0.5">
                    {column.icon}
                    {column.label}
                  </div>
                </div>
              ))}
            </div>

            {featureRows.map((row, i) => (
              <div
                key={i}
                className={`grid ${SHOW_TOP_PLAN ? 'grid-cols-5' : 'grid-cols-4'} items-center px-3 py-4 text-sm border-b last:border-b-0`}
                style={{ borderColor: cardBorder }}
              >
                <div className="flex items-center gap-2 font-semibold text-[13px]" style={{ color: textMuted }}>
                  <span style={{ color: '#7c5cff' }}>{row.icon}</span>
                  {row.label}
                </div>

                {visiblePlanColumns.map((column) => {
                  const value = row[column.key as 'free' | 'standard' | 'pro' | 'top'];
                  return (
                    <div key={column.key} className="flex items-center justify-center">
                      {renderFeatureValue(value, column.color)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── BILLING HEADER & TOGGLE ───────────────────────────────────────── */}
        {!isPaidUser && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
            <div>
              <h2 className="text-xl font-extrabold" style={{ color: textPrimary }}>{t('plansPage.chooseYourPlan', { defaultValue: 'Escolha seu plano' })}</h2>
              <p className="text-xs font-bold mt-1 flex items-center gap-1.5" style={{ color: 'var(--accent-purple2)' }}>
                <PartyPopper size={13} className="text-purple-400" />
                <span>{t('plansPage.annualPromoDesc', { defaultValue: 'Plano anual = 12 mensalidades, sem alteração de preço' })}</span>
              </p>
            </div>

            <div className="relative p-1 rounded-xl flex items-center"
              style={{
                background: isLightTheme ? '#f1f3f9' : '#141620',
                border: '1px solid var(--border-subtle)',
              }}>
              {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className="relative min-h-10 px-5 py-2.5 text-[13px] font-black rounded-lg transition-all cursor-pointer border-none bg-transparent"
                  style={{ color: billingCycle === cycle ? '#ffffff' : 'var(--text-muted)' }}
                >
                  {billingCycle === cycle && (
                    <motion.div
                      layoutId="cyclePill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: '#7c5cff', border: '1px solid #9b7dff' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {cycle === 'annual' ? t('plansPage.annual', { defaultValue: 'Anual' }) : t('plansPage.monthly', { defaultValue: 'Mensal' })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PLAN CARDS ───────────────────────────────────────────────────── */}
        {!isPaidUser && (
          <div className={`grid grid-cols-1 ${SHOW_TOP_PLAN ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-5`}>
            {/* Standard */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan('standard')}
              className="relative rounded-[24px] p-6 border-2 cursor-pointer transition-all"
              style={{
                background: card,
                borderColor: isStandardSelected ? '#7c5cff' : cardBorder,
                boxShadow: isStandardSelected ? '0 0 0 3px rgba(124,92,255,0.1)' : 'none',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <Zap size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold" style={{ color: textPrimary }}>{t('plansPage.standard', { defaultValue: 'Standard' })}</h3>
                    <p className="text-xs" style={{ color: textMuted }}>{t('plansPage.standardSubtitle', { defaultValue: 'Comece sua jornada' })}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black" style={{ color: textPrimary }}>{standardPrice.value}</span>
                  <span className="text-sm mb-1" style={{ color: textMuted }}>{standardPrice.period}</span>
                </div>
                <p className="text-[11px] text-emerald-500 font-semibold">{standardPrice.monthly}</p>
              </div>

              <hr className="mb-4" style={{ borderColor: cardBorder }} />

              <ul className="space-y-2.5 text-sm">
                {[
                  { ok: true, label: t('plansPage.accessLessons', { defaultValue: 'Acesso a todas as lições' }) },
                  { ok: true, label: t('plansPage.pronunciationEvaluation', { defaultValue: 'Avaliação de pronúncia' }) },
                  { ok: true, label: t('plansPage.limitedTextChat', { defaultValue: 'Chat de Texto limitado (100 msgs/dia)' }) },
                  { ok: true, label: t('plansPage.limitedVoiceChat', { defaultValue: 'Chat de Voz limitado (10 min/dia)' }) },
                  { ok: true, label: t('plansPage.limitedScenarios', { defaultValue: '3 cenários personalizados por dia' }) },
                  { ok: true, label: t('plansPage.conversationHistory', { defaultValue: 'Histórico completo de conversas' }) },
                  { ok: false, label: t('plansPage.realLifeAvatar', { defaultValue: 'Avatar IA Realista' }) },
                ].map((f, i) => (
                  <li key={i} className={`flex items-center gap-2.5 ${!f.ok ? 'opacity-40 line-through' : ''}`}
                    style={{ color: f.ok ? textPrimary : textMuted }}>
                    {f.ok
                      ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      : <XCircle size={14} className="text-slate-500 shrink-0" />}
                    <span className="text-xs font-medium">{f.label}</span>
                  </li>
                ))}
              </ul>

              {/* 7-day trial tag */}
              {!isInTrial && !hasUsedTrial && (
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-400">
                  <Gift size={12} />
                  {t('plansPage.daysTrialIncluded', { defaultValue: '7 dias grátis incluídos' })}
                </div>
              )}
            </motion.div>

            {/* Pro */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan('pro')}
              className="relative rounded-[24px] p-6 border-2 cursor-pointer transition-all"
              style={{
                background: card,
                borderColor: isProSelected ? '#a855f7' : cardBorder,
                boxShadow: isProSelected ? '0 0 35px rgba(168,85,247,0.25), 0 0 0 3px rgba(168,85,247,0.12)' : 'none',
              }}
            >
              {/* Badge */}
              <div className="absolute -top-3.5 right-6 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide text-white z-10"
                style={{ background: 'linear-gradient(90deg, #ec4899, #a855f7)' }}>
                <Crown size={9} className="fill-white" />
                {t('plansPage.mostPopular', { defaultValue: 'Mais Popular' })}
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.12)' }}>
                    <Zap size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold" style={{ color: textPrimary }}>{t('plansPage.pro', { defaultValue: 'Pro' })}</h3>
                    <p className="text-xs" style={{ color: textMuted }}>{t('plansPage.proSubtitle', { defaultValue: 'Para prática frequente' })}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black" style={{ color: textPrimary }}>{proPrice.value}</span>
                  <span className="text-sm mb-1" style={{ color: textMuted }}>{proPrice.period}</span>
                </div>
                <p className="text-[11px] text-purple-400 font-semibold">{proPrice.monthly}</p>
              </div>

              <hr className="mb-4" style={{ borderColor: 'rgba(168,85,247,0.2)' }} />

              <ul className="space-y-2.5 text-sm">
                {[
                  t('plansPage.accessLessons', { defaultValue: 'Acesso a todas as lições' }),
                  t('plansPage.comprehensiveTextChat', { defaultValue: 'Chat de Texto abrangente (500 msgs/dia)' }),
                  t('plansPage.comprehensiveVoiceChat', { defaultValue: 'Chat de Voz abrangente (30 min/dia)' }),
                  t('plansPage.proScenarios', { defaultValue: '6 cenários personalizados por dia' }),
                  t('plansPage.realLifeSimulations', { defaultValue: 'Simulações de Vida Real' }),
                  t('plansPage.pronunciationEvaluation', { defaultValue: 'Avaliação de pronúncia' }),
                  t('plansPage.realLifeAvatar', { defaultValue: 'Avatar IA Realista (10 min/dia)' }),
                  t('plansPage.conversationHistory', { defaultValue: 'Histórico completo de conversas' }),
                  t('plansPage.prioritySupport', { defaultValue: 'Suporte prioritário' }),
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5" style={{ color: textPrimary }}>
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              {/* 7-day trial tag */}
              {!isInTrial && !hasUsedTrial && (
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-400">
                  <Gift size={12} />
                  {t('plansPage.daysTrialIncluded', { defaultValue: '7 dias grátis incluídos' })}
                </div>
              )}
            </motion.div>

            {/* Top temporariamente comentado/oculto pelo flag SHOW_TOP_PLAN. */}
            {SHOW_TOP_PLAN && (
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan('super')}
              className="relative rounded-[24px] p-6 border-2 cursor-pointer transition-all"
              style={{
                background: card,
                borderColor: isTopSelected ? '#f59e0b' : cardBorder,
                boxShadow: isTopSelected ? '0 0 35px rgba(245,158,11,0.2), 0 0 0 3px rgba(245,158,11,0.1)' : 'none',
              }}
            >
              <div className="absolute -top-3.5 right-6 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide text-gray-950 z-10 bg-amber-400">
                <Crown size={9} className="fill-current" />
                {t('plansPage.mostComplete', { defaultValue: 'Mais completo' })}
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <Crown size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold" style={{ color: textPrimary }}>{t('plansPage.top', { defaultValue: 'Top' })}</h3>
                    <p className="text-xs" style={{ color: textMuted }}>{t('plansPage.topSubtitle', { defaultValue: 'Máximo acesso e prioridade' })}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black" style={{ color: textPrimary }}>{topPrice.value}</span>
                  <span className="text-sm mb-1" style={{ color: textMuted }}>{topPrice.period}</span>
                </div>
                <p className="text-[11px] text-amber-400 font-semibold">{topPrice.monthly}</p>
              </div>

              <hr className="mb-4" style={{ borderColor: 'rgba(245,158,11,0.2)' }} />
              <ul className="space-y-2.5 text-sm">
                {[
                  t('plansPage.unlimitedTextChat', { defaultValue: 'Chat de Texto ilimitado' }),
                  t('plansPage.unlimitedVoiceChat', { defaultValue: 'Chat de Voz ilimitado' }),
                  t('plansPage.topScenarios', { defaultValue: '10 cenários personalizados por dia' }),
                  t('plansPage.realLifeAvatar', { defaultValue: 'Avatar IA Realista' }),
                  t('plansPage.conversationHistory', { defaultValue: 'Histórico completo' }),
                  t('plansPage.processingPriority', { defaultValue: 'Prioridade de processamento' }),
                  t('plansPage.prioritySupport', { defaultValue: 'Suporte prioritário' }),
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-2.5" style={{ color: textPrimary }}>
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            )}
          </div>
        )}

        {/* ── GUARANTEE ROW ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4">
          {[
            { icon: <Shield size={18} />, label: t('plansPage.guaranteeTitle', { defaultValue: 'Garantia de 7 dias' }), sub: t('plansPage.guaranteeDesc', { defaultValue: 'Reembolso total se não gostar' }) },
            { icon: <Lock size={18} />, label: t('plansPage.secureDataTitle', { defaultValue: 'Dados seguros' }), sub: t('plansPage.secureDataDesc', { defaultValue: 'Criptografia de ponta' }) },
            { icon: <XCircle size={18} />, label: t('plansPage.cancelTitle', { defaultValue: 'Cancele quando quiser' }), sub: t('plansPage.cancelDesc', { defaultValue: 'Sem fidelidade obrigatória' }) },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-5 rounded-2xl border text-center"
              style={{
                background: isLightTheme ? '#ffffff' : 'rgba(22,25,32,0.6)',
                borderColor: cardBorder,
              }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 text-purple-400"
                style={{ background: 'rgba(124,92,255,0.1)' }}>
                {item.icon}
              </div>
              <h4 className="text-xs font-black mb-1" style={{ color: textPrimary }}>{item.label}</h4>
              <p className="text-xs" style={{ color: textMuted }}>{item.sub}</p>
            </div>
          ))}
        </div>

        {/* ── MAIN CTA ─────────────────────────────────────────────────────── */}
        {!isPaidUser && (
          <div className="w-full space-y-3">
            <AnimatePresence mode="wait">
              {isInTrial ? (
                <motion.button
                  key="trial-cta"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onPurchase}
                  disabled={isProcessing}
                  className="relative w-full py-4 rounded-2xl text-white font-extrabold text-base overflow-hidden cursor-pointer border-none flex items-center justify-center gap-2"
                  style={{ background: '#7c5cff', boxShadow: '0 4px 20px rgba(124,92,255,0.25)' }}
                >
                  <span className="relative flex items-center gap-2">
                    {isProcessing ? t('plansPage.processing', { defaultValue: 'Processando...' }) : (
                      <>
                        <ShieldCheck size={18} />
                        {t('plansPage.activatePlanNow', { days: trialDaysLeft, defaultValue: `Ativar Plano Agora — ${trialDaysLeft}d restantes` })}
                      </>
                    )}
                  </span>
                </motion.button>
              ) : (
                <motion.button
                  key="free-cta"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onPurchase}
                  disabled={isProcessing}
                  className="relative w-full py-4 rounded-2xl text-white font-extrabold text-base overflow-hidden cursor-pointer border-none flex items-center justify-center gap-2"
                  style={{ background: '#7c5cff', boxShadow: '0 4px 20px rgba(124,92,255,0.25)' }}
                >
                  <span className="relative flex items-center gap-2">
                    {isProcessing ? t('plansPage.processing', { defaultValue: 'Processando...' }) : (
                      hasUsedTrial ? (
                        <>
                          <Crown size={18} />
                          {t('plansPage.subscribePlanTitle', { plan: selectedPlan === 'super' ? 'Top' : selectedPlan === 'pro' ? 'Pro' : 'Standard', defaultValue: `Assinar Plano ${selectedPlan === 'super' ? 'Top' : selectedPlan === 'pro' ? 'Pro' : 'Standard'}` })}
                          <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                            <ArrowRight size={16} />
                          </motion.span>
                        </>
                      ) : (
                        <>
                          <Gift size={18} />
                          {t('plansPage.startFreeTrial', { defaultValue: 'Começar 7 dias grátis' })}
                          <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                            <ArrowRight size={16} />
                          </motion.span>
                        </>
                      )
                    )}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <p className="text-xs text-center" style={{ color: textMuted }}>
              {isInTrial
                ? t('plansPage.billingNoticeTrial', { defaultValue: 'Seu cartão só será cobrado após o trial • Cancele quando quiser' })
                : hasUsedTrial
                  ? t('plansPage.billingNoticeSecure', { defaultValue: 'Pagamento seguro • Cancele quando quiser' })
                  : t('plansPage.billingNoticeRequired', { defaultValue: '7 dias grátis • Requer cartão para ativação • Cancele quando quiser' })}
            </p>
          </div>
        )}

        {/* Footer links */}
        <div className="text-center text-xs flex items-center justify-center gap-4 flex-wrap" style={{ color: textMuted }}>
          <button type="button" onClick={onPurchase} className="hover:underline cursor-pointer bg-transparent border-none" style={{ color: textMuted }}>
            {t('plansPage.restorePurchases', { defaultValue: 'Restaurar compras' })}
          </button>
          <span>·</span>
          <button type="button" className="hover:underline cursor-pointer bg-transparent border-none" style={{ color: textMuted }}>
            {t('plansPage.terms', { defaultValue: 'Termos de uso' })}
          </button>
          <span>·</span>
          <button type="button" className="hover:underline cursor-pointer bg-transparent border-none" style={{ color: textMuted }}>
            {t('plansPage.privacy', { defaultValue: 'Política de privacidade' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailablePlans;
