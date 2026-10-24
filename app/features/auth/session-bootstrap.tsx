import { useEffect } from 'react';
import type { GoogleAuthUser } from './auth-types';
import { useAuthStore } from './auth-store';
import {
  EMPLOYEE_ACCOUNT_KEY,
  readEmployeeActive,
  useEmployeeAccountStore,
} from './employee-account-store';

export function SessionBootstrap() {
  useEffect(() => {
    const revokeInactiveSession = () => {
      const auth = useAuthStore.getState();
      if (
        auth.user?.kind === 'demo' && auth.user.username === 'employee' &&
        !useEmployeeAccountStore.getState().active
      ) {
        auth.signOut();
      }
    };
    if (!useEmployeeAccountStore.getState().hydrated)
      useEmployeeAccountStore.getState().refresh();
    const unsubscribe = useEmployeeAccountStore.subscribe(
      revokeInactiveSession,
    );
    void Promise.all([
      useAuthStore.getState().hydrate(),
      fetch('/auth/session', { credentials: 'same-origin' })
        .then(async (response) => {
          if (!response.ok) return null;
          const payload: unknown = await response.json();
          if (typeof payload !== 'object' || payload === null || !('user' in payload)) return null;
          const user = payload.user;
          return typeof user === 'object' && user !== null &&
            'kind' in user && user.kind === 'google' &&
            'subject' in user && typeof user.subject === 'string' &&
            'email' in user && typeof user.email === 'string' &&
            'name' in user && (typeof user.name === 'string' || user.name === null)
            ? user as GoogleAuthUser
            : null;
        })
        .catch(() => null),
    ]).then(([, googleUser]) => {
      useAuthStore.getState().finishHydration(googleUser);
      revokeInactiveSession();
    });
    const syncAccount = (event: StorageEvent) => {
      // A queued disable event still revokes the old session if a later
      // reactivation has already replaced the value in localStorage.
      if (
        event.key === EMPLOYEE_ACCOUNT_KEY &&
        !readEmployeeActive(event.newValue)
      ) {
        const auth = useAuthStore.getState();
        if (auth.user?.kind === 'demo' && auth.user.username === 'employee') auth.signOut();
      }
      if (event.key === EMPLOYEE_ACCOUNT_KEY || event.key === null) {
        useEmployeeAccountStore.getState().refresh();
      }
    };
    window.addEventListener('storage', syncAccount);
    window.addEventListener(
      'focus',
      useEmployeeAccountStore.getState().refresh,
    );
    return () => {
      unsubscribe();
      window.removeEventListener('storage', syncAccount);
      window.removeEventListener(
        'focus',
        useEmployeeAccountStore.getState().refresh,
      );
    };
  }, []);
  return null;
}
