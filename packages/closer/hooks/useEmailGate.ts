import { useContext, useEffect, useState, useSyncExternalStore } from 'react';

import { AuthContext } from '../contexts/auth';

export const EMAIL_GATE_STORAGE_KEY = 'signupCompleted';

const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', notify);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined' && listeners.size === 0) {
      window.removeEventListener('storage', notify);
    }
  };
};

const getSnapshot = (): boolean => {
  try {
    return localStorage.getItem(EMAIL_GATE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const getServerSnapshot = (): boolean => false;

/**
 * Marks the visitor as having handed over their email, and lets every mounted
 * gate/gated block know at once — the gate block and the blocks it unlocks are
 * siblings in the page, so they need a shared store rather than local state.
 */
export const unlockEmailGate = () => {
  try {
    localStorage.setItem(EMAIL_GATE_STORAGE_KEY, 'true');
  } catch {
    // Private browsing / storage disabled: the unlock stays for this render.
  }
  notify();
};

export interface EmailGateState {
  /** False until hydration finished, so gates never flash the wrong state. */
  isReady: boolean;
  isUnlocked: boolean;
  unlock: () => void;
}

export const useEmailGate = (): EmailGateState => {
  // Read the context directly: gated blocks can be rendered in previews that
  // sit outside an AuthProvider, where `useAuth()` would throw.
  const auth = useContext(AuthContext);
  const hasSubscribed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return {
    isReady,
    isUnlocked: Boolean(auth?.isAuthenticated) || hasSubscribed,
    unlock: unlockEmailGate,
  };
};
