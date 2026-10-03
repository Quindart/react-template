import { LoginForm } from '~/features/auth/login-form';
export function meta() {
  return [{ title: 'Đăng nhập | Workspace' }];
}
export default function Login() {
  return <LoginForm />;
}
