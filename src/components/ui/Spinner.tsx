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