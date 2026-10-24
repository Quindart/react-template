import { randomBytes, timingSafeEqual } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { getGoogleEnvironment } from './google-env.server';
import type { GoogleIdentity } from './google-session.server';
import {
  clearGoogleOAuthFlow,
  commitGoogleIdentity,
  commitGoogleOAuthFlow,
  readGoogleOAuthFlow,
} from './google-session.server';

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

export function getGoogleOAuthClient() {
  const config = getGoogleEnvironment();
  return new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  });
}

export async function createGoogleAuthorizationUrl(
  request: Request,
): Promise<{ url: string; setCookie: string }> {
  const client = getGoogleOAuthClient();
  const { codeVerifier, codeChallenge } =
    await client.generateCodeVerifierAsync();
  const state = randomBytes(32).toString('base64url');
  const nonce = randomBytes(32).toString('base64url');
  const setCookie = await commitGoogleOAuthFlow(request, {
    state,
    nonce,
    codeVerifier,
  });
  const options = {
    response_type: 'code',
    redirect_uri: getGoogleEnvironment().redirectUri,
    scope: GOOGLE_SCOPES,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256' as const,
  };

  return {
    url: client.generateAuthUrl(
      options as Parameters<OAuth2Client['generateAuthUrl']>[0],
    ),
    setCookie,
  };
}

export async function completeGoogleAuthorization(
  request: Request,
): Promise<{ identity: GoogleIdentity; setCookies: string[] }> {
  const config = getGoogleEnvironment();
  const callbackUrl = new URL(request.url);
  const providerError = callbackUrl.searchParams.get('error');
  if (providerError) throw new Error('Google authorization was not completed');

  const code = callbackUrl.searchParams.get('code');
  const returnedState = callbackUrl.searchParams.get('state');
  if (!code || !returnedState)
    throw new Error('Google authorization response is incomplete');

  const flow = await readGoogleOAuthFlow(request);
  if (!flow || !constantTimeStringMatch(flow.state, returnedState))
    throw new Error('Google authorization state did not match');

  const client = getGoogleOAuthClient();
  const { tokens } = await client.getToken({
    code,
    codeVerifier: flow.codeVerifier,
  });
  if (!tokens.id_token) throw new Error('Google identity token is missing');

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.clientId,
  });
  const payload = ticket.getPayload();
  if (
    !payload ||
    !GOOGLE_ISSUERS.includes(payload.iss) ||
    !payload.sub ||
    !payload.email ||
    payload.email_verified !== true ||
    payload.nonce !== flow.nonce
  ) {
    throw new Error('Google identity token is invalid');
  }

  const identity: GoogleIdentity = {
    kind: 'google',
    subject: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
  };
  const flowCookie = await clearGoogleOAuthFlow(request);
  const appCookie = await commitGoogleIdentity(request, identity);

  return { identity, setCookies: [flowCookie, appCookie] };
}

function constantTimeStringMatch(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}
