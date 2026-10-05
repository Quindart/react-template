import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';
export default [
  index('routes/index.tsx'),
  route('login', 'routes/login.tsx'),
  layout('routes/workspace.tsx', [
    route('home', 'routes/home.tsx'),
    route('users', 'routes/users.tsx'),
  ]),
] satisfies RouteConfig;
