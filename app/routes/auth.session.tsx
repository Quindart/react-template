import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import {
  destroyGoogleSession,
  readGoogleIdentity,
} from '~/features/auth/google-session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    return Response.json({ user: await readGoogleIdentity(request) });
  } catch {
    return Response.json({ user: null });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json({ ok: false }, { status: 403 });
  if (request.method !== 'POST')
    return Response.json({ ok: false }, { status: 405 });

  const cookie = request.headers.get('Cookie') ?? '';
  if (!/(?:^|;\s*)google-app-session=/.test(cookie))
    return Response.json({ ok: true });
  try {
    const setCookie = await destroyGoogleSession(request);
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': setCookie } });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
