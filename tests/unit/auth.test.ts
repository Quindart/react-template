import { describe, expect, it } from 'vitest';
import { authenticate } from '~/features/auth/auth-service';
import { loginSchema } from '~/features/auth/login-schema';

describe('login schema', () => {
  it('rejects blank fields with the required field messages', () => {
    const result = loginSchema.safeParse({ username: '', password: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toEqual({
        username: ['Vui lòng nhập tên đăng nhập.'],
        password: ['Vui lòng nhập mật khẩu.'],
      });
    }
  });

  it('rejects a username consisting of whitespace', () => {
    expect(
      loginSchema.safeParse({ username: '   ', password: 'x' }).success,
    ).toBe(false);
  });

  it('trims username and preserves password exactly', () => {
    expect(loginSchema.parse({ username: ' admin ', password: 'x ' })).toEqual({
      username: 'admin',
      password: 'x ',
    });
  });

  it('accepts nonempty credentials for the authentication step', () => {
    expect(
      loginSchema.safeParse({ username: 'someone', password: 'wrong' }).success,
    ).toBe(true);
  });
});

describe('authenticate', () => {
  it('allows the employee demo account to sign in', async () => {
    expect(
      await authenticate({
        username: 'employee',
        password: 'employee123456Aa@',
      }),
    ).toEqual({ username: 'employee' });
  });
  it('returns the demo user for exact credentials', async () => {
    expect(
      await authenticate({ username: 'admin', password: 'admin123456Aa@' }),
    ).toEqual({ username: 'admin' });
  });

  it.each([
    { username: 'admin', password: 'admin123456Aa@ ' },
    { username: 'Admin', password: 'admin123456Aa@' },
    { username: 'admin', password: 'wrong' },
    { username: '', password: '' },
  ])(
    'rejects credentials that do not exactly match: $username / $password',
    async (values) => {
      expect(await authenticate(values)).toBeNull();
    },
  );
});
