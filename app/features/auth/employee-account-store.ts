import { create } from 'zustand';
import { createSafeStorage } from './auth-storage';
import { canAccess, type Subject } from './access-policy';

export const EMPLOYEE_ACCOUNT_KEY = 'employee-account';
const storage = createSafeStorage(() => window.localStorage);

export function readEmployeeActive(raw: string | null): boolean {
  if (raw === null) return true;
  try {
    const value = JSON.parse(raw);
    return value?.version === 1 && value.active === true;
  } catch {
    // Malformed account data cannot reactivate a disabled account.
    return false;
  }
}

type EmployeeAccountState = {
  active: boolean;
  hydrated: boolean;
  refresh(): void;
  setActive(
    subject: Subject | null,
    active: boolean,
  ): { updated: boolean; persisted: boolean };
};

export const useEmployeeAccountStore = create<EmployeeAccountState>((set) => ({
  active: true,
  hydrated: false,
  refresh() {
    const active = readEmployeeActive(storage.getItem(EMPLOYEE_ACCOUNT_KEY));
    set({ active, hydrated: true });
  },
  setActive(subject, active) {
    if (!canAccess(subject, 'employee-account', 'update')) {
      return { updated: false, persisted: false };
    }
    storage.setItem(
      EMPLOYEE_ACCOUNT_KEY,
      JSON.stringify({ version: 1, active }),
    );
    set({ active });
    return { updated: true, persisted: !storage.storageError };
  },
}));
