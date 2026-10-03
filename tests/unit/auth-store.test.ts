import type { StateStorage } from "zustand/middleware";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthStore } from "~/features/auth/auth-store";
import { createSafeStorage } from "~/features/auth/auth-storage";

beforeEach(() => localStorage.clear());

describe("persisted auth store", () => {
  it("starts neutral without touching browser storage", () => {
    const storage = createSafeStorage(() => {
      throw new Error("Storage accessed before client mount");
    });
    const store = createAuthStore(storage);

    expect(store.getState()).toMatchObject({ user: null, hydrated: false, storageError: false });
    expect(storage.storageError).toBe(false);
  });

  it("persists only the allowlisted user and Zustand metadata", () => {
    const store = createAuthStore(localStorage);

    expect(store.getState().signIn({ username: "admin" })).toEqual({ persisted: true });
    expect(JSON.parse(localStorage.getItem("auth-session")!)).toEqual({
      state: { user: { username: "admin" } },
      version: 1,
    });
  });

  it("restores the user in a new store only after explicit hydration", async () => {
    createAuthStore(localStorage).getState().signIn({ username: "admin" });
    const reloaded = createAuthStore(localStorage);

    expect(reloaded.getState().user).toBeNull();
    expect(reloaded.getState().hydrated).toBe(false);
    await reloaded.getState().hydrate();
    expect(reloaded.getState()).toMatchObject({ user: { username: "admin" }, hydrated: true, storageError: false });
  });

  it("writes a signed-out session that remains signed out on reload", async () => {
    const store = createAuthStore(localStorage);
    store.getState().signIn({ username: "admin" });

    expect(store.getState().signOut()).toEqual({ persisted: true });
    expect(JSON.parse(localStorage.getItem("auth-session")!)).toEqual({ state: { user: null }, version: 1 });
    const reloaded = createAuthStore(localStorage);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().user).toBeNull();
  });

  it.each([
    "{broken",
    JSON.stringify({ version: 2, state: { user: { username: "admin" } } }),
    JSON.stringify({ version: "1", state: { user: { username: "admin" } } }),
    JSON.stringify({ state: { user: { username: "admin" } } }),
    JSON.stringify({ version: 1, state: { user: { username: "other" } } }),
    JSON.stringify({ version: 1, state: { user: "admin" } }),
    JSON.stringify({ version: 1, state: null }),
    "null",
  ])("finishes hydration signed out for invalid persisted data: %s", async (value) => {
    localStorage.setItem("auth-session", value);
    const store = createAuthStore(localStorage);

    await store.getState().hydrate();
    expect(store.getState()).toMatchObject({ user: null, hydrated: true });
    expect(typeof store.getState().signIn).toBe("function");
  });

  it("does not merge extra user fields, status flags, or actions from storage", async () => {
    localStorage.setItem("auth-session", JSON.stringify({
      version: 1,
      state: { user: { username: "admin", password: "secret", role: "owner" }, hydrated: false, storageError: true, signOut: "injected" },
    }));
    const store = createAuthStore(localStorage);

    await store.getState().hydrate();
    expect(store.getState()).toMatchObject({ user: { username: "admin" }, hydrated: true, storageError: false });
    expect(store.getState().user).toEqual({ username: "admin" });
    expect(store.getState().signOut()).toEqual({ persisted: true });
  });

  it("hydrates only once and does not reset a later sign-in", async () => {
    let reads = 0;
    const storage: StateStorage = {
      getItem() { reads += 1; return null; },
      setItem() {},
      removeItem() {},
    };
    const store = createAuthStore(storage);

    await Promise.all([store.getState().hydrate(), store.getState().hydrate()]);
    store.getState().signIn({ username: "admin" });
    await store.getState().hydrate();
    expect(reads).toBe(1);
    expect(store.getState().user).toEqual({ username: "admin" });
  });

  it("finishes hydration when storage reads throw", async () => {
    const storage: StateStorage = {
      getItem() { throw new Error("Blocked storage read"); },
      setItem() {},
      removeItem() {},
    };
    const store = createAuthStore(storage);

    await store.getState().hydrate();
    expect(store.getState()).toMatchObject({ user: null, hydrated: true, storageError: true });
  });

  it("keeps sign-in and sign-out in memory when storage writes throw", () => {
    const storage: StateStorage = {
      getItem: () => null,
      setItem() { throw new Error("Quota exceeded"); },
      removeItem() {},
    };
    const store = createAuthStore(storage);

    expect(store.getState().signIn({ username: "admin" })).toEqual({ persisted: false });
    expect(store.getState()).toMatchObject({ user: { username: "admin" }, storageError: true });
    expect(store.getState().signOut()).toEqual({ persisted: false });
    expect(store.getState().user).toBeNull();
  });
});

describe("safe browser storage", () => {
  it("falls back to memory after browser storage becomes unavailable", async () => {
    const storage = createSafeStorage(() => {
      throw new Error("Browser storage blocked");
    });
    const store = createAuthStore(storage);

    await store.getState().hydrate();
    expect(store.getState()).toMatchObject({ hydrated: true, storageError: true });
    expect(store.getState().signIn({ username: "admin" })).toEqual({ persisted: false });
    expect(store.getState().user).toEqual({ username: "admin" });
    expect(JSON.parse(storage.getItem("auth-session")!)).toEqual({ state: { user: { username: "admin" } }, version: 1 });
    expect(store.getState().signOut()).toEqual({ persisted: false });
    expect(store.getState().user).toBeNull();
  });

  it("retains the current session when a write fails after successful reads", () => {
    const browserStorage: Storage = {
      length: 0,
      key: () => null,
      getItem: () => null,
      setItem() { throw new Error("Storage full"); },
      removeItem() {},
      clear() {},
    };
    const storage = createSafeStorage(() => browserStorage);
    const store = createAuthStore(storage);

    expect(store.getState().signIn({ username: "admin" })).toEqual({ persisted: false });
    expect(storage.storageError).toBe(true);
    expect(store.getState().user).toEqual({ username: "admin" });
    expect(storage.getItem("auth-session")).toContain('"username":"admin"');
    storage.removeItem("auth-session");
    expect(storage.getItem("auth-session")).toBeNull();
  });
});
