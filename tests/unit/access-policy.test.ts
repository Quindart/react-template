import { beforeEach, expect, it } from 'vitest';
import { canAccess, subjectFor } from '~/features/auth/access-policy';
import {
  authenticate,
  InactiveAccountError,
} from '~/features/auth/auth-service';
import {
  useEmployeeAccountStore,
  EMPLOYEE_ACCOUNT_KEY,
} from '~/features/auth/employee-account-store';
import { createAuthStore } from '~/features/auth/auth-store';

beforeEach(() => {
  localStorage.clear();
  useEmployeeAccountStore.getState().refresh();
});

it('enforces role, account status, resource and action together', () => {
  const admin = subjectFor({ username: 'admin' }, false);
  const employee = subjectFor({ username: 'employee' }, true);
  expect(canAccess(admin, 'home')).toBe(true);
  expect(canAccess(admin, 'users')).toBe(true);
  expect(canAccess(admin, 'employee-account', 'update')).toBe(true);
  expect(canAccess(employee, 'home')).toBe(true);
  expect(canAccess(employee, 'users')).toBe(false);
  expect(canAccess(employee, 'employee-account', 'update')).toBe(false);
  expect(canAccess(subjectFor({ username: 'employee' }, false), 'home')).toBe(
    false,
  );
  expect(canAccess(null, 'home')).toBe(false);
});

it('prevents employee and anonymous account mutations', () => {
  const account = useEmployeeAccountStore.getState();
  expect(
    account.setActive(subjectFor({ username: 'employee' }, true), false)
      .updated,
  ).toBe(false);
  expect(account.setActive(null, false).updated).toBe(false);
  expect(useEmployeeAccountStore.getState().active).toBe(true);
  expect(localStorage.getItem(EMPLOYEE_ACCOUNT_KEY)).toBeNull();
});

it('retains a disabled account on refresh and rejects login until admin reactivates it', async () => {
  const admin = subjectFor({ username: 'admin' }, true);
  const credentials = { username: 'employee', password: 'employee123456Aa@' };
  expect(useEmployeeAccountStore.getState().setActive(admin, false)).toEqual({
    updated: true,
    persisted: true,
  });
  useEmployeeAccountStore.getState().refresh();
  await expect(authenticate(credentials)).rejects.toBeInstanceOf(
    InactiveAccountError,
  );
  expect(await authenticate({ ...credentials, password: 'wrong' })).toBeNull();
  useEmployeeAccountStore.getState().setActive(admin, true);
  expect(await authenticate(credentials)).toEqual({ username: 'employee' });
});

it('does not reactivate an account from malformed status data', () => {
  localStorage.setItem(EMPLOYEE_ACCOUNT_KEY, '{broken');
  useEmployeeAccountStore.getState().refresh();
  expect(useEmployeeAccountStore.getState().active).toBe(false);
});

it('restores employee identity without trusting an injected admin role', async () => {
  localStorage.setItem(
    'auth-session',
    JSON.stringify({
      version: 1,
      state: {
        user: { username: 'employee', role: 'admin', active: true },
      },
    }),
  );
  const store = createAuthStore(localStorage);
  await store.getState().hydrate();
  expect(store.getState().user).toEqual({ username: 'employee' });
  expect(canAccess(subjectFor(store.getState().user, true), 'users')).toBe(
    false,
  );
});
