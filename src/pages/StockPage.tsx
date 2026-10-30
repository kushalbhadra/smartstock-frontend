import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes, Download } from 'lucide-react';
import { stockApi } from '../api/stockApi';
import { warehouseApi } from '../api/warehouseApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { TableWrap, Td, Th } from '../components/Table';
import { downloadBlob } from '../utils/excel';
import { fmt, getStockStatus } from '../utils/format';
import type { Stock, StockStatus, Warehouse } from '../types';

export default function StockPage() {
    const { isAdmin, isManager, warehouseId } = useAuth();
    const { error: showError, success: showSuccess } = useToast();
    const [searchParams] = useSearchParams();
    const focusStockId = Number(searchParams.get('stockId'));

    const [stocks, setStocks]             = useState<Stock[] | null>(null);
    const [warehouses, setWarehouses]     = useState<Warehouse[]>([]);
    const [warehouseFilter, setWarehouseFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<StockStatus | 'All'>('All');
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        try {
            // Managers see only their warehouse
            const [s, w] = await Promise.all([
                isManager && warehouseId
                    ? stockApi.getByWarehouse(warehouseId)
                    : stockApi.getAll(),
                warehouseApi.getAll(),
            ]);
            setStocks(s);
            setWarehouses(w);
        } catch {
            showError('Failed to load stock levels');
        }
    }, [isManager, showError, warehouseId]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const handleExport = async () => {
        try {
            const blob = await stockApi.exportStocks();
            downloadBlob(blob, 'stock-levels.xlsx');
            showSuccess('Stock levels exported');
        } catch {
            showError('Export failed');
        }
    };

    // Filter by warehouse dropdown
    const filtered = stocks?.filter(s => {
        if (focusStockId && s.id !== focusStockId) return false;
        if (warehouseFilter !== 'All'
            && s.warehouseName !== warehouseFilter) return false;
        const status = getStockStatus(
            s.quantity, s.minQuantity, s.maxQuantity
        ).label;
        if (statusFilter !== 'All' && status !== statusFilter) return false;
        return !search || `${s.productName} ${s.sku} ${s.warehouseName}`
            .toLowerCase().includes(search.toLowerCase());
    }) ?? [];

    // Stats for summary row
    const statusCount = (label: StockStatus) => filtered.filter(s =>
        getStockStatus(s.quantity, s.minQuantity, s.maxQuantity).label
            === label
    ).length;

    return (
        <>
            <PageHeader
                eyebrow="Inventory"
                title="Stock Levels"
                description="Current stock quantities across all warehouses."
                actions={
                    <>
                        {/* Warehouse filter — hidden for managers */}
                        {!isManager && warehouses.length > 0 && (
                            <select
                                value={warehouseFilter}
                                onChange={e =>
                                    setWarehouseFilter(e.target.value)
                                }
                                className="input sm:max-w-[200px]"
                            >
                                <option value="All">All Warehouses</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.name}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className="input sm:max-w-[200px]"
                            placeholder="Search product or SKU"
                        />
                        <select
                            value={statusFilter}
                            onChange={event => setStatusFilter(
                                event.target.value as StockStatus | 'All'
                            )}
                            className="input sm:max-w-[160px]"
                        >
                            <option value="All">All statuses</option>
                            <option value="OK">OK</option>
                            <option value="LOW">Low</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="OVERSTOCK">Overstock</option>
                        </select>
                        {isAdmin && (
                            <button
                                onClick={handleExport}
                                className="btn-secondary"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        )}
                    </>
                }
            />

            {/* ── SUMMARY CARDS ───────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <SummaryCard
                    label="OK"
                    count={statusCount('OK')}
                    tone="green"
                />
                <SummaryCard
                    label="Low"
                    count={statusCount('LOW')}
                    tone="yellow"
                />
                <SummaryCard
                    label="Critical"
                    count={statusCount('CRITICAL')}
                    tone="red"
                />
                <SummaryCard
                    label="Overstock"
                    count={statusCount('OVERSTOCK')}
                    tone="purple"
                />
            </div>

            {/* ── TABLE ──────────────────────────────────────────── */}
            <div className="card">
                {!stocks ? (
                    <TableSkeleton cols={7} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={Boxes}
                        title="No stock entries"
                        message="Stock entries will appear here."
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th>Warehouse</Th>
                                <Th>Current Qty</Th>
                                <Th>Min Qty</Th>
                                <Th>Max Qty</Th>
                                <Th>Status</Th>
                                <Th>Fill %</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const status = getStockStatus(
                                    s.quantity,
                                    s.minQuantity,
                                    s.maxQuantity
                                );
                                const fillPct = s.maxQuantity > 0
                                    ? Math.round(
                                        (s.quantity / s.maxQuantity) * 100
                                    )
                                    : null;
                                const progressWidth = Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        fillPct ?? (s.quantity > 0 ? 100 : 0)
                                    )
                                );
                                const tone = {
                                    CRITICAL: 'red',
                                    LOW:      'yellow',
                                    OK:       'green',
                                    OVERSTOCK:'purple',
                                }[status.label] as
                                    'red'|'yellow'|'green'|'purple';

                                return (
                                    <tr key={s.id}
                                        className="hover:bg-slate-50/60
                                                   transition-colors">
                                        <Td>
                                            <span className="font-medium
                                                             text-slate-800">
                                                {s.productName}
                                            </span>
                                            <p className="text-xs
                                                          text-slate-400">
                                                {s.sku}
                                            </p>
                                        </Td>
                                        <Td>{s.warehouseName}</Td>
                                        <Td>
                                            <span className="font-bold
                                                             text-slate-800 text-base">
                                                {fmt(s.quantity)}
                                            </span>
                                        </Td>
                                        <Td className="text-slate-500">
                                            {fmt(s.minQuantity)}
                                        </Td>
                                        <Td className="text-slate-500">
                                            {fmt(s.maxQuantity)}
                                        </Td>
                                        <Td>
                                            <Badge tone={tone}>
                                                {status.label}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            {/* Progress bar */}
                                            <div className="flex items-center
                                                            gap-2 min-w-[80px]">
                                                <div className="flex-1 h-1.5
                                                                rounded-full
                                                                bg-slate-100
                                                                overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            tone === 'red'
                                                                ? 'bg-rose-400'
                                                                : tone === 'yellow'
                                                                ? 'bg-amber-400'
                                                                : tone === 'purple'
                                                                ? 'bg-purple-400'
                                                                : 'bg-emerald-400'
                                                        }`}
                                                        style={{ width: `${progressWidth}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs
                                                                 text-slate-400
                                                                 w-8 text-right">
                                                    {fillPct === null
                                                        ? 'N/A'
                                                        : `${fillPct}%`}
                                                </span>
                                            </div>
                                        </Td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </TableWrap>
                )}
            </div>
        </>
    );
}

// ── SUMMARY CARD ──────────────────────────────────────────────────────

function SummaryCard({ label, count, tone }: {
    label: string;
    count: number;
    tone: 'green' | 'yellow' | 'red' | 'purple';
}) {
    const styles = {
        green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
        yellow: 'bg-amber-50 border-amber-200 text-amber-700',
        red:    'bg-rose-50 border-rose-200 text-rose-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
    };
    const barStyles = {
        green:  'bg-emerald-400',
        yellow: 'bg-amber-400',
        red:    'bg-rose-400',
        purple: 'bg-purple-400',
    };

    return (
        <div className={`rounded-xl border p-4 ${styles[tone]}`}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase
                              tracking-widest opacity-70">
                    {label}
                </p>
                <div className={`w-2 h-6 rounded-full ${barStyles[tone]}`} />
            </div>
            <p className="text-3xl font-bold mt-2">{count}</p>
            <p className="text-xs opacity-60 mt-1">stock entries</p>
        </div>
    );
}