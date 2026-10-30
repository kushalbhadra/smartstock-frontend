
import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { PageLoader } from '../components/ui/Spinner';

import type {
    DemandForecast,
    Product,
    PurchaseOrder,
    Stock,
    StockMovement,
    Warehouse,
} from '../types';

interface DashboardData {
    products: Product[];
    warehouses: Warehouse[];
    stocks: Stock[];
    movements: StockMovement[];
    forecasts: DemandForecast[];
    purchaseOrders: PurchaseOrder[];
    unreadNotifications: number;
}

export default function DashboardPage() {
    const { error } = useToast();

    const [loading, setLoading] = useState(true);
    const [failedSections, setFailedSections] = useState<Set<string>>(
        () => new Set()
    );

    const [data, setData] = useState<DashboardData>({
        products: [],
        warehouses: [],
        stocks: [],
        movements: [],
        forecasts: [],
        purchaseOrders: [],
        unreadNotifications: 0,
    });

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            setLoading(true);

            try {
                const [
                    productsResult,
                    warehousesResult,
                    stocksResult,
                    movementsResult,
                    forecastsResult,
                    purchaseOrdersResult,
                    notificationsResult,
                ] = await Promise.allSettled([
                    axiosInstance.get('/api/products'),
                    axiosInstance.get('/api/warehouses'),
                    axiosInstance.get('/api/stocks'),
                    axiosInstance.get('/api/stocks/movements'),
                    axiosInstance.get('/api/forecasts'),
                    axiosInstance.get('/api/purchase-orders'),
                    axiosInstance.get<{ count: number }>(
                        '/api/notifications/unread-count'
                    ),
                ]);

                if (cancelled) return;

                const getData = <T,>(
                    result: PromiseSettledResult<{ data: T }>,
                    fallback: T
                ): T => {
                    return result.status === 'fulfilled'
                        ? result.value.data
                        : fallback;
                };

                setData(current => ({
                    products: getData<Product[]>(productsResult, current.products),
                    warehouses: getData<Warehouse[]>(
                        warehousesResult, current.warehouses
                    ),
                    stocks: getData<Stock[]>(stocksResult, current.stocks),
                    movements: getData<StockMovement[]>(
                        movementsResult, current.movements
                    ),
                    forecasts: getData<DemandForecast[]>(
                        forecastsResult, current.forecasts
                    ),
                    purchaseOrders: getData<PurchaseOrder[]>(
                        purchaseOrdersResult, current.purchaseOrders
                    ),
                    unreadNotifications: notificationsResult.status === 'fulfilled'
                        ? notificationsResult.value.data.count
                        : current.unreadNotifications,
                }));

                const results = [
                    productsResult,
                    warehousesResult,
                    stocksResult,
                    movementsResult,
                    forecastsResult,
                    purchaseOrdersResult,
                    notificationsResult,
                ];
                const failed = new Set<string>();
                if (productsResult.status === 'rejected') failed.add('products');
                if (warehousesResult.status === 'rejected') failed.add('warehouses');
                if (stocksResult.status === 'rejected') failed.add('stocks');
                if (movementsResult.status === 'rejected') failed.add('movements');
                if (forecastsResult.status === 'rejected') failed.add('forecasts');
                if (purchaseOrdersResult.status === 'rejected') {
                    failed.add('purchase orders');
                }
                if (notificationsResult.status === 'rejected') {
                    failed.add('notifications');
                }
                setFailedSections(failed);

                if (failed.size === results.length) {
                    error(
                        'Could not load dashboard data. Check your backend connection.'
                    );
                } else if (
                    results.some(result => result.status === 'rejected')
                ) {
                    error(
                        'Some dashboard data could not be loaded.'
                    );
                }
            } catch {
                if (!cancelled) {
                    error('Failed to load dashboard data.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [error]);

    if (loading) {
        return <PageLoader />;
    }

    const lowStockCount = data.stocks.filter(
        stock => stock.quantity > 0 && stock.quantity < stock.minQuantity
    ).length;
    const outOfStockCount = data.stocks.filter(
        stock => stock.quantity === 0
    ).length;
    const overstockCount = data.stocks.filter(
        stock => stock.quantity > stock.maxQuantity
    ).length;

    const totalUnits = data.stocks.reduce(
        (total, stock) => total + stock.quantity,
        0
    );
    const productsById = new Map(data.products.map(product =>
        [product.id, product]
    ));
    const inventoryValue = data.stocks.reduce((total, stock) =>
        total + stock.quantity
            * (productsById.get(stock.productId)?.price ?? 0), 0
    );
    const warehouseCapacity = data.warehouses.reduce(
        (total, warehouse) => total + warehouse.capacity, 0
    );
    const usedCapacity = data.warehouses.reduce(
        (total, warehouse) => total + Number(warehouse.usedCapacity ?? 0), 0
    );
    const utilization = warehouseCapacity > 0
        ? usedCapacity * 100 / warehouseCapacity
        : 0;

    const stats = [
        {
            label: 'Products',
            value: failedSections.has('products')
                ? 'Unavailable' : data.products.length,
        },
        {
            label: 'Warehouses',
            value: failedSections.has('warehouses')
                ? 'Unavailable' : data.warehouses.length,
        },
        {
            label: 'Total Stock Units',
            value: failedSections.has('stocks')
                ? 'Unavailable' : totalUnits,
        },
        {
            label: 'Low Stock Items',
            value: failedSections.has('stocks')
                ? 'Unavailable' : lowStockCount,
        },
        {
            label: 'Out of Stock',
            value: failedSections.has('stocks')
                ? 'Unavailable' : outOfStockCount,
        },
        {
            label: 'Overstock Items',
            value: failedSections.has('stocks')
                ? 'Unavailable' : overstockCount,
        },
        {
            label: 'Inventory Value',
            value: failedSections.has('stocks') || failedSections.has('products')
                ? 'Unavailable'
                : `₹${inventoryValue.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                })}`,
        },
        {
            label: 'Warehouse Utilization',
            value: failedSections.has('warehouses')
                ? 'Unavailable' : `${utilization.toFixed(1)}%`,
        },
        {
            label: 'Stock Movements',
            value: failedSections.has('movements')
                ? 'Unavailable' : data.movements.length,
        },
        {
            label: 'Demand Forecasts',
            value: failedSections.has('forecasts')
                ? 'Unavailable' : data.forecasts.length,
        },
        {
            label: 'Pending Purchase Orders',
            value: failedSections.has('purchase orders')
                ? 'Unavailable'
                : data.purchaseOrders.filter(order =>
                    order.status === 'PENDING'
                ).length,
        },
        {
            label: 'Unread Notifications',
            value: failedSections.has('notifications')
                ? 'Unavailable' : data.unreadNotifications,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <PageHeader title="Dashboard" />
                <p className="mt-1 text-sm text-gray-500">
                    Overview of your SmartStock inventory
                </p>
            </div>

            {/* Dashboard statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map(stat => (
                    <div
                        key={stat.label}
                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                        <p className="text-sm text-gray-500">
                            {stat.label}
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-gray-900">
                            {typeof stat.value === 'number'
                                ? stat.value.toLocaleString()
                                : stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent stock movements */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Recent Stock Movements
                </h2>

                {failedSections.has('movements') ? (
                    <p className="text-sm text-rose-600">
                        Recent movements are unavailable. Retry after the backend recovers.
                    </p>
                ) : data.movements.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No stock movements found.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b text-gray-500">
                                    <th className="px-3 py-3">Product</th>
                                    <th className="px-3 py-3">Movement</th>
                                    <th className="px-3 py-3">Quantity</th>
                                    <th className="px-3 py-3">Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.movements
                                    .slice(0, 5)
                                    .map(movement => (
                                        <tr
                                            key={movement.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-3 py-3">
                                                {movement.productName}
                                            </td>

                                            <td className="px-3 py-3">
                                                {movement.movementType}
                                            </td>

                                            <td className="px-3 py-3">
                                                {movement.quantity}
                                            </td>

                                            <td className="px-3 py-3">
                                                {movement.createdAt
                                                    ? new Date(
                                                        movement.createdAt
                                                    ).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Current inventory */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                    Inventory Stock
                </h2>

                {data.stocks.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No stock records found.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b text-gray-500">
                                    <th className="px-3 py-3">Product</th>
                                    <th className="px-3 py-3">Warehouse</th>
                                    <th className="px-3 py-3">Quantity</th>
                                    <th className="px-3 py-3">Min. Quantity</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.stocks
                                    .slice(0, 10)
                                    .map(stock => (
                                        <tr
                                            key={stock.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-3 py-3">
                                                {stock.productName}
                                            </td>

                                            <td className="px-3 py-3">
                                                {stock.warehouseName}
                                            </td>

                                            <td className="px-3 py-3">
                                                {stock.quantity}
                                            </td>

                                            <td className="px-3 py-3">
                                                {stock.minQuantity}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Demand forecasts */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                    Demand Forecasts
                </h2>

                {data.forecasts.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No demand forecasts available.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b text-gray-500">
                                    <th className="px-3 py-3">Product</th>
                                    <th className="px-3 py-3">Next Week</th>
                                    <th className="px-3 py-3">Next Month</th>
                                    <th className="px-3 py-3">Recommendation</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.forecasts.slice(0, 10).map(forecast => (
                                    <tr
                                        key={forecast.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-3 py-3">
                                            {forecast.product?.name ?? 'Unknown'}
                                        </td>

                                        <td className="px-3 py-3">
                                            {forecast.forecastNextWeek}
                                        </td>

                                        <td className="px-3 py-3">
                                            {forecast.forecastNextMonth}
                                        </td>

                                        <td className="px-3 py-3">
                                            {forecast.recommendation || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
