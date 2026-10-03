import type { LoginPhase } from './use-login';
import { AUTH_MESSAGES } from './auth-messages';

export function LoginProgress({ phase }: { phase: LoginPhase }) {
  if (phase === 'idle') return null;
  return (
    <div>
      <div
        role="progressbar"
        aria-label="Đang đăng nhập"
        className="h-1 overflow-hidden rounded-full bg-slate-100"
      >
        <div className="h-full w-full bg-slate-900 motion-safe:animate-pulse" />
      </div>
      <p
        role="status"
        aria-live="polite"
        className="mt-2 text-sm text-slate-600"
      >
        {phase === 'submitting'
          ? AUTH_MESSAGES.submitting
          : AUTH_MESSAGES.redirecting}
      </p>
    </div>
  );
}
