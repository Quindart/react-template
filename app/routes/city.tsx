import { ArrowUpRight, MapPinned, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import {
  cityGrdp,
  cityGrdpHistorySource,
  cityGrdpSource,
} from '~/features/city/city-grdp-data';
import { CityGrowthView } from '~/features/city/city-growth-view';

export function meta() {
  return [{ title: 'Tăng trưởng thành phố | Workspace' }];
}

export const handle = { breadcrumb: 'Tăng trưởng thành phố' };

export default function CityGrowth() {
  const average =
    cityGrdp.reduce((total, city) => total + city.growth, 0) / cityGrdp.length;
  const leadingCity = cityGrdp.reduce((leader, city) =>
    city.growth > leader.growth ? city : leader,
  );

  return (
    <section
      aria-label="Tăng trưởng GRDP thành phố"
      className="mx-auto w-full max-w-[1600px] space-y-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Bức tranh kinh tế đô thị · 2025
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Tăng trưởng GRDP thành phố
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Khám phá tốc độ tăng trưởng ước tính của sáu thành phố trực thuộc
            Trung ương trên bản đồ 3D.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800">
          <span className="size-2 rounded-full bg-teal-500" />
          Số liệu ước tính năm 2025
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Số thành phố</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">06</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Trực thuộc Trung ương
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Tăng trưởng bình quân
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {average.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Trong sáu thành phố
            </p>
          </CardContent>
        </Card>
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 to-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Tăng trưởng cao nhất
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="truncate text-2xl font-semibold">
                {leadingCity.name}
              </p>
              <TrendingUp
                aria-hidden="true"
                className="size-5 shrink-0 text-teal-600"
              />
            </div>
            <p className="mt-1 text-xs font-medium text-teal-700">
              {leadingCity.growth.toLocaleString('vi-VN')}% GRDP
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <MapPinned aria-hidden="true" className="size-5 text-teal-600" />
        <h2 className="text-lg font-semibold tracking-tight">
          Bản đồ tăng trưởng
        </h2>
        <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs text-slate-600">
          6 thành phố
        </span>
      </div>
      <CityGrowthView />

      <div className="flex flex-wrap items-start justify-between gap-3 border-t pt-4 text-xs leading-5 text-muted-foreground">
        <p className="max-w-3xl">
          GRDP là tổng sản phẩm trên địa bàn. Vị trí trên mô hình 3D thể hiện
          tương quan địa lý; cột biểu thị tốc độ tăng trưởng, không biểu thị quy
          mô kinh tế. Số liệu năm 2025 được tổng hợp theo địa giới 34 tỉnh,
          thành phố sau sắp xếp; số liệu 2024 theo địa giới 63 tỉnh, thành phố,
          nên biến động qua năm không hoàn toàn cùng phạm vi so sánh.
        </p>
        <div className="flex shrink-0 flex-col gap-1">
          <a
            href={cityGrdpSource}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline"
          >
            Nguồn GRDP 2025{' '}
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
          <a
            href={cityGrdpHistorySource}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline"
          >
            Niên giám 2024{' '}
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
