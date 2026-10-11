import { redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { createGoogleAuthorizationUrl } from '~/features/auth/google-oauth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { url, setCookie } = await createGoogleAuthorizationUrl(request);
    return redirect(url, { headers: { 'Set-Cookie': setCookie } });
  } catch {
    return redirect('/login?auth_error=google');
  }
}
