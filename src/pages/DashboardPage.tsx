
import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { PageLoader } from '../components/ui/Spinner';

import type {
    DemandForecast,
    Product,
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
}

export default function DashboardPage() {
    const { token } = useAuth();
    const { error } = useToast();

    const [loading, setLoading] = useState(true);

    const [data, setData] = useState<DashboardData>({
        products: [],
        warehouses: [],
        stocks: [],
        movements: [],
        forecasts: [],
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
                ] = await Promise.allSettled([
                    axiosInstance.get('/api/products'),
                    axiosInstance.get('/api/warehouses'),
                    axiosInstance.get('/api/stocks'),
                    axiosInstance.get('/api/stocks/movements'),
                    axiosInstance.get('/api/forecasts'),
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

                setData({
                    products: getData<Product[]>(productsResult, []),
                    warehouses: getData<Warehouse[]>(warehousesResult, []),
                    stocks: getData<Stock[]>(stocksResult, []),
                    movements: getData<StockMovement[]>(movementsResult, []),
                    forecasts: getData<DemandForecast[]>(forecastsResult, []),
                });

                const results = [
                    productsResult,
                    warehousesResult,
                    stocksResult,
                    movementsResult,
                    forecastsResult,
                ];

                if (results.every(result => result.status === 'rejected')) {
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

        if (token) {
            void loadDashboard();
        } else {
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [token, error]);

    if (loading) {
        return <PageLoader />;
    }

    const lowStockCount = data.stocks.filter(
        stock => stock.quantity <= stock.minQuantity
    ).length;

    const totalUnits = data.stocks.reduce(
        (total, stock) => total + stock.quantity,
        0
    );

    const stats = [
        {
            label: 'Products',
            value: data.products.length,
        },
        {
            label: 'Warehouses',
            value: data.warehouses.length,
        },
        {
            label: 'Total Stock Units',
            value: totalUnits,
        },
        {
            label: 'Low Stock Items',
            value: lowStockCount,
        },
        {
            label: 'Stock Movements',
            value: data.movements.length,
        },
        {
            label: 'Demand Forecasts',
            value: data.forecasts.length,
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
                            {stat.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent stock movements */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Recent Stock Movements
                </h2>

                {data.movements.length === 0 ? (
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
                                                {movement.stock?.product?.name
                                                    ?? 'Unknown'}
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
                                                {stock.product?.name
                                                    ?? 'Unknown'}
                                            </td>

                                            <td className="px-3 py-3">
                                                {stock.warehouse?.name
                                                    ?? 'Unknown'}
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
