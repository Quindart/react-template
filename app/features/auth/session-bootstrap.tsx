import { useEffect } from 'react';
import { useAuthStore } from './auth-store';

export function SessionBootstrap() {
  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);
  return null;
}
