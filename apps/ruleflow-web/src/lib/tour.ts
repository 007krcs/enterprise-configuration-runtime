export const TOUR_STORAGE_KEY = 'ecr.tour.completed';
const TOUR_RESTART_EVENT = 'ecr.tour-restart';

export function markTourCompleted(value: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOUR_STORAGE_KEY, value ? 'true' : 'false');
}

export function isTourCompleted() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
}

export function requestTourRestart() {
  if (typeof window === 'undefined') return;
  markTourCompleted(false);
  window.dispatchEvent(new CustomEvent(TOUR_RESTART_EVENT));
}

export function onTourRestart(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(TOUR_RESTART_EVENT, handler);
  return () => window.removeEventListener(TOUR_RESTART_EVENT, handler);
}
