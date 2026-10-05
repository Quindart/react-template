import { useId, type ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { cn } from '~/lib/utils';

type LegendItem = { name: string; color: string; value?: string };

export function ChartCard({
  title,
  type,
  description,
  footer,
  legend,
  className,
  children,
}: {
  title: string;
  type: string;
  description: string;
  footer: string;
  legend: LegendItem[];
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <Card
      className={cn(
        'min-w-0 overflow-hidden border-slate-200/80 shadow-sm',
        className,
      )}
    >
      <figure aria-labelledby={id} className="flex h-full flex-col">
        <CardHeader className="gap-2 p-5 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id={id} className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium tracking-wide text-slate-500">
              {type}
            </span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col px-4 pb-4 pt-2">
          <div className="h-[250px] w-full min-w-0 text-xs">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              {children}
            </ResponsiveContainer>
          </div>
          <ul
            aria-label="Chú thích"
            className="mt-3 flex min-h-10 flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
          >
            {legend.map((item) => (
              <li key={item.name} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
                {item.value && (
                  <span className="font-semibold text-foreground">
                    {item.value}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
        <figcaption className="border-t bg-slate-50/60 px-5 py-3 text-xs leading-5 text-muted-foreground">
          {footer}
        </figcaption>
      </figure>
    </Card>
  );
}
