/**
 * translationStore.ts
 * Reactive store for tracking SSE language pack download progress.
 * Components subscribe to this to show loading indicators.
 */

type Listener = (state: TranslationState) => void;

export interface TranslationState {
  isLoading: boolean;
  lang: string | null;
  /** 0–100 */
  progress: number;
  /** keys received so far */
  received: number;
  /** total keys expected (known after first flush) */
  total: number;
}

const initial: TranslationState = {
  isLoading: false,
  lang: null,
  progress: 0,
  received: 0,
  total: 0,
};

let state: TranslationState = { ...initial };
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn({ ...state }));
}

export const translationStore = {
  getState: (): TranslationState => ({ ...state }),

  subscribe: (fn: Listener): (() => void) => {
    listeners.add(fn);
    fn({ ...state });
    return () => listeners.delete(fn);
  },

  startLoading: (lang: string, total: number) => {
    state = { isLoading: true, lang, progress: 0, received: 0, total };
    notify();
  },

  tick: (received: number) => {
    if (!state.isLoading) return;
    const progress = state.total > 0 ? Math.round((received / state.total) * 100) : 0;
    state = { ...state, received, progress };
    notify();
  },

  done: () => {
    state = { ...state, isLoading: false, progress: 100, received: state.total };
    notify();
    // Reset after animation completes
    setTimeout(() => {
      state = { ...initial };
      notify();
    }, 3000);
  },
};

/** React hook */
import { useState, useEffect } from 'react';

export function useTranslationProgress(): TranslationState {
  const [s, setS] = useState<TranslationState>(translationStore.getState);
  useEffect(() => translationStore.subscribe(setS), []);
  return s;
}
