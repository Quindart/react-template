import { Search, Satellite, Signpost, X } from 'lucide-react';
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Card, CardContent } from '~/components/ui/card';
import {
  cityGrdp,
  cityGrdpHistorySource,
  type CityGrdpYear,
  getCityGrowth,
} from './city-grdp-data';

const CityGrowthMap = lazy(async () => {
  const module = await import('./city-growth-map');
  return { default: module.CityGrowthMap };
});

const defaultCity =
  cityGrdp.find((city) => city.id === 'hai-phong') ?? cityGrdp[0];
const comparisonDefault =
  cityGrdp.find((city) => city.id === 'hanoi') ?? cityGrdp[1];

function formatGrowth(value: number) {
  return `${value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function CityGrowthView() {
  const [selectedId, setSelectedId] = useState(defaultCity.id);
  const [comparisonId, setComparisonId] = useState(comparisonDefault.id);
  const [year, setYear] = useState<CityGrdpYear>(2025);
  const [basemap, setBasemap] = useState<'street' | 'satellite'>('street');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const selectedCity =
    cityGrdp.find((city) => city.id === selectedId) ?? defaultCity;
  const comparisonCity =
    cityGrdp.find((city) => city.id === comparisonId) ?? comparisonDefault;
  const selectedGrowth = getCityGrowth(selectedCity.id, year);
  const comparisonGrowth = getCityGrowth(comparisonCity.id, year);
  const selectedRank =
    [...cityGrdp]
      .sort((a, b) => getCityGrowth(b.id, year) - getCityGrowth(a.id, year))
      .findIndex((city) => city.id === selectedId) + 1;
  const filteredCities = useMemo(
    () =>
      cityGrdp.filter((city) =>
        city.name
          .toLocaleLowerCase('vi')
          .includes(search.trim().toLocaleLowerCase('vi')),
      ),
    [search],
  );
  const handleWebglFailure = useCallback(() => setWebglFailed(true), []);

  useEffect(() => setMounted(true), []);

  return (
    <Card className="overflow-hidden border-slate-800 bg-slate-950 text-white shadow-lg shadow-slate-900/10">
      <CardContent className="grid gap-0 p-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="relative min-h-[390px] overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#123b50,#071624_66%)] sm:min-h-[470px]">
          <div className="pointer-events-none absolute left-5 top-5 z-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200/70">
              Thành phố đang xem
            </p>
            <h3 className="mt-1 text-lg font-semibold">{selectedCity.name}</h3>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-white">
              {formatGrowth(selectedGrowth)}
            </p>
            <p className="text-xs text-slate-300">Tăng trưởng GRDP ước tính</p>
          </div>

          {mounted ? (
            <Suspense
              fallback={
                <div className="absolute inset-0 grid place-items-center text-sm text-slate-300">
                  Đang dựng bản đồ 3D…
                </div>
              }
            >
              <CityGrowthMap
                selectedId={selectedId}
                year={year}
                basemap={basemap}
                onSelect={setSelectedId}
                onWebglFailure={handleWebglFailure}
              />
            </Suspense>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-slate-300">
              Đang dựng bản đồ thành phố…
            </div>
          )}
          {webglFailed && (
            <div className="pointer-events-none absolute inset-x-0 bottom-12 z-[700] mx-auto w-fit rounded-full bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300">
              3D không khả dụng · xem bảng thành phố bên cạnh
            </div>
          )}

          <div className="pointer-events-none absolute bottom-4 left-5 z-[650] flex items-center gap-2 rounded-full bg-slate-950/75 px-2.5 py-1 text-[10px] text-slate-300">
            <span className="size-1.5 rounded-full bg-teal-300 shadow-[0_0_10px_#5eead4]" />
            Tháp khối hộp · Chiều cao theo tăng trưởng
          </div>
          <div className="absolute right-3 top-3 z-[650] flex gap-1 rounded-xl border border-white/20 bg-white/95 p-1 shadow-lg">
            <button
              type="button"
              aria-pressed={basemap === 'street'}
              onClick={() => setBasemap('street')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs ${basemap === 'street' ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <Signpost aria-hidden="true" className="size-3.5" /> Phố
            </button>
            <button
              type="button"
              aria-pressed={basemap === 'satellite'}
              onClick={() => setBasemap('satellite')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs ${basemap === 'satellite' ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <Satellite aria-hidden="true" className="size-3.5" /> Vệ tinh
            </button>
          </div>
        </div>

        <div className="border-t border-border bg-background p-4 text-foreground sm:p-5 lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Khám phá thành phố</h3>
              <p className="mt-1 text-xs text-slate-400">
                Tăng trưởng GRDP · {year} {year === 2025 ? 'ước tính' : 'sơ bộ'}
              </p>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
              {year === 2025 ? '2025 · Ước tính' : '2024 · Sơ bộ'}
            </span>
          </div>
          <div className="mb-3 rounded-xl bg-muted/50 px-3 py-2">
            <label
              htmlFor="city-year-slider"
              className="flex items-center justify-between text-xs font-medium"
            >
              <span>Dòng thời gian GRDP</span>
              <span>{year}</span>
            </label>
            <input
              id="city-year-slider"
              type="range"
              min={2024}
              max={2025}
              step={1}
              value={year}
              onChange={(event) =>
                setYear(Number(event.target.value) as CityGrdpYear)
              }
              aria-valuetext={`${year}${year === 2025 ? ' ước tính' : ' sơ bộ'}`}
              className="mt-2 h-2 w-full cursor-pointer accent-teal-700"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>2024 · Sơ bộ</span>
              <span>2025 · Ước tính</span>
            </div>
          </div>
          <label className="mb-3 flex items-center gap-2 rounded-lg border border-border px-3 py-2 focus-within:ring-2 focus-within:ring-teal-500">
            <Search
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm thành phố…"
              aria-label="Tìm thành phố"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                aria-label="Xóa tìm kiếm"
                onClick={() => setSearch('')}
              >
                <X className="size-4" />
              </button>
            )}
          </label>
          <div className="max-h-[260px] space-y-1.5 overflow-auto">
            {[...filteredCities]
              .sort(
                (left, right) =>
                  getCityGrowth(right.id, year) - getCityGrowth(left.id, year),
              )
              .map((city, index) => (
                <button
                  key={city.id}
                  type="button"
                  aria-pressed={selectedId === city.id}
                  onClick={() => setSelectedId(city.id)}
                  className={`group w-full rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 ${
                    selectedId === city.id
                      ? 'border-teal-300/50 bg-teal-50'
                      : 'border-transparent hover:border-border hover:bg-muted/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-5 text-xs tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
                      style={{ color: city.color, backgroundColor: city.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {city.name}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-teal-700">
                      {formatGrowth(getCityGrowth(city.id, year))}
                    </span>
                  </span>
                  <span className="ml-8 mt-2 block h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${(getCityGrowth(city.id, year) / 12) * 100}%`,
                        backgroundColor: city.color,
                      }}
                    />
                  </span>
                </button>
              ))}
            {filteredCities.length === 0 && (
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                Không tìm thấy thành phố phù hợp.
              </p>
            )}
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">So sánh thành phố</h4>
              <select
                aria-label="Chọn thành phố so sánh"
                value={comparisonId}
                onChange={(event) => setComparisonId(event.target.value)}
                className="max-w-[170px] rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
              >
                {cityGrdp.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[selectedCity, comparisonCity].map((city) => (
                <div key={city.id} className="rounded-xl bg-muted/50 p-3">
                  <p className="truncate text-xs text-muted-foreground">
                    {city.shortName}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatGrowth(getCityGrowth(city.id, year))}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Chênh lệch:{' '}
              <strong className="text-foreground">
                {formatGrowth(Math.abs(selectedGrowth - comparisonGrowth))}
              </strong>{' '}
              điểm phần trăm
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/60 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {selectedCity.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Hạng {selectedRank}/6 · tăng trưởng GRDP {year}
                </p>
              </div>
              <span className="text-lg font-bold tabular-nums text-teal-800">
                {formatGrowth(selectedGrowth)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-teal-200/70 pt-2 text-xs">
              <span className="text-muted-foreground">So với 2024</span>
              <strong className="text-foreground">
                {getCityGrowth(selectedCity.id, 2025) >=
                getCityGrowth(selectedCity.id, 2024)
                  ? '+'
                  : ''}
                {(
                  getCityGrowth(selectedCity.id, 2025) -
                  getCityGrowth(selectedCity.id, 2024)
                ).toLocaleString('vi-VN', { minimumFractionDigits: 2 })}{' '}
                điểm %
              </strong>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <span className="rounded-lg bg-white/70 px-2 py-1.5 text-muted-foreground">
                2024{' '}
                <strong className="ml-1 text-foreground">
                  {formatGrowth(getCityGrowth(selectedCity.id, 2024))}
                </strong>
              </span>
              <span className="rounded-lg bg-white/70 px-2 py-1.5 text-muted-foreground">
                2025{' '}
                <strong className="ml-1 text-foreground">
                  {formatGrowth(getCityGrowth(selectedCity.id, 2025))}
                </strong>
              </span>
            </div>
          </div>
          <a
            href={cityGrdpHistorySource}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block text-[11px] text-muted-foreground hover:text-teal-700 hover:underline"
          >
            Nguồn số liệu 2024 · Niên giám Thống kê
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
