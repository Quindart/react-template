import type { StateStorage } from 'zustand/middleware';

export interface SafeStorage extends StateStorage {
  readonly storageError: boolean;
  getItem(name: string): string | null;
}

export function createSafeStorage(getStorage: () => Storage): SafeStorage {
  const memory = new Map<string, string>();
  let unavailable = false;

  return {
    get storageError() {
      return unavailable;
    },
    getItem(name) {
      if (!unavailable) {
        try {
          const value = getStorage().getItem(name);
          if (value !== null) memory.set(name, value);
          else memory.delete(name);
          return value;
        } catch {
          unavailable = true;
        }
      }
      return memory.get(name) ?? null;
    },
    setItem(name, value) {
      memory.set(name, value);
      if (!unavailable) {
        try {
          getStorage().setItem(name, value);
        } catch {
          unavailable = true;
        }
      }
    },
    removeItem(name) {
      memory.delete(name);
      if (!unavailable) {
        try {
          getStorage().removeItem(name);
        } catch {
          unavailable = true;
        }
      }
    },
  };
}
