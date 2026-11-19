import type { ElementType } from 'react';

export function PageLoader() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    );
}

export function TableSkeleton({ cols = 5, rows = 6 }: {
    cols?: number;
    rows?: number;
}) {
    return (
        <div className="p-5 space-y-3">
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-4">
                    {Array.from({ length: cols }).map((_, c) => (
                        <div
                            key={c}
                            className="h-4 bg-slate-100 rounded flex-1 animate-pulse"
                            style={{ animationDelay: `${r * 80 + c * 40}ms` }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <article className="card flex items-center gap-4 p-5">
            <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-7 w-16 animate-pulse rounded bg-slate-100" />
            </div>
        </article>
    );
}

export function ChartSkeleton() {
    return (
        <section className="card p-5" aria-hidden="true">
            <div className="mb-5 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-56 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
        </section>
    );
}

export function ActivitySkeleton() {
    return (
        <section className="card overflow-hidden" aria-hidden="true">
            <div className="flex items-center justify-between px-5 py-4">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
            <TableSkeleton cols={4} rows={4} />
        </section>
    );
}

export function NotificationSkeleton() {
    return (
        <div className="space-y-3" aria-label="Loading notifications">
            {Array.from({ length: 4 }).map((_, index) => (
                <article key={index}
                    className="card flex items-start gap-4 p-4"
                    aria-hidden="true">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl
                                    bg-slate-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 max-w-full animate-pulse
                                        rounded bg-slate-100" />
                        <div className="h-3 w-full animate-pulse rounded
                                        bg-slate-100" />
                        <div className="h-3 w-2/3 animate-pulse rounded
                                        bg-slate-100" />
                    </div>
                </article>
            ))}
        </div>
    );
}

export function ForecastSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading forecasts">
            {Array.from({ length: 6 }).map((_, index) => (
                <article key={index} className="card space-y-4 p-5"
                    aria-hidden="true">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
                        <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
                    </div>
                    <div className="h-2 animate-pulse rounded bg-slate-100" />
                    <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-10 animate-pulse rounded bg-slate-100" />
                </article>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-7" aria-label="Loading dashboard">
            <div className="space-y-2" aria-hidden="true">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-8 w-64 max-w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
            </div>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <StatCardSkeleton key={index} />
                ))}
            </section>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                aria-hidden="true">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index}
                        className="card h-14 animate-pulse bg-slate-100" />
                ))}
            </section>
            <section className="grid gap-5 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <ChartSkeleton key={index} />
                ))}
            </section>
            <section className="grid gap-5 xl:grid-cols-2">
                <ActivitySkeleton />
                <ActivitySkeleton />
            </section>
            <NotificationSkeleton />
        </div>
    );
}

export function EmptyState({ icon: Icon, title, message }: {
    icon: ElementType;
    title: string;
    message: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700">{title}</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">{message}</p>
        </div>
    );
}