import { useEffect, useState } from 'react';
import { BarChart3, Download, Plus } from 'lucide-react';
import { stockApi } from '../api/stockApi';
import { productApi } from '../api/productApi';
import { warehouseApi } from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { EmptyRow, TableWrap, Td, Th } from '../components/Table';
import { downloadBlob } from '../utils/excel';
import { fmtDateTime } from '../utils/format';
import type {
    Product, StockMovement,
    StockMovementRequest, Warehouse,
} from '../types';

// Movement type → badge tone
const TYPE_TONE = {
    INBOUND:    'green',
    OUTBOUND:   'red',
    ADJUSTMENT: 'yellow',
} as const;

export default function MovementsPage() {
    const { canMutate, isManager, warehouseId } = useAuth();
    const toast = useToast();

    const [movements, setMovements]   = useState<StockMovement[] | null>(null);
    const [products, setProducts]     = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [showAdd, setShowAdd]       = useState(false);
    const [typeFilter, setTypeFilter] = useState('All');

    const load = async () => {
        try {
            const [m, p, w] = await Promise.all([
                stockApi.getMovements(),
                productApi.getAll(),
                warehouseApi.getAll(),
            ]);
            setMovements(m);
            setProducts(p);
            setWarehouses(w);
        } catch {
            toast.error('Failed to load movements');
        }
    };

    useEffect(() => { load(); }, []);

    const handleExport = async () => {
        try {
            const blob = await stockApi.exportMovements();
            downloadBlob(blob, 'stock-movements.xlsx');
            toast.success('Movements exported');
        } catch {
            toast.error('Export failed');
        }
    };

    // Filter by movement type
    const filtered = movements?.filter(m =>
        typeFilter === 'All' || m.movementType === typeFilter
    ) ?? [];

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
                            onChange={e => setTypeFilter(e.target.value)}
                            className="input sm:max-w-[170px]"
                        >
                            <option value="All">All Types</option>
                            <option value="INBOUND">Inbound</option>
                            <option value="OUTBOUND">Outbound</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                        </select>

                        <button
                            onClick={handleExport}
                            className="btn-secondary"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>

                        {canMutate && (
                            <button
                                onClick={() => setShowAdd(true)}
                                className="btn-primary"
                            >
                                <Plus className="w-4 h-4" />
                                Record Movement
                            </button>
                        )}
                    </>
                }
            />

            <div className="card">
                {!movements ? (
                    <TableSkeleton cols={7} />
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
                                <Th>Reason</Th>
                                <Th>Performed By</Th>
                                <Th>Date</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <EmptyRow
                                    colSpan={7}
                                    message="No movements match filter"
                                />
                            ) : filtered.map(m => (
                                <tr key={m.id}
                                    className="hover:bg-slate-50/60
                                               transition-colors">
                                    <Td>
                                        <span className="font-medium
                                                         text-slate-800">
                                            {m.stock?.product?.name ?? '—'}
                                        </span>
                                    </Td>
                                    <Td>
                                        {m.stock?.warehouse?.name ?? '—'}
                                    </Td>
                                    <Td>
                                        <Badge
                                            tone={TYPE_TONE[m.movementType]}
                                        >
                                            {m.movementType}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <span className={`font-bold ${
                                            m.movementType === 'INBOUND'
                                                ? 'text-emerald-600'
                                                : m.movementType === 'OUTBOUND'
                                                ? 'text-rose-600'
                                                : 'text-amber-600'
                                        }`}>
                                            {m.movementType === 'INBOUND'
                                                ? '+'
                                                : m.movementType === 'OUTBOUND'
                                                ? '-'
                                                : ''
                                            }
                                            {m.quantity}
                                        </span>
                                    </Td>
                                    <Td className="max-w-[200px] truncate">
                                        {m.reason || '—'}
                                    </Td>
                                    <Td>
                                        {m.performedBy?.name ?? '—'}
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
    const toast = useToast();

    const [form, setForm] = useState<StockMovementRequest>({
        warehouseId:  defaultWarehouseId ?? 0,
        productId:    0,
        movementType: 'INBOUND',
        quantity:     1,
        reason:       '',
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
            toast.error('Please select warehouse and product');
            return;
        }
        if (form.quantity < 1) {
            toast.error('Quantity must be at least 1');
            return;
        }

        setLoading(true);
        try {
            await stockApi.recordMovement(form);
            toast.success('Movement recorded successfully');
            onSaved();
        } catch (err: unknown) {
            const msg = err instanceof Error
                ? err.message
                : 'Failed to record movement';
            toast.error(msg);
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

                {/* Reason */}
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