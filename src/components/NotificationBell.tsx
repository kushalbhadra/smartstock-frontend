import { useCallback, useEffect, useState } from 'react';
import { Bell, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    NOTIFICATIONS_UPDATED_EVENT,
    notificationApi,
} from '../api/notificationApi';
import { useToast } from '../context/useToast';
import type { AppNotification } from '../types';
import { timeAgo } from '../utils/format';

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

export function NotificationBell() {
    const navigate = useNavigate();
    const { error: showError } = useToast();
    const [open, setOpen] = useState(false);
    const [count, setCount] = useState(0);
    const [recent, setRecent] = useState<AppNotification[]>([]);

    const refreshCount = useCallback(async () => {
        const unreadCount = await notificationApi.getUnreadCount();
        setCount(unreadCount);
    }, []);

    const loadRecent = useCallback(async () => {
        try {
            const [items, unreadCount] = await Promise.all([
                notificationApi.getRecent(),
                notificationApi.getUnreadCount(),
            ]);
            setRecent(items);
            setCount(unreadCount);
        } catch {
            showError('Failed to load notifications');
        }
    }, [showError]);

    useEffect(() => {
        const initialLoad = window.setTimeout(() => {
            void refreshCount().catch(() => undefined);
        }, 0);
        const timer = window.setInterval(() => {
            void refreshCount().catch(() => undefined);
        }, 30_000);
        return () => {
            window.clearTimeout(initialLoad);
            window.clearInterval(timer);
        };
    }, [refreshCount]);

    useEffect(() => {
        const handleUpdate = () => {
            void refreshCount().catch(() => undefined);
        };
        window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
        return () => window.removeEventListener(
            NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    }, [refreshCount]);

    useEffect(() => {
        if (!open) return;
        const load = window.setTimeout(() => void loadRecent(), 0);
        return () => window.clearTimeout(load);
    }, [loadRecent, open]);

    const openNotification = async (item: AppNotification) => {
        try {
            if (!item.readAt) {
                await notificationApi.markAsRead(item.id);
                setCount(current => Math.max(0, current - 1));
            }
            setOpen(false);
            navigate(targetPath(item));
        } catch {
            showError('Failed to open this notification');
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                className="relative text-slate-400 hover:text-slate-600"
                aria-label={`Notifications${count ? `, ${count} unread` : ''}`}
                aria-expanded={open}
                onClick={() => setOpen(current => !current)}
            >
                <Bell className="w-5 h-5" />
                {count > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-5 h-5
                                     rounded-full bg-rose-500 px-1 text-[10px]
                                     font-semibold text-white flex items-center
                                     justify-center ring-2 ring-white">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 top-10 z-50 w-[min(24rem,calc(100vw-2rem))]
                                rounded-xl border border-slate-200 bg-white
                                shadow-xl">
                    <div className="flex items-center justify-between border-b
                                    border-slate-100 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Notifications
                            </h2>
                            <p className="text-xs text-slate-500">
                                {count} unread
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                navigate('/notifications');
                            }}
                            className="text-xs font-medium text-indigo-600
                                       hover:text-indigo-800"
                        >
                            View all
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {recent.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-slate-500">
                                You’re all caught up.
                            </p>
                        ) : recent.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => void openNotification(item)}
                                className="flex w-full items-start gap-3 border-b
                                           border-slate-100 px-4 py-3 text-left
                                           hover:bg-slate-50"
                            >
                                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full
                                    ${item.readAt ? 'bg-slate-200' : 'bg-indigo-500'}`} />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-slate-800">
                                        {item.title}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-600">
                                        {item.message}
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-400">
                                        {timeAgo(item.lastOccurredAt)}
                                        {!item.active && ' · Resolved'}
                                    </span>
                                </span>
                                {!item.readAt
                                    ? <Check className="mt-1 h-4 w-4 shrink-0 text-indigo-400" />
                                    : <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
