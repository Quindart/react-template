import 'dotenv/config';
import { createCookieSessionStorage } from 'react-router';

import type { GoogleAuthUser } from './auth-types';

export type GoogleIdentity = GoogleAuthUser;

export type GoogleOAuthFlow = {
  state: string;
  nonce: string;
  codeVerifier: string;
};

type GoogleAppSession = { identity?: GoogleIdentity };
type GoogleFlowSession = { flow?: GoogleOAuthFlow };

const FLOW_COOKIE = 'google-oauth-flow';
const APP_COOKIE = 'google-app-session';
const FLOW_MAX_AGE = 10 * 60;
const APP_MAX_AGE = 7 * 24 * 60 * 60;

function createSessionStorage<Data>(
  request: Request,
  name: string,
  maxAge: number,
) {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret) throw new Error('Missing required server configuration');
  const secure = new URL(request.url).protocol === 'https:';

  return createCookieSessionStorage<Data>({
    cookie: {
      name,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure,
      maxAge,
      secrets: [secret],
    },
  });
}

function isGoogleIdentity(value: unknown): value is GoogleIdentity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    value.kind === 'google' &&
    'subject' in value &&
    typeof value.subject === 'string' &&
    value.subject.length > 0 &&
    'email' in value &&
    typeof value.email === 'string' &&
    value.email.length > 0 &&
    'name' in value &&
    (typeof value.name === 'string' || value.name === null)
  );
}

export async function commitGoogleOAuthFlow(
  request: Request,
  flow: GoogleOAuthFlow,
): Promise<string> {
  const storage = createSessionStorage<GoogleFlowSession>(
    request,
    FLOW_COOKIE,
    FLOW_MAX_AGE,
  );
  const session = await storage.getSession();
  session.set('flow', flow);
  return storage.commitSession(session);
}

export async function readGoogleOAuthFlow(
  request: Request,
): Promise<GoogleOAuthFlow | null> {
  const storage = createSessionStorage<GoogleFlowSession>(
    request,
    FLOW_COOKIE,
    FLOW_MAX_AGE,
  );
  const session = await storage.getSession(request.headers.get('Cookie'));
  const flow = session.get('flow');
  return flow &&
    typeof flow.state === 'string' &&
    typeof flow.nonce === 'string' &&
    typeof flow.codeVerifier === 'string'
    ? flow
    : null;
}

export async function clearGoogleOAuthFlow(request: Request): Promise<string> {
  const storage = createSessionStorage<GoogleFlowSession>(
    request,
    FLOW_COOKIE,
    FLOW_MAX_AGE,
  );
  const session = await storage.getSession(request.headers.get('Cookie'));
  return storage.destroySession(session);
}

export async function commitGoogleIdentity(
  request: Request,
  identity: GoogleIdentity,
): Promise<string> {
  const storage = createSessionStorage<GoogleAppSession>(
    request,
    APP_COOKIE,
    APP_MAX_AGE,
  );
  const session = await storage.getSession(request.headers.get('Cookie'));
  session.set('identity', identity);
  return storage.commitSession(session);
}

export async function readGoogleIdentity(
  request: Request,
): Promise<GoogleIdentity | null> {
  const storage = createSessionStorage<GoogleAppSession>(
    request,
    APP_COOKIE,
    APP_MAX_AGE,
  );
  const session = await storage.getSession(request.headers.get('Cookie'));
  const identity = session.get('identity');
  return isGoogleIdentity(identity) ? identity : null;
}

export async function destroyGoogleSession(request: Request): Promise<string> {
  const storage = createSessionStorage<GoogleAppSession>(
    request,
    APP_COOKIE,
    APP_MAX_AGE,
  );
  const session = await storage.getSession(request.headers.get('Cookie'));
  return storage.destroySession(session);
}
