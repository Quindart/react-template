import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearGoogleOAuthFlow,
  commitGoogleIdentity,
  commitGoogleOAuthFlow,
  destroyGoogleSession,
  readGoogleIdentity,
  readGoogleOAuthFlow,
} from '~/features/auth/google-session.server';

const sessionSecret = 'a-long-enough-test-session-secret-value';
const identity = {
  kind: 'google' as const,
  subject: 'google-subject-123',
  email: 'person@example.com',
  name: 'Example Person',
};
const flow = {
  state: 'csrf-state',
  nonce: 'oidc-nonce',
  codeVerifier: 'pkce-verifier',
};

function cookieRequest(url: string, cookie: string) {
  return new Request(url, {
    headers: { Cookie: cookie.split(';', 1)[0] },
  });
}

afterEach(() => vi.unstubAllEnvs());

describe('Google cookie sessions', () => {
  it('commits and restores only the Google identity fields', async () => {
    vi.stubEnv('AUTH_SESSION_SECRET', sessionSecret);
    const request = new Request('http://localhost:5173/auth/session');
    const cookie = await commitGoogleIdentity(request, identity);
    const restored = await readGoogleIdentity(
      cookieRequest('http://localhost:5173/auth/session', cookie),
    );

    expect(restored).toEqual(identity);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
  });

  it('uses the Secure cookie attribute for HTTPS requests', async () => {
    vi.stubEnv('AUTH_SESSION_SECRET', sessionSecret);
    const cookie = await commitGoogleIdentity(
      new Request('https://workspace.example/auth/session'),
      identity,
    );

    expect(cookie).toContain('Secure');
  });

  it('keeps the short-lived OAuth flow separate and can clear it', async () => {
    vi.stubEnv('AUTH_SESSION_SECRET', sessionSecret);
    const request = new Request('http://localhost:5173/auth/google');
    const flowCookie = await commitGoogleOAuthFlow(request, flow);
    const restored = await readGoogleOAuthFlow(
      cookieRequest('http://localhost:5173/auth/google/callback', flowCookie),
    );
    const cleared = await clearGoogleOAuthFlow(
      cookieRequest('http://localhost:5173/auth/google/callback', flowCookie),
    );

    expect(restored).toEqual(flow);
    expect(flowCookie).toContain('Max-Age=600');
    expect(cleared).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });

  it('destroys the app session cookie on logout', async () => {
    vi.stubEnv('AUTH_SESSION_SECRET', sessionSecret);
    const request = new Request('http://localhost:5173/auth/session');
    const cookie = await commitGoogleIdentity(request, identity);
    const cleared = await destroyGoogleSession(
      cookieRequest('http://localhost:5173/auth/session', cookie),
    );

    expect(cleared).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    expect(
      await readGoogleIdentity(
        cookieRequest('http://localhost:5173/auth/session', cleared),
      ),
    ).toBeNull();
  });

  it('rejects session operations when the signing secret is missing', async () => {
    vi.stubEnv('AUTH_SESSION_SECRET', '');

    await expect(
      commitGoogleIdentity(
        new Request('http://localhost:5173/auth/session'),
        identity,
      ),
    ).rejects.toThrow();
  });
});
