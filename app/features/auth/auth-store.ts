import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PersistStorage, StateStorage } from 'zustand/middleware';
import type { AuthUser } from './auth-service';
import { createSafeStorage } from './auth-storage';

type PersistedSession = { user: AuthUser | null };
type PersistenceResult = { persisted: boolean };

export interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  storageError: boolean;
  signIn(user: AuthUser): PersistenceResult;
  signOut(): PersistenceResult;
  hydrate(): Promise<void>;
}

function allowedUser(value: unknown): AuthUser | null {
  return typeof value === 'object' &&
    value !== null &&
    'username' in value &&
    value.username === 'admin'
    ? { username: 'admin' }
    : null;
}

export function createAuthStore(storage: StateStorage) {
  let updateStatus: (status: Partial<AuthState>) => void;
  let lastPersisted = true;
  let readFailed = false;
  let hydration: Promise<void> | undefined;
  const jsonStorage = createJSONStorage<PersistedSession>(() => storage)!;
  const storageUnavailable = () =>
    'storageError' in storage && storage.storageError === true;

  // Check the complete envelope before Zustand considers version migration.
  // A stored session can supply only an allowlisted user, never actions/status.
  const validateSession = (value: unknown) => {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('version' in value) ||
      value.version !== 1 ||
      !('state' in value) ||
      typeof value.state !== 'object' ||
      value.state === null ||
      !('user' in value.state)
    ) {
      return { state: { user: null }, version: 1 };
    }
    return { state: { user: allowedUser(value.state.user) }, version: 1 };
  };

  const persistStorage: PersistStorage<PersistedSession> = {
    getItem(name) {
      const value = jsonStorage.getItem(name);
      return value instanceof Promise
        ? value.then(validateSession)
        : validateSession(value);
    },
    setItem(name, value) {
      try {
        const result = jsonStorage.setItem(name, value);
        // This contract confirms synchronous localStorage writes only.
        lastPersisted = !(result instanceof Promise) && !storageUnavailable();
        if (result instanceof Promise) void result.catch(() => {});
      } catch {
        lastPersisted = false;
      }
    },
    removeItem: (name) => jsonStorage.removeItem(name),
  };

  return create<AuthState>()((set, get, api) => {
    // Status changes do not write another session or access browser storage.
    updateStatus = (status) => set(status);

    return persist<AuthState, [], [], PersistedSession>(
      (persistSet, _get, persistApi) => ({
        user: null,
        hydrated: false,
        storageError: false,
        signIn(user) {
          persistSet({ user: allowedUser(user) });
          updateStatus({ storageError: !lastPersisted });
          return { persisted: lastPersisted };
        },
        signOut() {
          persistSet({ user: null });
          updateStatus({ storageError: !lastPersisted });
          return { persisted: lastPersisted };
        },
        hydrate() {
          hydration ??= Promise.resolve()
            .then(() => persistApi.persist.rehydrate())
            .catch(() => {
              readFailed = true;
            })
            .then(() => {
              updateStatus({
                hydrated: true,
                storageError: readFailed || storageUnavailable(),
              });
            });
          return hydration;
        },
      }),
      {
        name: 'auth-session',
        version: 1,
        storage: persistStorage,
        skipHydration: true,
        partialize: (state) => ({ user: allowedUser(state.user) }),
        merge: (persisted, current) => ({
          ...current,
          user: allowedUser((persisted as PersistedSession | undefined)?.user),
        }),
        onRehydrateStorage: () => (_state, error) => {
          readFailed = error !== undefined;
        },
      },
    )(set, get, api);
  });
}

export const useAuthStore = createAuthStore(
  createSafeStorage(() => window.localStorage),
);
