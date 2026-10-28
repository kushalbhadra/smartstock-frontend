import type { ReactNode } from 'react';

interface PageHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center
                        justify-between gap-4 mb-6">
            <div>
                {eyebrow && (
                    <p className="text-[10px] font-bold uppercase
                                  tracking-[0.16em] text-indigo-600">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-2xl font-bold tracking-tight
                               text-slate-900 mt-1.5">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-slate-500 mt-1.5">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3 flex-wrap">
                    {actions}
                </div>
            )}
        </div>
    );
}