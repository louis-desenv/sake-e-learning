/**
 * Bottom Navigation Bar Component — Bold Voice Redesign
 *
 * Fixed dark bottom navigation with active indicator dot and
 * smooth transitions matching the Bold Voice design language.
 *
 * @version 4.0.0 (Bold Voice Redesign)
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// Create a motion-enabled NavLink
const MotionNavLink = motion(NavLink);

// ============================================================================
// NAVIGATION ITEM TYPE
// ============================================================================

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const getTranslationKey = (path: string): string => {
    switch (path) {
      case '/home':             return 'navigation.home';
      case '/chat/with-avatar': return 'navigation.avatar';
      case '/real-life':        return 'navigation.realLife';
      case '/livekit-chat':     return 'navigation.voiceChat';
      case '/chat/voice-only':  return 'navigation.voiceChat';
      case '/guided-learning':  return 'navigation.learn';
      case '/library':          return 'navigation.library';
      case '/profile':          return 'navigation.profile';
      default: return '';
    }
  };

  // Determine active item (voice-only and livekit-chat are the same)
  const isPathActive = (path: string) => {
    if (path === '/livekit-chat') {
      return location.pathname === '/livekit-chat' || location.pathname === '/chat/voice-only';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bv-bottom-nav">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '100%',
          paddingBottom: 'env(safe-area-inset-bottom)',
          // ✅ FIX B9: maxWidth só aplicado em mobile via CSS (a sidebar desktop tem width:240px pelo CSS)
          // O inline style não sobrescreve mais o CSS desktop com !important
        }}
      >
        {/* Desktop Sidebar Logo Header */}
        <div className="hidden md:flex flex-col gap-4 mb-6 w-full" style={{ alignSelf: 'flex-start' }}>
          <div className="flex items-center gap-3 w-full pl-3">
            <img
              src="/flow-speak-favicon-rounded.png" 
              alt="FlowSpeak" 
              className="w-10 h-10 object-contain rounded-full shadow-lg shadow-purple-500/15"
            />
            <span className="text-xl font-extrabold tracking-tight select-none" style={{ color: 'var(--text-primary)' }}>
              Flow<span style={{ color: 'var(--accent-purple2)' }}>Speak</span>
            </span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', width: '100%', margin: 0 }} />
        </div>

        {NAV_ITEMS.map(({ path, label, icon }: NavItem) => {
          const active = isPathActive(path);
          const key = getTranslationKey(path);
          let labelText: React.ReactNode = key ? t(key, { defaultValue: label }) : label;
          if (path === '/real-life') {
            labelText = (
              <>
                <span className="hidden md:inline">{t('navigation.realLifeDesktop', { defaultValue: 'Trilha Vida Real' })}</span>
                <span className="md:hidden">{t('navigation.realLife', { defaultValue: 'Vida Real' })}</span>
              </>
            );
          }
          if (path === '/livekit-chat') {
            labelText = (
              <>
                <span className="hidden md:inline">{t('navigation.voiceChat', { defaultValue: 'Chat de Voz' })}</span>
                <span className="md:hidden">{t('navigation.voiceChatShort', { defaultValue: 'Voz' })}</span>
              </>
            );
          }

          return (
            <MotionNavLink
              key={path}
              to={path}
              className="bv-nav-item"
              style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 22 }}
            >
              {/* Active pink dot indicator with sliding layout transition */}
              {active && (
                <motion.span 
                  layoutId="activeNavDot"
                  className="bv-nav-active-dot" 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}

              {/* Icon wrapper */}
              <span
                className="bv-nav-icon"
                style={{
                  fontSize: '22px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                  color: active ? 'var(--accent-purple2)' : 'var(--text-muted)',
                }}
              >
                {icon}
              </span>

              {/* Label */}
              <span
                className="bv-nav-label"
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  maxWidth: '64px',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {labelText}
              </span>
            </MotionNavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
