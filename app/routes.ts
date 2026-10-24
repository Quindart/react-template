import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';
export default [
  index('routes/index.tsx'),
  route('login', 'routes/login.tsx'),
  route('auth/google', 'routes/auth.google.tsx'),
  route('auth/google/callback', 'routes/auth.google.callback.tsx'),
  route('auth/session', 'routes/auth.session.tsx'),
  layout('routes/workspace.tsx', [
    route('home', 'routes/home.tsx'),
    route('users', 'routes/users.tsx'),
  ]),
] satisfies RouteConfig;
