// Adapted from official shadcn login-04: https://ui.shadcn.com/blocks/login
import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  ArrowRight,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useLogin } from './use-login';
import { useAuthStore } from './auth-store';
import { SessionPending } from './auth-gate';
import { LoginProgress } from './login-progress';
import { AUTH_MESSAGES } from './auth-messages';

export function LoginForm() {
  const { form, onSubmit, phase, errorMessage, navigationError, retryHome } =
    useLogin();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const busy = phase !== 'idle';
  const googleError = searchParams.get('auth_error') === 'google';
  const { errors } = form.formState;
  if (!hydrated) return <SessionPending />;
  if (user && !busy && !navigationError) return <Navigate to="/home" replace />;
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-5 md:p-10">
      <div className="w-full max-w-5xl">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold tracking-wide text-slate-700">
          <Layers aria-hidden="true" className="size-5" /> WORKSPACE
        </div>
        <Card className="overflow-hidden border-slate-200 py-0 shadow-xl shadow-slate-200/40">
          <CardContent className="grid p-0 md:grid-cols-2">
            <section
              className="hidden flex-col justify-between bg-slate-900 p-12 text-white md:flex"
              aria-labelledby="intro-title"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Không gian làm việc của bạn
                </span>
                <h2
                  id="intro-title"
                  className="mt-7 text-4xl font-semibold leading-tight tracking-tight"
                >
                  Một khởi đầu mới.
                  <br />
                  Mọi thứ sẵn sàng.
                </h2>
                <p className="mt-6 max-w-xs text-base leading-7 text-slate-300">
                  Đăng nhập để trở về không gian của bạn và tiếp tục những công
                  việc đang chờ.
                </p>
              </div>
              <div className="mt-20 flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck aria-hidden="true" className="size-5" />
                <span>Phiên làm việc được lưu trên thiết bị này.</span>
              </div>
            </section>
            <form
              noValidate
              onSubmit={onSubmit}
              aria-busy={busy}
              className="flex flex-col gap-7 p-7 sm:p-10 md:p-12"
            >
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Chào mừng trở lại
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Nhập thông tin tài khoản để đăng nhập.
                </p>
              </div>
              <LoginProgress phase={phase} />
              <div className="grid gap-3">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhập"
                  className="h-12"
                  disabled={busy}
                  aria-invalid={!!errors.username}
                  aria-describedby={
                    errors.username ? 'username-error' : undefined
                  }
                  {...form.register('username')}
                />
                {errors.username && (
                  <p id="username-error" className="text-sm text-red-700">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className="h-12 pr-12"
                    disabled={busy}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? 'password-error' : undefined
                    }
                    {...form.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-pressed={showPassword}
                    disabled={busy}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-700">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {(errorMessage || googleError) && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700"
                >
                  {errorMessage || AUTH_MESSAGES.googleLoginError}
                </p>
              )}
              <div className="relative flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
                <span>hoặc</span>
              </div>
              <Button
                asChild
                variant="outline"
                className="h-12 w-full aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                aria-disabled={busy}
              >
                <Link
                  to="/auth/google"
                  aria-label="Tiếp tục với Google"
                  tabIndex={busy ? -1 : undefined}
                  onClick={(event) => { if (busy) event.preventDefault(); }}
                >
                  {busy ? (
                    <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="size-5"
                      viewBox="0 0 48 48"
                      focusable="false"
                    >
                      <path
                        fill="#4285F4"
                        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
                      />
                    </svg>
                  )}
                  {busy ? 'Đang chuẩn bị Google…' : 'Tiếp tục với Google'}
                </Link>
              </Button>
              {navigationError ? (
                <Button
                  type="button"
                  className="h-12"
                  disabled={busy}
                  onClick={retryHome}
                >
                  Thử mở trang chủ lại
                </Button>
              ) : (
                <Button type="submit" disabled={busy} className="h-12 w-full">
                  {busy ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="motion-safe:animate-spin"
                    />
                  ) : null}
                  {phase === 'redirecting'
                    ? AUTH_MESSAGES.redirecting
                    : phase === 'submitting'
                      ? AUTH_MESSAGES.submitting
                      : 'Đăng nhập'}
                  {!busy && <ArrowRight aria-hidden="true" />}
                </Button>
              )}
              <p className="text-xs leading-5 text-muted-foreground">
                Chào bạn, hãy bắt đầu một ngày làm việc hiệu quả.
              </p>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-slate-500">
          Không gian riêng cho công việc mỗi ngày.
        </p>
      </div>
    </main>
  );
}
