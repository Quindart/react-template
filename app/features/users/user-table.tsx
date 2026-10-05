import { SearchX } from 'lucide-react';
import type { UserRecord } from './user-data';

export function UserTable({ users }: { users: UserRecord[] }) {
  return (
    <div
      className="overflow-x-auto"
      role="region"
      aria-label="Bảng người dùng"
      tabIndex={0}
    >
      <table className="w-full min-w-[820px] text-left text-sm">
        <caption className="sr-only">Danh sách người dùng giả lập</caption>
        <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
          <tr>
            {[
              'Mã người dùng',
              'Họ và tên',
              'Số điện thoại',
              'Email',
              'Vai trò',
              'Trạng thái',
            ].map((label) => (
              <th key={label} scope="col" className="px-5 py-3.5 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="transition-colors hover:bg-muted/30">
              <td className="px-5 py-4 text-xs tabular-nums text-muted-foreground">
                {user.id}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600"
                  >
                    {user.name
                      .split(' ')
                      .slice(-2)
                      .map((part) => part[0])
                      .join('')}
                  </span>
                  <span className="font-medium">{user.name}</span>
                </div>
              </td>
              <td className="px-5 py-4 tabular-nums">{user.phone}</td>
              <td className="px-5 py-4 text-muted-foreground">{user.email}</td>
              <td className="whitespace-nowrap px-5 py-4">
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                  {user.role}
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${user.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-current"
                  />
                  {user.status}
                </span>
              </td>
            </tr>
          ))}
          {!users.length && (
            <tr>
              <td colSpan={6} className="px-5 py-16 text-center">
                <SearchX
                  aria-hidden="true"
                  className="mx-auto mb-3 size-8 text-muted-foreground"
                />
                <p className="font-medium">Không tìm thấy người dùng</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thử từ khóa khác hoặc xóa tìm kiếm.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
