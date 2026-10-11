import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AUTH_MESSAGES } from '~/features/auth/auth-messages';
import { useAuthStore } from '~/features/auth/auth-store';
import { useLogout } from '~/features/auth/use-logout';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), enqueueSnackbar: vi.fn() }));
vi.mock('react-router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }) }));

function Harness() {
  const { logout, isPending } = useLogout();
  return <button disabled={isPending} onClick={() => void logout()}>logout</button>;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  useAuthStore.setState({ user: { kind: 'google', subject: 's', email: 'a@example.com', name: null }, hydrated: true, storageError: false });
});

it('keeps Google session active and reports a retryable error when revocation fails', async () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'logout' }));
  await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());
  expect(useAuthStore.getState().user?.kind).toBe('google');
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
    AUTH_MESSAGES.logoutError,
    expect.objectContaining({ variant: 'error' }),
  );
});
