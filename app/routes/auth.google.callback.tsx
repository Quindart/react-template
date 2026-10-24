import { redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { completeGoogleAuthorization } from '~/features/auth/google-oauth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { setCookies } = await completeGoogleAuthorization(request);
    const headers = new Headers();
    for (const cookie of setCookies) headers.append('Set-Cookie', cookie);
    return redirect('/home', { headers });
  } catch {
    return redirect('/login?auth_error=google');
  }
}
