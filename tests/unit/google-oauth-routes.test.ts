import { beforeEach, describe, expect, it, vi } from 'vitest';

const oauth = vi.hoisted(() => ({
  createUrl: vi.fn(),
  complete: vi.fn(),
}));

vi.mock('~/features/auth/google-oauth.server', () => ({
  createGoogleAuthorizationUrl: oauth.createUrl,
  completeGoogleAuthorization: oauth.complete,
}));

import { loader as startGoogleLogin } from '~/routes/auth.google';
import { loader as googleCallback } from '~/routes/auth.google.callback';

function loaderArgs(url: string) {
  return { request: new Request(url) } as Parameters<typeof startGoogleLogin>[0];
}

beforeEach(() => {
  oauth.createUrl.mockReset();
  oauth.complete.mockReset();
});

describe('Google OAuth route loaders', () => {
  it('redirects to Google and sets the short-lived flow cookie', async () => {
    oauth.createUrl.mockResolvedValue({
      url: 'https://accounts.google.com/o/oauth2/v2/auth?state=state-1',
      setCookie: 'google-oauth-flow=flow; HttpOnly; SameSite=Lax',
    });

    const response = await startGoogleLogin(
      loaderArgs('http://localhost:5173/auth/google'),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth?state=state-1',
    );
    expect(response.headers.get('Set-Cookie')).toContain(
      'google-oauth-flow=flow',
    );
  });

  it('redirects a valid callback to home and commits both cookies', async () => {
    oauth.complete.mockResolvedValue({
      identity: {
        kind: 'google',
        subject: 'google-subject-123',
        email: 'person@example.com',
        name: 'Example Person',
      },
      setCookies: [
        'google-oauth-flow=; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'google-app-session=verified; HttpOnly; SameSite=Lax',
      ],
    });

    const response = await googleCallback(
      loaderArgs(
        'http://localhost:5173/auth/google/callback?code=valid&state=valid',
      ),
    );
    const cookies = response.headers.get('Set-Cookie') ?? '';

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/home');
    expect(cookies).toContain('google-oauth-flow=');
    expect(cookies).toContain('google-app-session=verified');
  });

  it.each([
    'http://localhost:5173/auth/google/callback?error=access_denied&state=x',
    'http://localhost:5173/auth/google/callback?state=x',
  ])('returns a generic login error for an incomplete callback', async (url) => {
    oauth.complete.mockRejectedValue(
      new Error('provider response contains private details'),
    );

    const response = await googleCallback(loaderArgs(url));

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/login?auth_error=google');
    expect(await response.text()).not.toContain('private details');
    expect(response.headers.has('Set-Cookie')).toBe(false);
  });

  it('returns a generic login error when Google is not configured', async () => {
    oauth.createUrl.mockRejectedValue(
      new Error('GOOGLE_CLIENT_SECRET=private-value'),
    );

    const response = await startGoogleLogin(
      loaderArgs('http://localhost:5173/auth/google'),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/login?auth_error=google');
    expect(await response.text()).not.toContain('private-value');
  });
});
