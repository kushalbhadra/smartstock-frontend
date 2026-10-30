import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    NOTIFICATIONS_UPDATED_EVENT,
    notificationApi,
} from '../api/notificationApi';
import type {
    AppNotification,
    NotificationSeverity,
    NotificationType,
    NotificationPage as NotificationPageData,
} from '../types';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState, PageLoader } from '../components/ui/Spinner';
import { useToast } from '../context/useToast';
import { timeAgo } from '../utils/format';

const TYPES: NotificationType[] = [
    'LOW_STOCK',
    'OUT_OF_STOCK',
    'OVERSTOCK',
    'WAREHOUSE_NEAR_CAPACITY',
    'WAREHOUSE_CAPACITY_FULL',
    'WAREHOUSE_CAPACITY_EXCEEDED',
    'FORECAST_ANOMALY',
    'PURCHASE_ORDER_APPROVED',
    'PURCHASE_ORDER_PARTIALLY_RECEIVED',
    'PURCHASE_ORDER_RECEIVED',
];

const TYPE_LABELS: Record<NotificationType, string> = {
    LOW_STOCK: 'Low stock',
    OUT_OF_STOCK: 'Out of stock',
    OVERSTOCK: 'Overstock',
    WAREHOUSE_NEAR_CAPACITY: 'Warehouse nearing capacity',
    WAREHOUSE_CAPACITY_FULL: 'Warehouse at capacity',
    WAREHOUSE_CAPACITY_EXCEEDED: 'Warehouse capacity exceeded',
    FORECAST_ANOMALY: 'Forecast anomaly',
    PURCHASE_ORDER_APPROVED: 'Purchase order approved',
    PURCHASE_ORDER_PARTIALLY_RECEIVED: 'Purchase order partially received',
    PURCHASE_ORDER_RECEIVED: 'Purchase order received',
};

const TYPE_TONE: Record<NotificationType, 'red' | 'orange' | 'blue' | 'green'> = {
    LOW_STOCK: 'orange',
    OUT_OF_STOCK: 'red',
    OVERSTOCK: 'red',
    WAREHOUSE_NEAR_CAPACITY: 'blue',
    WAREHOUSE_CAPACITY_FULL: 'red',
    WAREHOUSE_CAPACITY_EXCEEDED: 'red',
    FORECAST_ANOMALY: 'green',
    PURCHASE_ORDER_APPROVED: 'blue',
    PURCHASE_ORDER_PARTIALLY_RECEIVED: 'blue',
    PURCHASE_ORDER_RECEIVED: 'green',
};

