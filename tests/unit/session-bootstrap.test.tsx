import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '~/features/auth/auth-store';
import { LoginProgress } from '~/features/auth/login-progress';
import { AppProviders } from '~/providers/app-providers';

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null, hydrated: false, storageError: false });
});

it('hydrates the session in StrictMode without gating children or repeating notifications', async () => {
  localStorage.setItem(
    'auth-session',
    JSON.stringify({ state: { user: { username: 'admin' } }, version: 1 }),
  );
  const getItem = vi.spyOn(Storage.prototype, 'getItem');
  render(
    <StrictMode>
      <AppProviders>
        <p>content</p>
      </AppProviders>
    </StrictMode>,
  );
  expect(screen.getByText('content')).toBeInTheDocument();
  await waitFor(() => expect(useAuthStore.getState().hydrated).toBe(true));
  expect(useAuthStore.getState().user).toEqual({ username: 'admin' });
  expect(
    getItem.mock.calls.filter(([key]) => key === 'auth-session'),
  ).toHaveLength(1);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('provides a keyboard-accessible snackbar close action', async () => {
  function Notify() {
    const { enqueueSnackbar } = useSnackbar();
    return (
      <button onClick={() => enqueueSnackbar('notice', { variant: 'success' })}>
        notify
      </button>
    );
  }
  render(
    <AppProviders>
      <Notify />
    </AppProviders>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'notify' }));
  const close = await screen.findByRole('button', { name: 'Đóng thông báo' });
  close.focus();
  expect(close).toHaveFocus();
  fireEvent.click(close);
  await waitFor(() =>
    expect(screen.queryByText('notice')).not.toBeInTheDocument(),
  );
});

it('renders accessible indeterminate progress only during actual pending', () => {
  const { rerender } = render(<LoginProgress phase="idle" />);
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  rerender(<LoginProgress phase="submitting" />);
  expect(
    screen.getByRole('progressbar', { name: 'Đang đăng nhập' }),
  ).not.toHaveAttribute('aria-valuenow');
  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  expect(screen.getByRole('status')).toHaveTextContent('Đang đăng nhập…');
  rerender(<LoginProgress phase="redirecting" />);
  expect(screen.getByRole('status')).toHaveTextContent(
    'Đang chuyển đến trang chủ…',
  );
});
