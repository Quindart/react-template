import { useEffect } from 'react';
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
        auth.user?.username === 'employee' &&
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
    void useAuthStore.getState().hydrate().then(revokeInactiveSession);
    const syncAccount = (event: StorageEvent) => {
      // A queued disable event still revokes the old session if a later
      // reactivation has already replaced the value in localStorage.
      if (
        event.key === EMPLOYEE_ACCOUNT_KEY &&
        !readEmployeeActive(event.newValue)
      ) {
        const auth = useAuthStore.getState();
        if (auth.user?.username === 'employee') auth.signOut();
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
