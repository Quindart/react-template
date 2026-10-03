import { Fragment } from 'react';
import { Link, useMatches } from 'react-router';
import { LogOut, UserRound } from 'lucide-react';
import { useAuthStore } from '~/features/auth/auth-store';
import { useLogout } from '~/features/auth/use-logout';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Separator } from '~/components/ui/separator';
import { SidebarTrigger } from '~/components/ui/sidebar';

export function AppHeader() {
  const matches = useMatches();
  const user = useAuthStore((state) => state.user);
  const { logout, isPending } = useLogout();
  const breadcrumbs = matches.flatMap((match) => {
    const handle = match.handle;
    if (
      typeof handle !== 'object' ||
      handle === null ||
      !('breadcrumb' in handle) ||
      typeof handle.breadcrumb !== 'string'
    )
      return [];
    return [{ id: match.id, href: match.pathname, label: handle.breadcrumb }];
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6">
      <SidebarTrigger aria-label="Bật/tắt thanh điều hướng" />
      <Separator orientation="vertical" className="!h-4" />
      <Breadcrumb aria-label="Đường dẫn hiện tại" className="min-w-0 flex-1">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.id}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="min-w-0">
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage className="truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            aria-label="Menu tài khoản"
          >
            <Avatar className="size-9 border">
              <AvatarFallback>
                <UserRound className="!size-5" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-1">
            <p className="text-xs font-normal text-muted-foreground">
              Tài khoản
            </p>
            <p className="truncate">{user?.username}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isPending}
            onSelect={() => void logout()}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut aria-hidden="true" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
