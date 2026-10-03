import { CircleCheck } from 'lucide-react';
import { useAuthStore } from '~/features/auth/auth-store';
import { Card, CardContent } from '~/components/ui/card';
export function meta() {
  return [{ title: 'Trang chủ | Workspace' }];
}
export const handle = { breadcrumb: 'Trang chủ' };

export default function Home() {
  const user = useAuthStore((state) => state.user);
  return (
    <section aria-label="Trang chủ" className="w-full">
      <Card className="w-full max-w-2xl">
        <CardContent className="space-y-6 p-8">
          <CircleCheck
            aria-hidden="true"
            className="size-10 text-emerald-600"
          />
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Không gian làm việc
            </p>
            <h1 className="text-3xl font-semibold">
              Xin chào, {user?.username}!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Bạn đã đăng nhập thành công. Chúc bạn một ngày làm việc hiệu quả.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
