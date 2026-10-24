import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  completeGoogleAuthorization,
  createGoogleAuthorizationUrl,
} from '~/features/auth/google-oauth.server';
import { getGoogleEnvironment } from '~/features/auth/google-env.server';

const authState = vi.hoisted(() => ({
  options: undefined as Record<string, unknown> | undefined,
  payload: undefined as Record<string, unknown> | undefined,
  tokenError: undefined as Error | undefined,
}));

vi.mock('google-auth-library', () => {
  class OAuth2Client {
    generateAuthUrl(options: Record<string, unknown>) {
      authState.options = options;
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      for (const [key, value] of Object.entries(options)) {
        url.searchParams.set(
          key,
          Array.isArray(value) ? value.join(' ') : String(value),
        );
      }
      return url.toString();
    }

    async generateCodeVerifierAsync() {
      return { codeVerifier: 'pkce-verifier', codeChallenge: 'pkce-challenge' };
    }

    async getToken() {
      if (authState.tokenError) throw authState.tokenError;
      return { tokens: { id_token: 'test-id-token' } };
    }

    async verifyIdToken() {
      return { getPayload: () => authState.payload };
    }
  }

  return { OAuth2Client };
});

const validEnvironment = {
  GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:5173/auth/google/callback',
  AUTH_SESSION_SECRET: 'a-long-enough-test-session-secret-value',
};

const basePayload = () => ({
  iss: 'https://accounts.google.com',
  aud: validEnvironment.GOOGLE_CLIENT_ID,
  exp: Math.floor(Date.now() / 1000) + 300,
  sub: 'google-subject-123',
  email: 'person@example.com',
  email_verified: true,
  name: 'Example Person',
  nonce: String(authState.options?.nonce),
});

function requestWithCookie(url: string, setCookie: string) {
  return new Request(url, {
    headers: { Cookie: setCookie.split(';', 1)[0] },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  authState.options = undefined;
  authState.payload = undefined;
  authState.tokenError = undefined;
});

describe('Google OAuth service', () => {
  it('requires server OAuth and session configuration', () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
    vi.stubEnv('GOOGLE_REDIRECT_URI', '');
    vi.stubEnv('AUTH_SESSION_SECRET', '');

    expect(() => getGoogleEnvironment()).toThrow();
  });

  it('starts an authorization-code flow with identity scopes and PKCE', async () => {
    for (const [key, value] of Object.entries(validEnvironment))
      vi.stubEnv(key, value);

    const result = await createGoogleAuthorizationUrl(
      new Request('http://localhost:5173/auth/google'),
    );
    const authorizationUrl = new URL(result.url);

    expect(authorizationUrl.origin).toBe('https://accounts.google.com');
    expect(authorizationUrl.searchParams.get('scope')).toBe(
      'openid email profile',
    );
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
      validEnvironment.GOOGLE_REDIRECT_URI,
    );
    expect(authorizationUrl.searchParams.get('response_type')).toBe('code');
    expect(authorizationUrl.searchParams.get('code_challenge_method')).toBe(
      'S256',
    );
    expect(authorizationUrl.searchParams.get('code_challenge')).toBe(
      'pkce-challenge',
    );
    expect(authorizationUrl.searchParams.get('state')).toBeTruthy();
    expect(authorizationUrl.searchParams.get('nonce')).toBeTruthy();
    expect(result.setCookie).toContain('HttpOnly');
    expect(result.setCookie).toContain('SameSite=Lax');
  });

  it('exchanges a callback and returns only a verified Google identity', async () => {
    for (const [key, value] of Object.entries(validEnvironment))
      vi.stubEnv(key, value);

    const started = await createGoogleAuthorizationUrl(
      new Request('http://localhost:5173/auth/google'),
    );
    const state = new URL(started.url).searchParams.get('state');
    authState.payload = basePayload();
    const callback = await completeGoogleAuthorization(
      requestWithCookie(
        `http://localhost:5173/auth/google/callback?code=one-time-code&state=${state}`,
        started.setCookie,
      ),
    );

    expect(callback.identity).toEqual({
      kind: 'google',
      subject: 'google-subject-123',
      email: 'person@example.com',
      name: 'Example Person',
    });
    expect(callback.setCookies).toHaveLength(2);
    expect(callback.setCookies[0]).toContain(
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    );
    expect(callback.setCookies[1]).toContain('HttpOnly');
  });

  it('rejects a callback without the matching OAuth state', async () => {
    for (const [key, value] of Object.entries(validEnvironment))
      vi.stubEnv(key, value);

    await expect(
      completeGoogleAuthorization(
        new Request(
          'http://localhost:5173/auth/google/callback?code=one-time-code&state=wrong',
        ),
      ),
    ).rejects.toThrow();
  });

  it('rejects an identity whose email is not verified', async () => {
    for (const [key, value] of Object.entries(validEnvironment))
      vi.stubEnv(key, value);

    const started = await createGoogleAuthorizationUrl(
      new Request('http://localhost:5173/auth/google'),
    );
    const state = new URL(started.url).searchParams.get('state');
    authState.payload = { ...basePayload(), email_verified: false };

    await expect(
      completeGoogleAuthorization(
        requestWithCookie(
          `http://localhost:5173/auth/google/callback?code=one-time-code&state=${state}`,
          started.setCookie,
        ),
      ),
    ).rejects.toThrow();
  });

  it('rejects a code exchange failure without creating a session', async () => {
    for (const [key, value] of Object.entries(validEnvironment))
      vi.stubEnv(key, value);
    authState.tokenError = new Error('provider detail that must not reach UI');

    const started = await createGoogleAuthorizationUrl(
      new Request('http://localhost:5173/auth/google'),
    );
    const state = new URL(started.url).searchParams.get('state');

    await expect(
      completeGoogleAuthorization(
        requestWithCookie(
          `http://localhost:5173/auth/google/callback?code=one-time-code&state=${state}`,
          started.setCookie,
        ),
      ),
    ).rejects.toThrow();
  });
});
