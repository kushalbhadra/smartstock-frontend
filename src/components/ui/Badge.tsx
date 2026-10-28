type BadgeTone =
    | 'green' | 'yellow' | 'red' | 'blue'
    | 'indigo' | 'purple' | 'orange' | 'slate';

interface BadgeProps {
    children: React.ReactNode;
    tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
    green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red:    'bg-rose-50 text-rose-700 border-rose-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    slate:  'bg-slate-100 text-slate-600 border-slate-200',
};

export function Badge({ children, tone = 'slate' }: BadgeProps) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${toneClasses[tone]}`}>
            {children}
        </span>
    );
}