import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  ShoppingBag,
  Target,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '~/features/auth/auth-store';
import { Card, CardContent } from '~/components/ui/card';
import { OverviewCharts } from '~/features/dashboard/overview-charts';
export function meta() {
  return [{ title: 'Trang chủ | Workspace' }];
}
export const handle = { breadcrumb: 'Trang chủ' };

const metrics = [
  {
    label: 'Tổng doanh thu',
    value: '1,116 tỷ',
    change: '+24,8%',
    detail: 'so với cùng kỳ năm trước',
    icon: Wallet,
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    label: 'Tổng đơn hàng',
    value: '2.790',
    change: '+18,6%',
    detail: 'so với cùng kỳ năm trước',
    icon: ShoppingBag,
    color: 'bg-teal-50 text-teal-600',
  },
  {
    label: 'Khách hàng mới',
    value: '1.842',
    change: '+12,4%',
    detail: 'so với cùng kỳ năm trước',
    icon: Users,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    label: 'Tỷ lệ chuyển đổi',
    value: '4,28%',
    change: '+0,8 đpt',
    detail: 'so với cùng kỳ năm trước',
    icon: Target,
    color: 'bg-amber-50 text-amber-600',
  },
];

export default function Home() {
  const user = useAuthStore((state) => state.user);
  return (
    <section
      aria-label="Trang chủ"
      className="@container mx-auto w-full max-w-[1600px] space-y-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Tổng quan hoạt động
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Xin chào, {user?.username}!
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Theo dõi các chỉ số và khám phá câu chuyện phía sau dữ liệu.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-xs font-medium text-slate-600">
          <CalendarDays aria-hidden="true" className="size-4 text-slate-400" />
          Tháng 1 – Tháng 6, 2026
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, change, detail, icon: Icon, color }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {label}
                </p>
                <span className={`rounded-xl p-2.5 ${color}`}>
                  <Icon aria-hidden="true" className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                {value}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
                <span className="inline-flex items-center font-semibold text-emerald-700">
                  <ArrowUpRight
                    aria-hidden="true"
                    className="mr-0.5 size-3.5"
                  />
                  {change}
                </span>
                <span className="text-muted-foreground">{detail}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ChartNoAxesCombined
              aria-hidden="true"
              className="size-5 text-indigo-500"
            />
            <h2 className="text-lg font-semibold tracking-tight">
              Phân tích trực quan
            </h2>
            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs text-slate-600">
              8 biểu đồ
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-amber-500"
            />
            Dữ liệu minh họa
          </span>
        </div>
        <OverviewCharts />
      </div>
      <p className="pb-2 text-center text-xs leading-5 text-muted-foreground">
        Các số liệu trên trang là dữ liệu mẫu, phục vụ minh họa giao diện.
      </p>
    </section>
  );
}
