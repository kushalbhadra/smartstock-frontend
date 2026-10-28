import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { alertApi } from '../api/alertApi';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { EmptyRow, TableWrap, Td, Th } from '../components/Table';
import { timeAgo } from '../utils/format';
import type { AlertLog, AlertStatus, AlertType } from '../types';

const TYPE_TONE: Record<AlertType,
    'red'|'orange'|'blue'|'green'> = {
    LOW_STOCK:      'red',
    ANOMALY:        'orange',
    PO_STATUS:      'blue',
    FORECAST_READY: 'green',
};

const STATUS_TONE: Record<AlertStatus,
    'green'|'red'|'slate'> = {
    SENT:    'green',
    FAILED:  'red',
    SKIPPED: 'slate',
};

export default function AlertsPage() {
    const toast = useToast();

    const [alerts, setAlerts]         = useState<AlertLog[] | null>(null);
    const [typeFilter, setTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        alertApi.getAll()
            .then(setAlerts)
            .catch(() => toast.error('Failed to load alerts'));
    }, []);

    const filtered = alerts?.filter(a => {
        const matchType =
            typeFilter === 'All' || a.alertType === typeFilter;
        const matchStatus =
            statusFilter === 'All' || a.status === statusFilter;
        return matchType && matchStatus;
    }) ?? [];

    // Stats per type
    const typeCounts = (['LOW_STOCK', 'ANOMALY',
        'PO_STATUS', 'FORECAST_READY'] as AlertType[])
        .map(t => ({
            type: t,
            count: alerts?.filter(a => a.alertType === t).length ?? 0,
        }));

    return (
        <>
            <PageHeader
                eyebrow="Notifications"
                title="WhatsApp Alerts"
                description="History of alerts sent via WhatsApp."
                actions={
                    <div className="flex gap-3">
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className="input sm:max-w-[160px]"
                        >
                            <option value="All">All Types</option>
                            <option value="LOW_STOCK">Low Stock</option>
                            <option value="ANOMALY">Anomaly</option>
                            <option value="PO_STATUS">PO Status</option>
                            <option value="FORECAST_READY">
                                Forecast Ready
                            </option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="input sm:max-w-[140px]"
                        >
                            <option value="All">All Status</option>
                            <option value="SENT">Sent</option>
                            <option value="FAILED">Failed</option>
                            <option value="SKIPPED">Skipped</option>
                        </select>
                    </div>
                }
            />

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {typeCounts.map(({ type, count }) => (
                    <div key={type}
                         className="card p-4 flex items-center
                                    justify-between">
                        <div>
                            <p className="text-xs text-slate-400">
                                {type.replace('_', ' ')}
                            </p>
                            <p className="text-2xl font-bold mt-1">
                                {count}
                            </p>
                        </div>
                        <Badge tone={TYPE_TONE[type]}>
                            {type.split('_')[0]}
                        </Badge>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card">
                {!alerts ? (
                    <TableSkeleton cols={5} />
                ) : alerts.length === 0 ? (
                    <EmptyState
                        icon={Zap}
                        title="No alerts yet"
                        message="WhatsApp alert history will appear here."
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>Type</Th>
                                <Th>Message</Th>
                                <Th>Sent To</Th>
                                <Th>Status</Th>
                                <Th>Time</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <EmptyRow
                                    colSpan={5}
                                    message="No alerts match your filters"
                                />
                            ) : filtered.map(a => (
                                <tr key={a.id}
                                    className="hover:bg-slate-50/60
                                               transition-colors">
                                    <Td>
                                        <Badge
                                            tone={TYPE_TONE[a.alertType]}
                                        >
                                            {a.alertType.replace('_', ' ')}
                                        </Badge>
                                    </Td>
                                    <Td className="max-w-[300px] text-xs">
                                        {a.message}
                                    </Td>
                                    <Td className="font-medium
                                                   text-slate-700">
                                        {a.user?.name ?? '—'}
                                    </Td>
                                    <Td>
                                        <Badge
                                            tone={STATUS_TONE[a.status]}
                                        >
                                            {a.status}
                                        </Badge>
                                    </Td>
                                    <Td className="text-slate-500
                                                   text-xs whitespace-nowrap">
                                        {timeAgo(a.sentAt)}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                )}
            </div>
        </>
    );
}