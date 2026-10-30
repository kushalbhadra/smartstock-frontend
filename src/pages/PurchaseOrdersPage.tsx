import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { ClipboardList, Plus, PackageCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { purchaseOrderApi } from '../api/purchaseOrderApi';
import { productApi } from '../api/productApi';
import { warehouseApi } from '../api/warehouseApi';
import { supplierApi } from '../api/supplierApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
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
    'yellow' | 'blue' | 'green' | 'red' | 'orange'> = {
    PENDING:   'yellow',
    APPROVED:  'blue',
    PARTIALLY_RECEIVED: 'orange',
    RECEIVED: 'green',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

export default function PurchaseOrdersPage() {
    const [searchParams] = useSearchParams();
    const linkedOrderId = Number(searchParams.get('purchaseOrderId'));
    const { canMutate, isAdmin, isManager, warehouseId } = useAuth();
    const { error: showError, success } = useToast();

    const [orders, setOrders]         = useState<PurchaseOrder[] | null>(null);
    const [products, setProducts]     = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
    const [loadError, setLoadError]   = useState<string | null>(null);
    const [showAdd, setShowAdd]       = useState(false);
    const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('All');

    const fetchPageData = useCallback(() => Promise.allSettled([
        purchaseOrderApi.getAll(),
        productApi.getAll(),
        warehouseApi.getAll(),
        supplierApi.getAll(),
    ]), []);

    const applyPageData = useCallback((
        results: Awaited<ReturnType<typeof fetchPageData>>
    ) => {
        const [
            ordersResult,
            productsResult,
            warehousesResult,
            suppliersResult,
        ] = results;
        setLoadError(null);
        if (ordersResult.status === 'fulfilled') {
            setOrders(ordersResult.value);
        } else {
            const reason: unknown = ordersResult.reason;
            const message = axios.isAxiosError<{ message?: string }>(reason)
                ? reason.response?.data?.message ?? reason.message
                : reason instanceof Error ? reason.message : 'Unknown error';
            setLoadError(`Failed to load purchase orders: ${message}`);
        }

        if (productsResult.status === 'fulfilled') {
            setProducts(productsResult.value);
        } else {
            showError('Could not load products for purchase orders');
        }
        if (warehousesResult.status === 'fulfilled') {
            setWarehouses(warehousesResult.value);
        } else {
            showError('Could not load warehouses for purchase orders');
        }
        if (suppliersResult.status === 'fulfilled') {
            setSuppliers(suppliersResult.value);
        } else {
            showError('Could not load suppliers for purchase orders');
        }
    }, [showError]);

    const load = useCallback(async () => {
        applyPageData(await fetchPageData());
    }, [applyPageData, fetchPageData]);

    useEffect(() => {
        let active = true;
        void fetchPageData().then(results => {
            if (active) applyPageData(results);
        });
        return () => {
            active = false;
        };
    }, [applyPageData, fetchPageData]);

    const handleStatusChange = async (
        id: number,
        status: PurchaseOrderStatus
    ) => {
        try {
            await purchaseOrderApi.updateStatus(id, status);
            success('Status updated');
            await load();
        } catch {
            showError('Status update failed. Check the allowed purchase-order transitions.');
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
                            <option value="PARTIALLY_RECEIVED">Partially received</option>
                            <option value="RECEIVED">Received</option>
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
                {(['PENDING', 'APPROVED', 'PARTIALLY_RECEIVED',
                    'RECEIVED', 'DELIVERED', 'CANCELLED'] as
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
                {loadError ? (
                    <div className="p-6 text-center">
                        <p role="alert" className="text-sm text-rose-600">
                            {loadError}
                        </p>
                        <button
                            type="button"
                            onClick={() => void load()}
                            className="btn-secondary mt-4"
                        >
                            Retry
                        </button>
                    </div>
                ) : !orders ? (
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
                                <Th>Received</Th>
                                <Th>Unit price</Th>
                                <Th>Expected</Th>
                                <Th>Status</Th>
                                {(isAdmin || canMutate) && <Th>Actions</Th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <EmptyRow
                                    colSpan={isAdmin || canMutate ? 10 : 9}
                                    message="No orders match filter"
                                />
                            ) : filtered.map(o => (
                                <tr key={o.id}
                                    className={`${o.id === linkedOrderId
                                        ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200'
                                        : 'hover:bg-slate-50/60'}
                                               transition-colors`}>
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
                                    <Td className="text-sm text-slate-600">
                                        {o.receivedQuantity} received
                                        <p className="text-xs text-slate-400">
                                            {o.remainingQuantity} remaining
                                        </p>
                                    </Td>
                                    <Td className="text-sm">
                                        {Number(o.purchaseUnitPrice).toFixed(2)}
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
                                    {(isAdmin || canMutate) && (
                                        <Td>
                                            <div className="flex flex-col gap-2">
                                                {isAdmin && (o.status === 'PENDING'
                                                    || o.status === 'APPROVED') && (
                                                    <select
                                                        value={o.status}
                                                        onChange={e => void handleStatusChange(
                                                            o.id,
                                                            e.target.value as PurchaseOrderStatus
                                                        )}
                                                        className="input text-xs py-1.5 max-w-[160px]"
                                                    >
                                                        {o.status === 'PENDING' ? (
                                                            <>
                                                                <option value="PENDING">PENDING</option>
                                                                <option value="APPROVED">APPROVED</option>
                                                                <option value="CANCELLED">CANCELLED</option>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <option value="APPROVED">APPROVED</option>
                                                                <option value="CANCELLED">CANCELLED</option>
                                                            </>
                                                        )}
                                                    </select>
                                                )}
                                                {canMutate && (o.status === 'APPROVED'
                                                    || o.status === 'PARTIALLY_RECEIVED') && (
                                                    <button
                                                        type="button"
                                                        className="btn-secondary text-xs"
                                                        onClick={() => setReceivingOrder(o)}
                                                    >
                                                        <PackageCheck className="h-3.5 w-3.5" />
                                                        Receive
                                                    </button>
                                                )}
                                            </div>
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
                    onSaved={() => { setShowAdd(false); void load(); }}
                />
            )}
            {receivingOrder && (
                <PurchaseOrderReceiptModal
                    order={receivingOrder}
                    onClose={() => setReceivingOrder(null)}
                    onSaved={() => {
                        setReceivingOrder(null);
                        void load();
                    }}
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
        purchaseUnitPrice: '',
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
            await purchaseOrderApi.create({
                ...form,
                purchaseUnitPrice: Number(form.purchaseUnitPrice),
                expectedDate: form.expectedDate || null,
            });
            toast.success('Purchase order created');
            onSaved();
        } catch (reason) {
            const message = axios.isAxiosError<{ message?: string }>(reason)
                ? reason.response?.data?.message ?? reason.message
                : reason instanceof Error
                    ? reason.message
                    : 'Unknown error';
            toast.error(`Failed to create purchase order: ${message}`);
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
                        {suppliers.filter(s => s.active !== false).map(s => (
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                        <label className="label">Unit price *</label>
                        <input
                            name="purchaseUnitPrice"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.purchaseUnitPrice}
                            onChange={handleChange}
                            className="input"
                            required
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

function PurchaseOrderReceiptModal({
    order,
    onClose,
    onSaved,
}: {
    order: PurchaseOrder;
    onClose: () => void;
    onSaved: () => void;
}) {
    const toast = useToast();
    const [quantity, setQuantity] = useState(1);
    const [receivedDate, setReceivedDate] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            await purchaseOrderApi.receive(order.id, {
                quantity,
                receivedDate,
                warehouseId: order.warehouse.id,
                referenceNumber: referenceNumber.trim(),
                notes: notes.trim(),
            });
            toast.success('Goods receipt recorded');
            onSaved();
        } catch (reason) {
            const message = axios.isAxiosError<{ message?: string }>(reason)
                ? reason.response?.data?.message ?? reason.message
                : reason instanceof Error ? reason.message : 'Unknown error';
            toast.error(`Could not record receipt: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title={`Receive ${order.poNumber}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <p className="text-sm text-slate-600">
                    Remaining quantity: <strong>{order.remainingQuantity}</strong>
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <label>
                        <span className="label">Quantity *</span>
                        <input
                            type="number"
                            min="1"
                            max={order.remainingQuantity}
                            value={quantity}
                            onChange={event => setQuantity(
                                Number.parseInt(event.target.value, 10) || 0
                            )}
                            className="input"
                            required
                        />
                    </label>
                    <label>
                        <span className="label">Received date *</span>
                        <input
                            type="date"
                            value={receivedDate}
                            onChange={event => setReceivedDate(event.target.value)}
                            className="input"
                            required
                        />
                    </label>
                </div>
                <label>
                    <span className="label">Receipt reference *</span>
                    <input
                        value={referenceNumber}
                        onChange={event => setReferenceNumber(event.target.value)}
                        maxLength={120}
                        className="input"
                        required
                    />
                </label>
                <label>
                    <span className="label">Notes</span>
                    <textarea
                        value={notes}
                        onChange={event => setNotes(event.target.value)}
                        maxLength={500}
                        className="input min-h-20"
                    />
                </label>
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || quantity < 1
                            || quantity > order.remainingQuantity}
                        className="btn-primary"
                    >
                        {loading ? 'Recording...' : 'Record receipt'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}