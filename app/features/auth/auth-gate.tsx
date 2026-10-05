import type { ReactNode } from 'react';
import { Navigate, useMatches } from 'react-router';
import { useAuthStore } from './auth-store';
import { canAccess, subjectFor } from './access-policy';
import { useEmployeeAccountStore } from './employee-account-store';

export function SessionPending() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <p role="status">Đang khôi phục phiên…</p>
    </main>
  );
}
export function AuthGate({ children }: { children: ReactNode }) {
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const active = useEmployeeAccountStore((state) => state.active);
  const matches = useMatches();
  const requiresUsers = matches.some(
    ({ handle }) =>
      typeof handle === 'object' &&
      handle !== null &&
      'accessResource' in handle &&
      handle.accessResource === 'users',
  );
  const subject = subjectFor(user, active);
  if (!hydrated) return <SessionPending />;
  if (!canAccess(subject, 'home')) return <Navigate to="/login" replace />;
  if (requiresUsers && !canAccess(subject, 'users')) {
    return <Navigate to="/home" replace />;
  }
  return children;
}
