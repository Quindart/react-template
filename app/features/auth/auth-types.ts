export type DemoAuthUser = {
  kind: 'demo';
  username: 'admin' | 'employee';
};

export type GoogleAuthUser = {
  kind: 'google';
  subject: string;
  email: string;
  name: string | null;
};

export type AuthUser = DemoAuthUser | GoogleAuthUser;
