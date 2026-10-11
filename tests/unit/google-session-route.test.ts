import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ read: vi.fn(), destroy: vi.fn() }));
vi.mock('~/features/auth/google-session.server', () => ({
  readGoogleIdentity: session.read,
  destroyGoogleSession: session.destroy,
}));

import { action, loader } from '~/routes/auth.session';

beforeEach(() => {
  session.read.mockReset();
  session.destroy.mockReset();
});

describe('Google session endpoint', () => {
  it('returns only the verified identity from the signed server session', async () => {
    session.read.mockResolvedValue({
      kind: 'google', subject: 'subject-1', email: 'a@example.com', name: 'A',
    });
    const response = await loader({ request: new Request('https://app.test/auth/session') } as never);
    expect(await response.json()).toEqual({
      user: { kind: 'google', subject: 'subject-1', email: 'a@example.com', name: 'A' },
    });
  });

  it('revokes a Google cookie for a same-origin POST', async () => {
    session.destroy.mockResolvedValue('google-app-session=; Max-Age=0');
    const response = await action({ request: new Request('https://app.test/auth/session', {
      method: 'POST', headers: { Origin: 'https://app.test', Cookie: 'google-app-session=abc' },
    }) } as never);
    expect(response.status).toBe(200);
    expect(response.headers.get('Set-Cookie')).toContain('google-app-session=');
    expect(session.destroy).toHaveBeenCalledTimes(1);
  });

  it('rejects cross-origin revocation and succeeds without a Google cookie', async () => {
    const rejected = await action({ request: new Request('https://app.test/auth/session', {
      method: 'POST', headers: { Origin: 'https://attacker.test' },
    }) } as never);
    expect(rejected.status).toBe(403);
    const noSession = await action({ request: new Request('https://app.test/auth/session', {
      method: 'POST', headers: { Origin: 'https://app.test' },
    }) } as never);
    expect(noSession.status).toBe(200);
    expect(session.destroy).not.toHaveBeenCalled();
  });
});
