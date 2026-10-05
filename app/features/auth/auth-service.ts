import type { LoginValues } from './login-schema';
import { useEmployeeAccountStore } from './employee-account-store';

export type AuthUser = { username: 'admin' | 'employee' };

export class InactiveAccountError extends Error {}

export async function authenticate(
  values: LoginValues,
): Promise<AuthUser | null> {
  if (values.username === 'admin' && values.password === 'admin123456Aa@') {
    return { username: 'admin' };
  }
  if (
    values.username === 'employee' &&
    values.password === 'employee123456Aa@'
  ) {
    if (!useEmployeeAccountStore.getState().active)
      throw new InactiveAccountError();
    return { username: 'employee' };
  }
  return null;
}
