import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useSnackbar } from 'notistack';
import { loginSchema, type LoginValues } from './login-schema';
import { authenticate, InactiveAccountError } from './auth-service';
import { useAuthStore } from './auth-store';
import { AUTH_MESSAGES } from './auth-messages';

export type LoginPhase = 'idle' | 'submitting' | 'redirecting';

export function useLogin() {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [phase, setPhase] = useState<LoginPhase>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [navigationError, setNavigationError] = useState(false);
  const locked = useRef(false);
  const focusPassword = useRef(false);

  useEffect(() => {
    const subscription = form.watch(() => {
      setErrorMessage((message) =>
        message === AUTH_MESSAGES.invalidCredentials ? '' : message,
      );
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (phase === 'idle' && focusPassword.current) {
      focusPassword.current = false;
      form.setFocus('password');
    }
  }, [phase, form, errorMessage]);

  const showError = (message: string) => {
    setErrorMessage(message);
    enqueueSnackbar(message, { variant: 'error', autoHideDuration: 6000 });
  };

  const openHome = async () => {
    setPhase('redirecting');
    setNavigationError(false);
    setErrorMessage('');
    try {
      await navigate('/home', { replace: true });
    } catch {
      setNavigationError(true);
      showError(AUTH_MESSAGES.navigationError);
    }
  };

  const submit = form.handleSubmit(
    async (values) => {
      setPhase('submitting');
      setErrorMessage('');
      let user;
      try {
        user = await authenticate(values);
      } catch (error) {
        showError(
          error instanceof InactiveAccountError
            ? AUTH_MESSAGES.inactiveAccount
            : AUTH_MESSAGES.loginError,
        );
        return;
      }
      if (!user) {
        form.setValue('password', '');
        focusPassword.current = true;
        showError(AUTH_MESSAGES.invalidCredentials);
        return;
      }
      // Mark navigation ownership before publishing the user to route guards.
      setPhase('redirecting');
      const { persisted } = useAuthStore.getState().signIn(user);
      enqueueSnackbar(
        persisted
          ? `Đăng nhập thành công. Chào mừng ${user.username}!`
          : AUTH_MESSAGES.persistenceWarning,
        {
          variant: persisted ? 'success' : 'warning',
          autoHideDuration: persisted ? 4000 : 6000,
        },
      );
      await openHome();
    },
    () => showError(AUTH_MESSAGES.invalidForm),
  );

  const onSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (locked.current) return;
    locked.current = true;
    try {
      await submit(event);
    } finally {
      locked.current = false;
      setPhase('idle');
    }
  };

  const retryHome = async () => {
    if (locked.current || !useAuthStore.getState().user) return;
    locked.current = true;
    try {
      await openHome();
    } finally {
      locked.current = false;
      setPhase('idle');
    }
  };

  return { form, onSubmit, phase, errorMessage, retryHome, navigationError };
}
