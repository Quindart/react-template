import { Navigate } from 'react-router';
import { useAuthStore } from '~/features/auth/auth-store';
import { SessionPending } from '~/features/auth/auth-gate';
export default function Index() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  return hydrated ? (
    <Navigate to={user ? '/home' : '/login'} replace />
  ) : (
    <SessionPending />
  );
}
