import type { LoginValues } from './login-schema';
import { useEmployeeAccountStore } from './employee-account-store';
import type { DemoAuthUser } from './auth-types';
export type { AuthUser } from './auth-types';

export class InactiveAccountError extends Error {}

export async function authenticate(
  values: LoginValues,
): Promise<DemoAuthUser | null> {
  if (values.username === 'admin' && values.password === 'admin123456Aa@') {
    return { kind: 'demo', username: 'admin' };
  }
  if (
    values.username === 'employee' &&
    values.password === 'employee123456Aa@'
  ) {
    if (!useEmployeeAccountStore.getState().active)
      throw new InactiveAccountError();
    return { kind: 'demo', username: 'employee' };
  }
  return null;
}
