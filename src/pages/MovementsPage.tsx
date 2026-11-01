import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, BarChart3, Download, Plus } from 'lucide-react';
import { stockApi } from '../api/stockApi';
import { productApi } from '../api/productApi';
import {
    warehouseApi,
    type WarehouseOption,
} from '../api/warehouseApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { EmptyRow, TableWrap, Td, Th } from '../components/Table';
import { downloadBlob } from '../utils/excel';
import { getApiErrorMessage } from '../utils/apiError';
import { fmtDateTime } from '../utils/format';
import type {
    Product, StockMovementPage, StockMovementRequest, Warehouse,
    StockTransferRequest, MovementType,
} from '../types';

// Movement type → badge tone
const TYPE_TONE: Record<MovementType, 'green' | 'red' | 'yellow' | 'blue' | 'purple'> = {
    INBOUND:    'green',
    OUTBOUND:   'red',
    ADJUSTMENT: 'yellow',
    TRANSFER_IN: 'blue',
    TRANSFER_OUT: 'purple',
} as const;

export default function MovementsPage() {
    const { canMutate, isAdmin, isManager, warehouseId } = useAuth();
    const { error: showError, success: showSuccess } = useToast();
    const [searchParams] = useSearchParams();

    const [movementPage, setMovementPage] = useState<StockMovementPage | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [products, setProducts]     = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [transferWarehouses, setTransferWarehouses] =
        useState<WarehouseOption[]>([]);
    const [showAdd, setShowAdd] = useState(
        () => searchParams.get('action') === 'add' && canMutate
    );
    const [showTransfer, setShowTransfer] = useState(
        () => searchParams.get('action') === 'transfer'
            && (isAdmin || isManager && warehouseId !== null)
    );
    const [typeFilter, setTypeFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('All');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(0);

    const load = useCallback(async () => {
        try {
            const [movementResult, p, w, transferOptions] = await Promise.all([
                stockApi.getHistory({
                    ...(typeFilter !== 'All'
                        ? { type: typeFilter } : {}),
                    ...(warehouseFilter !== 'All'
                        ? { warehouseId: Number(warehouseFilter) } : {}),
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                    ...(search ? { search } : {}),
                    page,
                    size: 20,
                }),
                productApi.getAll(),
                warehouseApi.getAll(),
                isManager
                    ? warehouseApi.getTransferDestinations()
                    : Promise.resolve([]),
            ]);
            setMovementPage(movementResult);
            setLoadError(null);
            setProducts(p);
            setWarehouses(w);
            setTransferWarehouses(isAdmin
                ? w.map(warehouse => ({
                    id: warehouse.id,
                    name: warehouse.name,
                }))
                : transferOptions);
        } catch (error) {
            const message = getApiErrorMessage(
                error,
                'Failed to load movements. Please try again.'
            );
            setMovementPage({
                content: [],
                number: page,
                totalPages: 0,
                totalElements: 0,
            });
            setLoadError(message);
            showError(message);
        }
    }, [
        from, isAdmin, isManager, page, search, showError, to, typeFilter,
        warehouseFilter,
    ]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const handleExport = async () => {
        try {
            const blob = await stockApi.exportMovements({
                ...(typeFilter !== 'All' ? { type: typeFilter } : {}),
                ...(warehouseFilter !== 'All'
                    ? { warehouseId: Number(warehouseFilter) } : {}),
                ...(from ? { from } : {}),
                ...(to ? { to } : {}),
                ...(search ? { search } : {}),
            });
            downloadBlob(blob, 'stock-movements.xlsx');
            showSuccess('Movements exported');
        } catch {
            showError('Export failed');
        }
    };

    // Filter by movement type
    const filtered = movementPage?.content ?? [];

    return (
        <>
            <PageHeader
                eyebrow="Activity"
                title="Stock Movements"
                description="Complete audit trail of all stock changes."
                actions={
                    <>
                        <select
                            value={typeFilter}
                            onChange={e => {
                                setTypeFilter(e.target.value);
                                setPage(0);
                            }}
                            className="input sm:max-w-[170px]"
                        >
                            <option value="All">All Types</option>
                            <option value="INBOUND">Inbound</option>
                            <option value="OUTBOUND">Outbound</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                            <option value="TRANSFER_IN">Transfer in</option>
                            <option value="TRANSFER_OUT">Transfer out</option>
                        </select>
                        <select
                            value={warehouseFilter}
                            onChange={event => {
                                setWarehouseFilter(event.target.value);
                                setPage(0);
                            }}
                            className="input sm:max-w-[180px]"
                        >
                            <option value="All">All warehouses</option>
                            {warehouses.map(warehouse => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                        <input
                            value={search}
                            onChange={event => {
                                setSearch(event.target.value);
                                setPage(0);
                            }}
                            className="input sm:max-w-[220px]"
                            placeholder="Search product or reference"
                        />
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                            From
                            <input
                                type="date"
                                value={from}
                                onChange={event => {
                                    setFrom(event.target.value);
                                    setPage(0);
                                }}
                                className="input sm:max-w-[150px]"
                            />
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                            To
                            <input
                                type="date"
                                value={to}
                                onChange={event => {
                                    setTo(event.target.value);
                                    setPage(0);
                                }}
                                className="input sm:max-w-[150px]"
                            />
                        </label>

                        {(isAdmin || isManager) && <button
                            onClick={handleExport}
                            className="btn-secondary"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>}

                        {canMutate && (
                            <>
                                <button
                                    onClick={() => setShowAdd(true)}
                                    className="btn-secondary"
                                >
                                    <Plus className="w-4 h-4" />
                                    Record Movement
                                </button>
                                {(isAdmin || isManager && warehouseId !== null) && <button
                                    onClick={() => setShowTransfer(true)}
                                    className="btn-primary"
                                >
                                    <ArrowLeftRight className="w-4 h-4" />
                                    Transfer Stock
                                </button>}
                            </>
                        )}
                    </>
                }
            />

            <div className="card">
                {!movementPage ? (
                    <TableSkeleton cols={9} />
                ) : loadError ? (
                    <div className="p-6 text-sm text-rose-600" role="alert">
                        {loadError}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={BarChart3}
                        title="No movements yet"
                        message="Stock movements will appear here."
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th>Warehouse</Th>
                                <Th>Type</Th>
                                <Th>Quantity</Th>
                                <Th>Balance</Th>
                                <Th>Reference / Route</Th>
                                <Th>Reason</Th>
                                <Th>Performed By</Th>
                                <Th>Date</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <EmptyRow
                                    colSpan={9}
                                    message="No movements match filter"
                                />
                            ) : filtered.map(m => (
                                <tr key={m.id}
                                    className="hover:bg-slate-50/60
                                               transition-colors">
                                    <Td>
                                        <span className="font-medium
                                                         text-slate-800">
                                            {m.productName}
                                        </span>
                                    </Td>
                                    <Td>
                                        {m.warehouseName}
                                    </Td>
                                    <Td>
                                        <Badge
                                            tone={TYPE_TONE[m.movementType]}
                                        >
                                            {m.movementType}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        {(() => {
                                            const delta = m.previousQuantity == null
                                                    || m.newQuantity == null
                                                    ? 0
                                                    : m.newQuantity - m.previousQuantity;
                                            const increases = m.movementType === 'INBOUND'
                                                    || m.movementType === 'TRANSFER_IN'
                                                    || (m.movementType === 'ADJUSTMENT'
                                                        && delta > 0);
                                            const decreases = m.movementType === 'OUTBOUND'
                                                    || m.movementType === 'TRANSFER_OUT'
                                                    || (m.movementType === 'ADJUSTMENT'
                                                        && delta < 0);
                                            return (
                                        <span className={`font-bold ${
                                            increases
                                                    ? 'text-emerald-600'
                                                    : decreases
                                                    ? 'text-rose-600'
                                                    : 'text-amber-600'
                                        }`}>
                                                    {increases ? '+' : decreases ? '-' : ''}
                                            {m.quantity}
                                        </span>
                                            );
                                        })()}
                                    </Td>
                                    <Td className="whitespace-nowrap text-xs">
                                        {m.previousQuantity == null
                                            || m.newQuantity == null
                                            ? '—'
                                            : `${m.previousQuantity} → ${m.newQuantity}`}
                                    </Td>
                                    <Td className="max-w-[200px] text-xs">
                                        {m.referenceNumber && (
                                            <span className="block font-medium text-slate-700">
                                                {m.referenceNumber}
                                            </span>
                                        )}
                                        {m.movementType === 'TRANSFER_OUT'
                                            ? `To ${m.destinationWarehouseName ?? 'warehouse'}`
                                            : m.movementType === 'TRANSFER_IN'
                                            ? `From ${m.sourceWarehouseName ?? 'warehouse'}`
                                            : m.reason || '—'}
                                    </Td>
                                    <Td className="max-w-[200px] truncate">
                                        {m.reason || '—'}
                                    </Td>
                                    <Td>
                                        {m.performedBy}
                                    </Td>
                                    <Td className="whitespace-nowrap
                                                   text-slate-500 text-xs">
                                        {fmtDateTime(m.createdAt)}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                )}
            </div>

            {movementPage && movementPage.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Page {movementPage.number + 1} of {movementPage.totalPages}
                        {' · '}{movementPage.totalElements} total movements
                    </span>
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
                            disabled={page + 1 >= movementPage.totalPages}
                            onClick={() => setPage(current => current + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {showAdd && (
                <MovementFormModal
                    products={products}
                    warehouses={warehouses}
                    defaultWarehouseId={
                        isManager && warehouseId
                            ? warehouseId
                            : undefined
                    }
                    onClose={() => setShowAdd(false)}
                    onSaved={() => { setShowAdd(false); load(); }}
                />
            )}
            {showTransfer && (
                <TransferFormModal
                    products={products}
                    warehouses={transferWarehouses}
                    defaultWarehouseId={isManager ? warehouseId ?? undefined : undefined}
                    onClose={() => setShowTransfer(false)}
                    onSaved={() => { setShowTransfer(false); void load(); }}
                />
            )}
        </>
    );
}

// ── MOVEMENT FORM MODAL ───────────────────────────────────────────────

function MovementFormModal({
    products,
    warehouses,
    defaultWarehouseId,
    onClose,
    onSaved,
}: {
    products: Product[];
    warehouses: Warehouse[];
    defaultWarehouseId?: number;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { error: showError, success: showSuccess } = useToast();

    const [form, setForm] = useState<StockMovementRequest>({
        warehouseId:  defaultWarehouseId ?? 0,
        productId:    0,
        movementType: 'INBOUND',
        adjustmentDirection: 'INCREASE',
        quantity:     1,
        reason:       '',
        referenceNumber: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'quantity' ||
                    name === 'productId' ||
                    name === 'warehouseId'
                ? parseInt(value) || 0
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!form.warehouseId || !form.productId) {
            showError('Please select warehouse and product');
            return;
        }
        if (form.quantity < 1) {
            showError('Quantity must be at least 1');
            return;
        }

        setLoading(true);
        try {
            await stockApi.recordMovement(form);
            showSuccess('Movement recorded successfully');
            onSaved();
        } catch (err: unknown) {
            showError(getApiErrorMessage(
                err,
                'Failed to record movement'
            ));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="Record Stock Movement" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Warehouse */}
                <div>
                    <label className="label">Warehouse *</label>
                    <select
                        name="warehouseId"
                        value={form.warehouseId}
                        onChange={handleChange}
                        className="input"
                        disabled={!!defaultWarehouseId}
                    >
                        <option value={0}>Select warehouse...</option>
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>
                                {w.name}
                            </option>
                        ))}
                    </select>
                    {defaultWarehouseId && (
                        <p className="text-xs text-slate-400 mt-1">
                            Locked to your assigned warehouse
                        </p>
                    )}
                </div>

                {/* Product */}
                <div>
                    <label className="label">Product *</label>
                    <select
                        name="productId"
                        value={form.productId}
                        onChange={handleChange}
                        className="input"
                    >
                        <option value={0}>Select product...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Type + Quantity in a row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Movement Type *</label>
                        <select
                            name="movementType"
                            value={form.movementType}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="INBOUND">
                                INBOUND (stock in)
                            </option>
                            <option value="OUTBOUND">
                                OUTBOUND (stock out)
                            </option>
                            <option value="ADJUSTMENT">
                                ADJUSTMENT (correction)
                            </option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Quantity *</label>
                        <input
                            name="quantity"
                            type="number"
                            min="1"
                            value={form.quantity}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                </div>
                {form.movementType === 'ADJUSTMENT' && (
                    <div>
                        <label className="label">Adjustment direction *</label>
                        <select
                            name="adjustmentDirection"
                            value={form.adjustmentDirection}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="INCREASE">Increase stock</option>
                            <option value="DECREASE">Decrease stock</option>
                        </select>
                    </div>
                )}

                {/* Reason */}
                <div>
                    <label className="label">Reference</label>
                    <input
                        name="referenceNumber"
                        value={form.referenceNumber}
                        onChange={handleChange}
                        maxLength={120}
                        className="input"
                        placeholder="Invoice, order or document number"
                    />
                </div>
                <div>
                    <label className="label">Reason</label>
                    <textarea
                        name="reason"
                        value={form.reason}
                        onChange={handleChange}
                        className="input resize-none"
                        rows={2}
                        placeholder="e.g. Purchase delivery, Sale order #123..."
                    />
                </div>

                {/* Movement type explanation */}
                <div className="bg-slate-50 rounded-lg p-3 text-xs
                                text-slate-500 space-y-1">
                    <p><span className="text-emerald-600 font-semibold">INBOUND</span> — adds to stock quantity</p>
                    <p><span className="text-rose-600 font-semibold">OUTBOUND</span> — removes from stock quantity</p>
                    <p><span className="text-amber-600 font-semibold">ADJUSTMENT</span> — manual correction</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Recording...' : 'Record Movement'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function TransferFormModal({
    products,
    warehouses,
    defaultWarehouseId,
    onClose,
    onSaved,
}: {
    products: Product[];
    warehouses: WarehouseOption[];
    defaultWarehouseId?: number;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { error: showError, success: showSuccess } = useToast();
    const [form, setForm] = useState<StockTransferRequest>({
        sourceWarehouseId: defaultWarehouseId ?? 0,
        destinationWarehouseId: 0,
        productId: 0,
        quantity: 1,
        reason: '',
        referenceNumber: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.sourceWarehouseId || !form.destinationWarehouseId
            || form.sourceWarehouseId === form.destinationWarehouseId
            || !form.productId || form.quantity < 1) {
            showError('Choose different source and destination warehouses, a product, and a positive quantity.');
            return;
        }
        setLoading(true);
        try {
            await stockApi.transfer(form);
            showSuccess('Stock transfer recorded');
            onSaved();
        } catch (reason) {
            showError(getApiErrorMessage(reason, 'Transfer failed'));
        } finally {
            setLoading(false);
        }
    };

    const update = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = event.target;
        setForm(current => ({
            ...current,
            [name]: name === 'sourceWarehouseId'
                || name === 'destinationWarehouseId'
                || name === 'productId'
                || name === 'quantity'
                ? Number.parseInt(value, 10) || 0
                : value,
        }));
    };

    return (
        <Modal title="Transfer Stock" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <label>
                        <span className="label">Source warehouse *</span>
                        <select
                            name="sourceWarehouseId"
                            value={form.sourceWarehouseId}
                            onChange={update}
                            disabled={!!defaultWarehouseId}
                            className="input"
                        >
                            <option value={0}>Select source...</option>
                            {warehouses.map(warehouse => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span className="label">Destination *</span>
                        <select
                            name="destinationWarehouseId"
                            value={form.destinationWarehouseId}
                            onChange={update}
                            className="input"
                        >
                            <option value={0}>Select destination...</option>
                            {warehouses.filter(warehouse =>
                                warehouse.id !== form.sourceWarehouseId
                            ).map(warehouse => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <label>
                    <span className="label">Product *</span>
                    <select
                        name="productId"
                        value={form.productId}
                        onChange={update}
                        className="input"
                    >
                        <option value={0}>Select product...</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className="label">Quantity *</span>
                    <input
                        name="quantity"
                        type="number"
                        min="1"
                        value={form.quantity}
                        onChange={update}
                        className="input"
                    />
                </label>
                <label>
                    <span className="label">Reference</span>
                    <input
                        name="referenceNumber"
                        value={form.referenceNumber}
                        onChange={update}
                        maxLength={120}
                        className="input"
                    />
                </label>
                <label>
                    <span className="label">Reason</span>
                    <textarea
                        name="reason"
                        value={form.reason}
                        onChange={update}
                        maxLength={500}
                        className="input"
                        rows={2}
                    />
                </label>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Transferring...' : 'Transfer'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}