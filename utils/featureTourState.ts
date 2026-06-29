const TOUR_ACTIVE_KEY = 'flowspeak_feature_tour_active';
export const TOUR_COMPLETED_KEY = 'flowspeak_tour_completed';
export const TOUR_FORCE_OPEN_KEY = 'flowspeak_feature_tour_force_open';
export const GOOGLE_LOGIN_TOUR_PENDING_KEY = 'flowspeak_google_login_tour_pending';
const LEGACY_TOUR_COMPLETED_KEY = 'flowspeak-tour-completed';

export const isFeatureTourActive = (): boolean =>
  typeof window !== 'undefined' && sessionStorage.getItem(TOUR_ACTIVE_KEY) === 'true';

export const setFeatureTourActive = (active: boolean): void => {
  if (typeof window === 'undefined') return;
  if (active) {
    sessionStorage.setItem(TOUR_ACTIVE_KEY, 'true');
  } else {
    sessionStorage.removeItem(TOUR_ACTIVE_KEY);
  }
};

export const restartFeatureTour = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOUR_COMPLETED_KEY);
  localStorage.removeItem(LEGACY_TOUR_COMPLETED_KEY);
  setFeatureTourActive(true);
  window.dispatchEvent(new CustomEvent('flowspeak:open-tour'));
};

export const requestFeatureTourOnNextMount = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOUR_FORCE_OPEN_KEY, 'true');
  setFeatureTourActive(true);
};