function targetPath(notification: AppNotification): string {
    switch (notification.targetType) {
        case 'STOCK':
            return `/stock?stockId=${notification.targetId}`;
        case 'WAREHOUSE':
            return `/warehouses?warehouseId=${notification.targetId}`;
        case 'PRODUCT':
            return `/products?productId=${notification.targetId}`;
        case 'PURCHASE_ORDER':
            return `/purchase-orders?purchaseOrderId=${notification.targetId}`;
    }
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { error: showError, success: showSuccess } = useToast();
    const [data, setData] = useState<NotificationPageData | null>(null);
    const [type, setType] = useState<NotificationType | ''>('');
    const [severity, setSeverity] = useState<NotificationSeverity | ''>('');
    const [active, setActive] = useState<boolean | ''>('');
    const [unread, setUnread] = useState<boolean | ''>('');
    const [page, setPage] = useState(0);
    const [markingAll, setMarkingAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const loadNotifications = useCallback(async () => {
        setLoadError(false);
        try {
            const filters = {
                ...(type ? { type } : {}),
                ...(severity ? { severity } : {}),
                ...(active !== '' ? { active } : {}),
                ...(unread !== '' ? { unread } : {}),
                page,
                size: 20,
            };
            setData(await notificationApi.getAll(filters));
        } catch {
            setLoadError(true);
            showError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [active, page, severity, showError, type, unread]);

    useEffect(() => {
        const load = window.setTimeout(() => void loadNotifications(), 0);
        return () => window.clearTimeout(load);
    }, [loadNotifications]);

    const openNotification = async (item: AppNotification) => {
        try {
            if (!item.readAt) {
                await notificationApi.markAsRead(item.id);
                window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
            }
            navigate(targetPath(item));
        } catch {
            showError('Failed to open this notification');
        }
    };

    const markAllAsRead = async () => {
        setMarkingAll(true);
        try {
            const updated = await notificationApi.markAllAsRead();
            window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
            showSuccess(`${updated} notification${updated === 1 ? '' : 's'} marked as read`);
            await loadNotifications();
        } catch {
            showError('Failed to mark notifications as read');
        } finally {
            setMarkingAll(false);
        }
    };

    if (loading && !data) return <PageLoader />;
    if (!data) {
        return (
            <div className="card p-6 text-center">
                <p className="text-sm text-slate-600">
                    {loadError ? 'Notifications could not be loaded.' : 'No notifications available.'}
                </p>
                <button
                    type="button"
                    className="btn-secondary mt-4"
                    onClick={() => {
                        setLoading(true);
                        void loadNotifications();
                    }}
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                eyebrow="Activity"
                title="Notifications"
                description="Inventory and forecast alerts for your assigned access."
                actions={
                    <button
                        type="button"
                        className="btn-secondary"
                        disabled={markingAll}
                        onClick={() => void markAllAsRead()}
                    >
                        <CheckCheck className="h-4 w-4" />
                        {markingAll ? 'Saving...' : 'Mark all as read'}
                    </button>
                }
            />

            <div className="mb-5 grid gap-3 sm:grid-cols-4">
                <label>
                    <span className="label">Type</span>
                    <select
                        className="input"
                        value={type}
                        onChange={event => {
                            setType(event.target.value as NotificationType | '');
                            setPage(0);
                        }}
                    >
                        <option value="">All types</option>
                        {TYPES.map(value => (
                            <option key={value} value={value}>{TYPE_LABELS[value]}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className="label">Severity</span>
                    <select
                        className="input"
                        value={severity}
                        onChange={event => {
                            setSeverity(event.target.value as NotificationSeverity | '');
                            setPage(0);
                        }}
                    >
                        <option value="">All severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="WARNING">Warning</option>
                        <option value="INFO">Information</option>
                    </select>
                </label>
                <label>
                    <span className="label">Status</span>
                    <select
                        className="input"
                        value={active === '' ? '' : String(active)}
                        onChange={event => {
                            setActive(event.target.value === ''
                                ? '' : event.target.value === 'true');
                            setPage(0);
                        }}
                    >
                        <option value="">All statuses</option>
                        <option value="true">Active</option>
                        <option value="false">Resolved</option>
                    </select>
                </label>
                <label>
                    <span className="label">Read status</span>
                    <select
                        className="input"
                        value={unread === '' ? '' : String(unread)}
                        onChange={event => {
                            setUnread(event.target.value === ''
                                ? '' : event.target.value === 'true');
                            setPage(0);
                        }}
                    >
                        <option value="">All notifications</option>
                        <option value="true">Unread</option>
                        <option value="false">Read</option>
                    </select>
                </label>
            </div>

            <div className="space-y-3">
                {data.content.length === 0 ? (
                    <div className="card">
                        <EmptyState
                            icon={Bell}
                            title="No notifications found"
                            message="Try changing the filters or check back later."
                        />
                    </div>
                ) : data.content.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => void openNotification(item)}
                        className={`card flex w-full items-start gap-4 p-4 text-left
                            transition-colors hover:border-indigo-200 hover:bg-indigo-50/30
                            ${item.readAt ? '' : 'border-l-4 border-l-indigo-500'}`}
                    >
                        <span className="min-w-0 flex-1">
                            <span className="mb-2 flex flex-wrap items-center gap-2">
                                <Badge tone={TYPE_TONE[item.type]}>
                                    {item.title || TYPE_LABELS[item.type]}
                                </Badge>
                                <Badge tone={item.severity === 'CRITICAL'
                                    ? 'red' : item.severity === 'WARNING'
                                    ? 'orange' : 'blue'}>
                                    {item.severity}
                                </Badge>
                                <Badge tone={item.active ? 'green' : 'slate'}>
                                    {item.active ? 'Active' : 'Resolved'}
                                </Badge>
                                {!item.readAt && (
                                    <span className="text-xs font-medium text-indigo-600">
                                        Unread
                                    </span>
                                )}
                            </span>
                            <span className="block text-sm font-medium text-slate-800">
                                {item.message}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">
                                {timeAgo(item.lastOccurredAt)}
                            </span>
                        </span>
                    </button>
                ))}
            </div>

            {data.totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Page {data.number + 1} of {data.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="btn-secondary"
                            disabled={page === 0}
                            onClick={() => setPage(current => current - 1)}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            disabled={page + 1 >= data.totalPages}
                            onClick={() => setPage(current => current + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
