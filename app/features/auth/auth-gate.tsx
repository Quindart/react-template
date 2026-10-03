import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from './auth-store';


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
  if (!hydrated) return <SessionPending />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
