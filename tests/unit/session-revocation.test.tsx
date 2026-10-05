import { act, render, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useAuthStore } from '~/features/auth/auth-store';
import { SessionBootstrap } from '~/features/auth/session-bootstrap';
import {
  EMPLOYEE_ACCOUNT_KEY,
  useEmployeeAccountStore,
} from '~/features/auth/employee-account-store';

it('revokes a session when a queued disable event arrives after reactivation', async () => {
  localStorage.clear();
  localStorage.setItem(
    EMPLOYEE_ACCOUNT_KEY,
    JSON.stringify({ version: 1, active: true }),
  );
  useEmployeeAccountStore.getState().refresh();
  useAuthStore.getState().signIn({ username: 'employee' });
  render(<SessionBootstrap />);
  await waitFor(() => expect(useAuthStore.getState().hydrated).toBe(true));
  expect(useAuthStore.getState().user?.username).toBe('employee');
  act(() =>
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: EMPLOYEE_ACCOUNT_KEY,
        newValue: JSON.stringify({ version: 1, active: false }),
      }),
    ),
  );
  expect(useAuthStore.getState().user).toBeNull();
  expect(useEmployeeAccountStore.getState().active).toBe(true);
});
