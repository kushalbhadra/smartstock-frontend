import { useCallback, useEffect, useState } from 'react';
import {
    Activity,
    ArrowDownLeft,
    ArrowLeftRight,
    Bell,
    Boxes,
    Building2,
    ClipboardList,
    Package,
    PackagePlus,
    Plus,
    Sparkles,
    Truck,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { PageHeader } from '../components/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/useAuth';
import { getApiErrorMessage } from '../utils/apiError';
import type { DashboardSummary } from '../types';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardPage() {
    const { name, role } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await axiosInstance.get<DashboardSummary>(
                '/api/dashboard/summary'
            );
            setSummary(response.data);
        } catch (reason) {
            setLoadError(getApiErrorMessage(
                reason, 'Dashboard data could not be loaded.'
            ));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(loadDashboard);
    }, [loadDashboard]);

    if (loading) return <PageLoader />;

    if (loadError || !summary) {
        return (
            <section className="card p-8 text-center">
                <Activity className="mx-auto mb-3 h-8 w-8 text-rose-500" />
                <h1 className="text-lg font-semibold text-slate-900">
                    Dashboard unavailable
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    {loadError ?? 'No dashboard summary was returned.'}
                </p>
                <button
                    type="button"
                    className="btn-primary mt-5"
                    onClick={() => void loadDashboard()}
                >
                    Retry
                </button>
            </section>
        );
    }

    const isAdmin = role === 'ADMIN';
    const isManager = role === 'WAREHOUSE_MGR';
    const displayRole = isManager ? 'Manager' : isAdmin ? 'Administrator' : 'Viewer';
    const greeting = isManager
        ? summary.assignedWarehouseName
            ? `Operations overview for ${summary.assignedWarehouseName}`
            : 'No warehouse is assigned to your account.'
        : isAdmin
        ? 'Here is your system-wide inventory overview.'
        : 'Read-only overview of inventory and availability.';

    const stats = isAdmin
        ? [
            { label: 'Products', value: summary.totalProducts, icon: Package, iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300' },
            { label: 'Warehouses', value: summary.totalWarehouses, icon: Building2, iconClass: 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-300' },
            { label: 'Stock units', value: summary.totalStockUnits, icon: Boxes, iconClass: 'bg-violet-50 text-violet-600 dark:bg-slate-800 dark:text-violet-300' },
            { label: 'Low stock', value: summary.lowStockItems, icon: ArrowDownLeft, iconClass: 'bg-amber-50 text-amber-600 dark:bg-slate-800 dark:text-amber-300' },
            { label: 'Pending orders', value: summary.pendingPurchaseOrders, icon: ClipboardList, iconClass: 'bg-orange-50 text-orange-600 dark:bg-slate-800 dark:text-orange-300' },
            { label: 'Unread alerts', value: summary.unreadNotifications, icon: Bell, iconClass: 'bg-rose-50 text-rose-600 dark:bg-slate-800 dark:text-rose-300' },
        ]
        : isManager
        ? [
            { label: 'Assigned warehouse', value: summary.totalWarehouses, icon: Building2, iconClass: 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-300' },
            { label: 'Stock units', value: summary.totalStockUnits, icon: Boxes, iconClass: 'bg-violet-50 text-violet-600 dark:bg-slate-800 dark:text-violet-300' },
            { label: 'Low stock', value: summary.lowStockItems, icon: ArrowDownLeft, iconClass: 'bg-amber-50 text-amber-600 dark:bg-slate-800 dark:text-amber-300' },
            { label: 'Pending orders', value: summary.pendingPurchaseOrders, icon: ClipboardList, iconClass: 'bg-orange-50 text-orange-600 dark:bg-slate-800 dark:text-orange-300' },
            { label: "Today's movements", value: summary.movementsToday, icon: Activity, iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300' },
            { label: 'Out of stock', value: summary.outOfStockItems, icon: Package, iconClass: 'bg-rose-50 text-rose-600 dark:bg-slate-800 dark:text-rose-300' },
        ]
        : [
            { label: 'Products', value: summary.totalProducts, icon: Package, iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300' },
            { label: 'Warehouses', value: summary.totalWarehouses, icon: Building2, iconClass: 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-300' },
            { label: 'Stock units', value: summary.totalStockUnits, icon: Boxes, iconClass: 'bg-violet-50 text-violet-600 dark:bg-slate-800 dark:text-violet-300' },
            { label: 'Low stock', value: summary.lowStockItems, icon: ArrowDownLeft, iconClass: 'bg-amber-50 text-amber-600 dark:bg-slate-800 dark:text-amber-300' },
            { label: 'Pending orders', value: summary.pendingPurchaseOrders, icon: ClipboardList, iconClass: 'bg-orange-50 text-orange-600 dark:bg-slate-800 dark:text-orange-300' },
            { label: "Today's movements", value: summary.movementsToday, icon: Activity, iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300' },
        ];

    const actions = isManager && !summary.assignedWarehouseName
        ? []
        : isAdmin
        ? [
            { label: 'Add Product', to: '/products?action=add', icon: PackagePlus },
            { label: 'Add Warehouse', to: '/warehouses?action=add', icon: Building2 },
            { label: 'Add Supplier', to: '/suppliers?action=add', icon: Truck },
            { label: 'Create Purchase Order', to: '/purchase-orders?action=add', icon: ClipboardList },
            { label: 'Allocate Stock', to: '/products', icon: Boxes },
            { label: 'Manage Users', to: '/users?action=add', icon: Users },
        ]
        : isManager
        ? [
            { label: 'Record Movement', to: '/movements?action=add', icon: Plus },
            { label: 'Transfer Stock', to: '/movements?action=transfer', icon: ArrowLeftRight },
            { label: 'Create Purchase Order', to: '/purchase-orders?action=add', icon: ClipboardList },
            { label: 'Receive Goods', to: '/purchase-orders', icon: PackagePlus },
            { label: 'View Stock Levels', to: '/stock', icon: Boxes },
        ]
        : [
            { label: 'Browse Products', to: '/products', icon: Package },
            { label: 'View Warehouses', to: '/warehouses', icon: Building2 },
            { label: 'Stock Availability', to: '/stock', icon: Boxes },
            { label: 'Demand Forecasts', to: '/forecasts', icon: Sparkles },
        ];

    const purchaseOrderChart = summary.purchaseOrderStatuses
        .filter(item => item.count > 0)
        .map(item => ({
            name: item.status.replaceAll('_', ' '),
            count: item.count,
        }));

    return (
        <div className="space-y-7">
            <PageHeader title="Dashboard" />

            <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                        {displayRole} workspace
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        Welcome back{name ? `, ${name.split(' ')[0]}` : ''}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{greeting}</p>
                </div>
                {isManager && summary.canApprovePurchaseOrders && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Purchase approval enabled
                    </span>
                )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map(({ label, value, icon: Icon, iconClass }) => (
                    <article key={label} className="card flex items-center gap-4 p-5">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-slate-500">{label}</p>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                                {value.toLocaleString()}
                            </p>
                        </div>
                    </article>
                ))}
            </section>

            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {actions.map(({ label, to, icon: Icon }) => (
                        <Link
                            key={label}
                            to={to}
                            className="card flex min-h-14 items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:text-slate-200 dark:hover:text-indigo-300"
                        >
                            <Icon className="h-4 w-4 shrink-0 text-indigo-500" />
                            {label}
                        </Link>
                    ))}
                </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
                <div className="card p-5">
                    <div className="mb-4">
                        <h2 className="font-semibold text-slate-900">Inbound vs outbound</h2>
                        <p className="mt-1 text-xs text-slate-500">Daily units over the last seven days</p>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary.movementTrend}>
                                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={date => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}
                                    stroke="#94a3b8"
                                />
                                <YAxis allowDecimals={false} stroke="#94a3b8" />
                                <Tooltip
                                    labelFormatter={date => new Date(`${date}T00:00:00`).toLocaleDateString()}
                                    contentStyle={{ background: '#111827', borderColor: '#334155', borderRadius: 12 }}
                                />
                                <Area type="monotone" dataKey="inbound" name="Inbound" stroke="#10b981" fill="#10b981" fillOpacity={0.16} />
                                <Area type="monotone" dataKey="outbound" name="Outbound" stroke="#6366f1" fill="#6366f1" fillOpacity={0.16} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="mb-4">
                        <h2 className="font-semibold text-slate-900">Stock by warehouse</h2>
                        <p className="mt-1 text-xs text-slate-500">Current unit distribution</p>
                    </div>
                    {summary.warehouseDistribution.length === 0 ? (
                        <EmptyMessage message="No warehouse stock to chart yet." />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summary.warehouseDistribution} margin={{ left: 0, right: 12 }}>
                                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="warehouseName" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ background: '#111827', borderColor: '#334155', borderRadius: 12 }} />
                                    <Bar dataKey="totalUnits" name="Stock units" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="card p-5">
                    <h2 className="font-semibold text-slate-900">Purchase order progress</h2>
                    {purchaseOrderChart.length === 0 ? (
                        <EmptyMessage message="No purchase orders have been created." />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={purchaseOrderChart}
                                        dataKey="count"
                                        nameKey="name"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        label={({ name: status, value }) => `${status}: ${value}`}
                                    >
                                        {purchaseOrderChart.map((entry, index) => (
                                            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#111827', borderColor: '#334155', borderRadius: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="card p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">Top moving products</h2>
                        <Link to="/movements" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
                            View activity
                        </Link>
                    </div>
                    {summary.topMovingProducts.length === 0 ? (
                        <EmptyMessage message="Movement rankings will appear after stock activity." />
                    ) : (
                        <div className="space-y-3">
                            {summary.topMovingProducts.map((product, index) => (
                                <div key={product.productId} className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {index + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-800">{product.productName}</p>
                                        <p className="text-xs text-slate-500">{product.sku} · {product.movementCount} movements</p>
                                    </div>
                                    <span className="text-sm font-semibold tabular-nums text-slate-700">{product.totalQuantity.toLocaleString()} units</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
                <ActivityTable
                    title="Recent stock movements"
                    link="/movements"
                    linkLabel="All movements"
                    empty="No stock movements have been recorded."
                    headers={['Product', 'Type', 'Quantity', 'Date']}
                    rows={summary.recentMovements.map(movement => [
                        movement.productName,
                        movement.movementType.replaceAll('_', ' '),
                        movement.quantity.toLocaleString(),
                        new Date(movement.createdAt).toLocaleDateString(),
                    ])}
                />
                <ActivityTable
                    title="Recent purchase orders"
                    link="/purchase-orders"
                    linkLabel="All orders"
                    empty="No purchase orders have been created."
                    headers={['Order', 'Product', 'Status', 'Remaining']}
                    rows={summary.recentPurchaseOrders.map(order => [
                        order.poNumber,
                        order.product.name,
                        order.status.replaceAll('_', ' '),
                        order.remainingQuantity.toLocaleString(),
                    ])}
                />
            </section>

            {(isAdmin || isManager) && summary.notifications.length > 0 && (
                <section className="card p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">Operational alerts</h2>
                        <Link to="/notifications" className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                            View all
                        </Link>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {summary.notifications.slice(0, 4).map(notification => (
                            <div key={notification.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{notification.message}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {role === 'VIEWER' && summary.forecasts.length > 0 && (
                <section className="card p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">Demand forecast</h2>
                        <Link to="/forecasts" className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                            View forecasts
                        </Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {summary.forecasts.slice(0, 3).map(forecast => (
                            <div key={forecast.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                <p className="truncate text-sm font-semibold text-slate-800">{forecast.productName}</p>
                                <p className="mt-2 text-xs text-slate-500">Next week</p>
                                <p className="text-xl font-bold text-slate-900">{forecast.forecastNextWeek ?? '—'}</p>
                                <p className="mt-2 text-xs text-slate-500">Suggested reorder: {forecast.suggestedReorderQuantity ?? '—'}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {summary.lowStockPreview.length > 0 && (
                <section className="card p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">Low-stock watchlist</h2>
                        <Link to="/stock" className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                            View stock
                        </Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {summary.lowStockPreview.map(stock => (
                            <div key={stock.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                                <p className="truncate text-sm font-semibold text-slate-800">{stock.productName}</p>
                                <p className="mt-1 text-xs text-slate-500">{stock.warehouseName} · {stock.sku}</p>
                                <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
                                    {stock.quantity} available <span className="font-normal text-slate-500">/ minimum {stock.minQuantity}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {isManager && !summary.assignedWarehouseName && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    Ask an administrator to assign a warehouse before using operational dashboard actions.
                </p>
            )}
        </div>
    );
}

function ActivityTable({
    title,
    link,
    linkLabel,
    empty,
    headers,
    rows,
}: {
    title: string;
    link: string;
    linkLabel: string;
    empty: string;
    headers: string[];
    rows: string[][];
}) {
    return (
        <section className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
                <h2 className="font-semibold text-slate-900">{title}</h2>
                <Link to={link} className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                    {linkLabel}
                </Link>
            </div>
            {rows.length === 0 ? (
                <EmptyMessage message={empty} />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-sm">
                        <thead>
                            <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60">
                                {headers.map(header => (
                                    <th key={header} className="px-4 py-3 font-semibold">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={`${row[0]}-${index}`} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                                    {row.map((cell, cellIndex) => (
                                        <td key={`${cellIndex}-${cell}`} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function EmptyMessage({ message }: { message: string }) {
    return <p className="px-5 py-8 text-center text-sm text-slate-500">{message}</p>;
}
