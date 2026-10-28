import { useEffect, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { purchaseOrderApi } from '../api/purchaseOrderApi';
import { productApi } from '../api/productApi';
import { warehouseApi } from '../api/warehouseApi';
import { supplierApi } from '../api/supplierApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { EmptyRow, TableWrap, Td, Th } from '../components/Table';
import { fmtDate } from '../utils/format';
import type {
    Product, PurchaseOrder,
    PurchaseOrderStatus, Supplier, Warehouse,
} from '../types';

// Status → badge tone mapping
const STATUS_TONE: Record<PurchaseOrderStatus,
    'yellow' | 'blue' | 'green' | 'red'> = {
    PENDING:   'yellow',
    APPROVED:  'blue',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

export default function PurchaseOrdersPage() {
    const { canMutate, isAdmin, isManager, warehouseId } = useAuth();
    const toast = useToast();

    const [orders, setOrders]         = useState<PurchaseOrder[] | null>(null);
    const [products, setProducts]     = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
    const [showAdd, setShowAdd]       = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('All');

    const load = async () => {
        try {
            const [o, p, w, s] = await Promise.all([
                purchaseOrderApi.getAll(),
                productApi.getAll(),
                warehouseApi.getAll(),
                supplierApi.getAll(),
            ]);
            setOrders(o);
            setProducts(p);
            setWarehouses(w);
            setSuppliers(s);
        } catch {
            toast.error('Failed to load purchase orders');
        }
    };

    useEffect(() => { load(); }, []);

    const handleStatusChange = async (
        id: number,
        status: PurchaseOrderStatus
    ) => {
        try {
            await purchaseOrderApi.updateStatus(id, status);
            toast.success('Status updated');
            load();
        } catch {
            toast.error('Status update failed');
        }
    };

    // Filter by status
    const filtered = orders?.filter(o =>
        statusFilter === 'All' || o.status === statusFilter
    ) ?? [];

    return (
        <>
            <PageHeader
                eyebrow="Procurement"
                title="Purchase Orders"
                description="Track orders raised to suppliers."
                actions={
                    <>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="input sm:max-w-[160px]"
                        >
                            <option value="All">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        {canMutate && (
                            <button
                                onClick={() => setShowAdd(true)}
                                className="btn-primary"
                            >
                                <Plus className="w-4 h-4" />
                                New PO
                            </button>
                        )}
                    </>
                }
            />

            {/* ── STATS ROW ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {(['PENDING', 'APPROVED', 'DELIVERED', 'CANCELLED'] as
                    PurchaseOrderStatus[]).map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(
                            statusFilter === status ? 'All' : status
                        )}
                        className={`rounded-xl border p-4 text-left
                                    transition-all hover:shadow-sm ${
                            statusFilter === status
                                ? 'ring-2 ring-indigo-500'
                                : ''
                        }`}
                    >
                        <p className="text-xs text-slate-400 font-medium">
                            {status}
                        </p>
                        <p className="text-2xl font-bold mt-1">
                            {orders?.filter(
                                o => o.status === status
                            ).length ?? '—'}
                        </p>
                        <Badge tone={STATUS_TONE[status]}>
                            {status}
                        </Badge>
                    </button>
                ))}
            </div>

            {/* ── TABLE ──────────────────────────────────────────── */}
            <div className="card">
                {!orders ? (
                    <TableSkeleton cols={8} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="No purchase orders"
                        message="Raise a purchase order to get started."
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>PO Number</Th>
                                <Th>Supplier</Th>
                                <Th>Product</Th>
                                <Th>Warehouse</Th>
                                <Th>Quantity</Th>
                                <Th>Expected</Th>
                                <Th>Status</Th>
                                {isAdmin && <Th>Update Status</Th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <EmptyRow
                                    colSpan={isAdmin ? 8 : 7}
                                    message="No orders match filter"
                                />
                            ) : filtered.map(o => (
                                <tr key={o.id}
                                    className="hover:bg-slate-50/60
                                               transition-colors">
                                    <Td>
                                        <code className="text-xs
                                                         bg-slate-100
                                                         px-2 py-0.5
                                                         rounded font-mono">
                                            {o.poNumber}
                                        </code>
                                    </Td>
                                    <Td className="font-medium
                                                   text-slate-700">
                                        {o.supplier?.name ?? '—'}
                                    </Td>
                                    <Td>
                                        {o.product?.name ?? '—'}
                                        <p className="text-xs
                                                      text-slate-400">
                                            {o.product?.sku}
                                        </p>
                                    </Td>
                                    <Td>
                                        {o.warehouse?.name ?? '—'}
                                    </Td>
                                    <Td className="font-semibold">
                                        {o.quantity}
                                    </Td>
                                    <Td className="text-slate-500 text-xs">
                                        {o.expectedDate
                                            ? fmtDate(o.expectedDate)
                                            : '—'
                                        }
                                    </Td>
                                    <Td>
                                        <Badge
                                            tone={STATUS_TONE[o.status]}
                                        >
                                            {o.status}
                                        </Badge>
                                    </Td>
                                    {isAdmin && (
                                        <Td>
                                            <select
                                                value={o.status}
                                                onChange={e =>
                                                    handleStatusChange(
                                                        o.id,
                                                        e.target.value as
                                                            PurchaseOrderStatus
                                                    )
                                                }
                                                className="input text-xs
                                                           py-1.5 max-w-[140px]"
                                            >
                                                <option value="PENDING">
                                                    PENDING
                                                </option>
                                                <option value="APPROVED">
                                                    APPROVED
                                                </option>
                                                <option value="DELIVERED">
                                                    DELIVERED
                                                </option>
                                                <option value="CANCELLED">
                                                    CANCELLED
                                                </option>
                                            </select>
                                        </Td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                )}
            </div>

            {showAdd && (
                <PurchaseOrderFormModal
                    products={products}
                    warehouses={warehouses}
                    suppliers={suppliers}
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

// ── PO FORM MODAL ─────────────────────────────────────────────────────

function PurchaseOrderFormModal({
    products,
    warehouses,
    suppliers,
    defaultWarehouseId,
    onClose,
    onSaved,
}: {
    products: Product[];
    warehouses: Warehouse[];
    suppliers: Supplier[];
    defaultWarehouseId?: number;
    onClose: () => void;
    onSaved: () => void;
}) {
    const toast = useToast();

    const [form, setForm] = useState({
        supplierId:   0,
        productId:    0,
        warehouseId:  defaultWarehouseId ?? 0,
        quantity:     1,
        expectedDate: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'quantity' ||
                    name === 'supplierId' ||
                    name === 'productId' ||
                    name === 'warehouseId'
                ? parseInt(value) || 0
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.supplierId || !form.productId || !form.warehouseId) {
            toast.error('Please fill all required fields');
            return;
        }
        if (form.quantity < 1) {
            toast.error('Quantity must be at least 1');
            return;
        }
        setLoading(true);
        try {
            await purchaseOrderApi.create(form);
            toast.success('Purchase order created');
            onSaved();
        } catch {
            toast.error('Failed to create purchase order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="New Purchase Order" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Supplier */}
                <div>
                    <label className="label">Supplier *</label>
                    <select
                        name="supplierId"
                        value={form.supplierId}
                        onChange={handleChange}
                        className="input"
                    >
                        <option value={0}>Select supplier...</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} (★ {s.rating})
                            </option>
                        ))}
                    </select>
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

                {/* Warehouse */}
                <div>
                    <label className="label">Destination Warehouse *</label>
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
                </div>

                {/* Quantity + Expected date */}
                <div className="grid grid-cols-2 gap-4">
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
                    <div>
                        <label className="label">Expected Date</label>
                        <input
                            name="expectedDate"
                            type="date"
                            value={form.expectedDate}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
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
                        {loading ? 'Creating...' : 'Create PO'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}