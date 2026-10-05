import { useState } from 'react';
import {
  Form,
  replace,
  useLocation,
  useNavigation,
  useSearchParams,
} from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  LoaderCircle,
  Search,
  Users,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { pageSizes, queryUsers } from '~/features/users/user-query';
import { UserTable } from '~/features/users/user-table';
import { directoryUsers, type UserRecord } from '~/features/users/user-data';
import { useEmployeeAccountStore } from '~/features/auth/employee-account-store';
import type { Route } from './+types/users';

export function meta() {
  return [{ title: 'Quản lý người dùng | Workspace' }];
}

export const handle = {
  breadcrumb: 'Quản lý người dùng',
  accessResource: 'users',
};

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const result = queryUsers(url.searchParams);
  const normalized = new URLSearchParams(url.searchParams);
  for (const [key, value] of Object.entries({
    page: String(result.page),
    limit: String(result.limit),
    search_key: result.searchKey,
  })) {
    if (normalized.has(key)) {
      if (value) normalized.set(key, value);
      else normalized.delete(key);
    }
  }
  if (normalized.toString() !== url.searchParams.toString()) {
    throw replace(`${url.pathname}${normalized.size ? `?${normalized}` : ''}`);
  }
  return result;
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { rows, filtered, total, page, limit, pageCount, searchKey } =
    loaderData;
  const employeeActive = useEmployeeAccountStore((state) => state.active);
  function withAccountStatus(user: UserRecord): UserRecord {
    return user.username === 'employee'
      ? { ...user, status: employeeActive ? 'Hoạt động' : 'Tạm khóa' }
      : user;
  }
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigation = useNavigation();
  const pending = navigation.state !== 'idle';
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  function updateQuery(
    nextPage: number,
    nextLimit = limit,
    nextSearch = searchKey,
  ) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    next.set('limit', String(nextLimit));
    if (nextSearch) next.set('search_key', nextSearch);
    else next.delete('search_key');
    setSearchParams(next, { preventScrollReset: true });
  }

  async function handleExport() {
    setExporting(true);
    setExportError('');
    try {
      const { exportUsers } = await import('~/features/users/export-users');
      await exportUsers(filtered.map(withAccountStatus));
    } catch {
      setExportError('Không thể xuất Excel. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  }

  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstPage + index,
  );

  return (
    <section
      aria-label="Quản lý người dùng"
      className="mx-auto w-full max-w-[1600px] space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Không gian làm việc
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Quản lý người dùng
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tra cứu thông tin, duyệt danh sách và xuất dữ liệu người dùng.
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
          {directoryUsers.length} người dùng · Dữ liệu mẫu
        </span>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Users aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Danh sách người dùng</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Xuất Excel gồm tất cả kết quả đang lọc.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting || pending || !total}
          >
            {exporting ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <Download aria-hidden="true" />
            )}
            {exporting ? 'Đang xuất…' : `Xuất Excel (${total})`}
          </Button>
        </div>
        {exportError && (
          <p role="alert" className="px-5 pt-4 text-sm text-destructive">
            {exportError}
          </p>
        )}

        <Form
          key={location.key}
          method="get"
          preventScrollReset
          className="space-y-2 p-5"
          role="search"
          aria-label="Tìm kiếm người dùng"
        >
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="limit" value={limit} />
          <Label htmlFor="user-search">Tìm kiếm người dùng</Label>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-[1_1_280px]">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
              />
              <Input
                id="user-search"
                name="search_key"
                type="search"
                defaultValue={searchKey}
                placeholder="Nhập tên, số điện thoại, email hoặc mã người dùng…"
                aria-describedby="user-search-help"
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={pending}>
              Tìm kiếm
            </Button>
            {searchKey && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => updateQuery(1, limit, '')}
                disabled={pending}
              >
                Xóa tìm kiếm
              </Button>
            )}
          </div>
          <p
            id="user-search-help"
            className="text-xs leading-5 text-muted-foreground"
          >
            Tìm theo tên, SĐT, email hoặc mã. Hỗ trợ tên không dấu. Nhấn Enter
            hoặc Tìm kiếm để lọc.
          </p>
        </Form>

        <div aria-busy={pending} className={pending ? 'opacity-60' : ''}>
          <UserTable users={rows.map(withAccountStatus)} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t p-5">
          <div className="flex flex-wrap items-center gap-4">
            <p role="status" className="text-sm text-muted-foreground">
              {pending
                ? 'Đang tải…'
                : `Hiển thị ${total ? (page - 1) * limit + 1 : 0}–${Math.min(page * limit, total)} / ${total} người dùng`}
            </p>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="user-limit"
                className="text-xs text-muted-foreground"
              >
                Số dòng mỗi trang
              </Label>
              <select
                id="user-limit"
                value={limit}
                disabled={pending}
                onChange={(event) => updateQuery(1, Number(event.target.value))}
                className="h-9 rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <nav
            aria-label="Phân trang người dùng"
            className="flex flex-wrap items-center gap-1"
          >
            <Button
              variant="outline"
              size="icon"
              aria-label="Trang đầu"
              disabled={pending || page === 1}
              onClick={() => updateQuery(1)}
            >
              <ChevronsLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Trang trước"
              disabled={pending || page === 1}
              onClick={() => updateQuery(page - 1)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            {visiblePages.map((number) => (
              <Button
                key={number}
                variant={number === page ? 'default' : 'ghost'}
                size="icon"
                aria-label={`Trang ${number}`}
                aria-current={number === page ? 'page' : undefined}
                disabled={pending}
                onClick={() => updateQuery(number)}
              >
                {number}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              aria-label="Trang sau"
              disabled={pending || page === pageCount}
              onClick={() => updateQuery(page + 1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Trang cuối"
              disabled={pending || page === pageCount}
              onClick={() => updateQuery(pageCount)}
            >
              <ChevronsRight aria-hidden="true" />
            </Button>
            <span className="ml-2 text-xs text-muted-foreground">
              Trang {page}/{pageCount}
            </span>
          </nav>
        </div>
      </div>
    </section>
  );
}
