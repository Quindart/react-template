import { LogOut, CircleCheck } from 'lucide-react';
import { AuthGate } from '~/features/auth/auth-gate';
import { useAuthStore } from '~/features/auth/auth-store';
import { useLogout } from '~/features/auth/use-logout';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
export function meta() {
  return [{ title: 'Trang chủ | Workspace' }];
}
function HomeContent() {
  const user = useAuthStore((state) => state.user);
  const { logout, isPending } = useLogout();
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-lg">
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
          <Button
            type="button"
            variant="outline"
            onClick={logout}
            disabled={isPending}
          >
            <LogOut aria-hidden="true" />
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
export default function Home() {
  return (
    <AuthGate>
      <HomeContent />
    </AuthGate>
  );
}
