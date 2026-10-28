import type { ReactNode } from 'react';

export function TableWrap({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
                {children}
            </table>
        </div>
    );
}

export function Th({ children }: { children: ReactNode }) {
    return (
        <th className="px-5 py-3.5 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            {children}
        </th>
    );
}

export function Td({ children, className }: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <td className={`px-5 py-4 border-t border-slate-100 text-slate-600 align-middle ${className ?? ''}`}>
            {children}
        </td>
    );
}

export function EmptyRow({ colSpan, message }: {
    colSpan: number;
    message: string;
}) {
    return (
        <tr>
            <td colSpan={colSpan} className="text-center py-12 text-slate-400 text-sm">
                {message}
            </td>
        </tr>
    );
}