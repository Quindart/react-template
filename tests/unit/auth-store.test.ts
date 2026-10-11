import { beforeEach, describe, expect, it } from 'vitest';
import { createAuthStore } from '~/features/auth/auth-store';
import { createSafeStorage } from '~/features/auth/auth-storage';
import type { StateStorage } from 'zustand/middleware';

const admin = { kind: 'demo' as const, username: 'admin' as const };
const google = {
  kind: 'google' as const,
  subject: 'google-subject',
  email: 'person@example.com',
  name: 'Person Example',
};

beforeEach(() => localStorage.clear());

describe('persisted auth store', () => {
  it('restores legacy demo sessions and waits for server session resolution', async () => {
    localStorage.setItem('auth-session', JSON.stringify({
      state: { user: { username: 'admin' } }, version: 1,
    }));
    const store = createAuthStore(localStorage);
    await store.getState().hydrate();

    expect(store.getState()).toMatchObject({ user: admin, hydrated: false });
    store.getState().finishHydration(null);
    expect(store.getState().hydrated).toBe(true);
  });

  it('accepts only normalized demo and Google identities', async () => {
    const store = createAuthStore(localStorage);
    store.getState().signIn({ ...google, accessToken: 'private' } as typeof google);
    expect(store.getState().user).toEqual(google);
    expect(JSON.parse(localStorage.getItem('auth-session')!).state.user).toEqual(google);

    localStorage.setItem('auth-session', JSON.stringify({
      version: 1,
      state: { user: { ...google, role: 'admin', accessToken: 'private' } },
    }));
    const reloaded = createAuthStore(localStorage);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().user).toEqual(google);
    reloaded.getState().finishHydration(null);
    expect(reloaded.getState().user).toBeNull();
  });

  it('lets an authoritative Google session replace a local demo session', async () => {
    const store = createAuthStore(localStorage);
    store.getState().signIn(admin);
    await store.getState().hydrate();
    store.getState().finishHydration(google);
    expect(store.getState().user).toEqual(google);
  });

  it('does not treat a cached Google identity as an active server session', async () => {
    const store = createAuthStore(localStorage);
    store.getState().signIn(google);
    await store.getState().hydrate();
    store.getState().finishHydration(null);
    expect(store.getState().user).toBeNull();
  });

  it('finishes signed out for invalid persisted values', async () => {
    localStorage.setItem('auth-session', JSON.stringify({
      version: 1, state: { user: { kind: 'google', email: 'missing-subject' } },
    }));
    const store = createAuthStore(localStorage);
    await store.getState().hydrate();
    store.getState().finishHydration(null);
    expect(store.getState()).toMatchObject({ user: null, hydrated: true });
  });

  it('starts neutral without touching browser storage', () => {
    const storage = createSafeStorage(() => { throw new Error('Storage accessed before client mount'); });
    const store = createAuthStore(storage);
    expect(store.getState()).toMatchObject({ user: null, hydrated: false, storageError: false });
    expect(storage.storageError).toBe(false);
  });

  it('strips extra fields from both cached identities and store actions', async () => {
    localStorage.setItem('auth-session', JSON.stringify({
      version: 1,
      state: { user: { ...google, accessToken: 'secret', role: 'admin' }, hydrated: true },
    }));
    const store = createAuthStore(localStorage);
    await store.getState().hydrate();
    expect(store.getState().user).toEqual(google);
    expect(store.getState().hydrated).toBe(false);
    store.getState().finishHydration(google);
    store.getState().signOut();
    expect(JSON.parse(localStorage.getItem('auth-session')!).state).toEqual({ user: null });
  });

  it('hydrates only once and marks storage errors when reads throw', async () => {
    let reads = 0;
    const storage: StateStorage = {
      getItem() { reads += 1; throw new Error('Blocked storage read'); },
      setItem() {},
      removeItem() {},
    };
    const store = createAuthStore(storage);
    await Promise.all([store.getState().hydrate(), store.getState().hydrate()]);
    store.getState().finishHydration(null);
    await store.getState().hydrate();
    expect(reads).toBe(1);
    expect(store.getState()).toMatchObject({ hydrated: true, storageError: true });
  });

  it('keeps in-memory auth when storage writes fail', () => {
    const storage: StateStorage = {
      getItem: () => null,
      setItem() { throw new Error('Quota exceeded'); },
      removeItem() {},
    };
    const store = createAuthStore(storage);
    expect(store.getState().signIn(admin)).toEqual({ persisted: false });
    expect(store.getState()).toMatchObject({ user: admin, storageError: true });
    expect(store.getState().signOut()).toEqual({ persisted: false });
    expect(store.getState().user).toBeNull();
  });
});
