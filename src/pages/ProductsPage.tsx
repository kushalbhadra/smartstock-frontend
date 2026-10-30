import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Boxes, Download, FileUp,
    Pencil, Plus, Search, Trash2, Upload,
} from 'lucide-react';
import { productApi } from '../api/productApi';
import { stockApi } from '../api/stockApi';
import { warehouseApi } from '../api/warehouseApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import { Th, Td, TableWrap, EmptyRow } from '../components/Table';
import { downloadBlob } from '../utils/excel';
import { money } from '../utils/format';
import { getApiErrorMessage } from '../utils/apiError';
import type { Product, ProductRequest, Stock, Warehouse } from '../types';

// Category → badge tone mapping
const CATEGORY_TONE: Record<string, 'indigo' | 'green' | 'orange' | 'blue' | 'slate'> = {
    Electronics: 'indigo',
    Food:        'green',
    Clothing:    'orange',
    Furniture:   'blue',
};

export default function ProductsPage() {
    const { isAdmin } = useAuth();
    const { error: showError, success: showSuccess } = useToast();
    const [searchParams] = useSearchParams();
    const focusProductId = Number(searchParams.get('productId'));

    // ── STATE ─────────────────────────────────────────────────────────
    const [products, setProducts]         = useState<Product[] | null>(null);
    const [allocations, setAllocations]   = useState<Stock[]>([]);
    const [search, setSearch]             = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editProduct, setEditProduct]   = useState<Product | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [allocateProduct, setAllocateProduct] = useState<Product | null>(null);
    const [importing, setImporting]       = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── LOAD ──────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        try {
            const data = await productApi.getAll();
            setProducts(data);
            try {
                setAllocations(await stockApi.getAll());
            } catch {
                showError('Products loaded, but stock allocations are unavailable');
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            setProducts([]);
        }
    }, [showError]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);


    // ── DERIVED DATA ──────────────────────────────────────────────────
    const categories = products
        ? ['All', ...new Set(products.map(p => p.category))]
        : ['All'];

    const filtered = products?.filter(p => {
        if (focusProductId && p.id !== focusProductId) return false;
        const matchSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase());
        const matchCat =
            categoryFilter === 'All' || p.category === categoryFilter;
        return matchSearch && matchCat;
    }) ?? [];

    // ── HANDLERS ──────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteProduct) return;
        try {
            await productApi.delete(deleteProduct.id);
            showSuccess('Product deleted');
            setDeleteProduct(null);
            load();
        } catch {
            showError('Delete failed');
        }
    };

    const handleExport = async () => {
        try {
            const blob = await productApi.exportExcel();
            downloadBlob(blob, 'products.xlsx');
            showSuccess('Products exported');
        } catch {
            showError('Export failed');
        }
    };

    const handleTemplate = async () => {
        try {
            const blob = await productApi.downloadTemplate();
            downloadBlob(blob, 'products-template.xlsx');
            showSuccess('Template downloaded');
        } catch {
            showError('Template download failed');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const result = await productApi.importExcel(file);
            showSuccess(
                `Imported ${result.success} products` +
                (result.failed > 0 ? `, ${result.failed} failed` : '')
            );
            load();
        } catch {
            showError('Import failed');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ── RENDER ────────────────────────────────────────────────────────
    return (
        <>
            <PageHeader
                eyebrow="Catalog"
                title="Products"
                description="Manage your product catalog and pricing."
                actions={
                    <>
                        {/* Hidden file input for import */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx"
                            className="hidden"
                            onChange={handleImport}
                        />

                        {isAdmin && (
                            <>
                                <button
                                    onClick={handleTemplate}
                                    className="btn-secondary"
                                >
                                    <FileUp className="w-4 h-4" />
                                    Template
                                </button>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={importing}
                                    className="btn-secondary"
                                >
                                    <Upload className="w-4 h-4" />
                                    {importing ? 'Importing...' : 'Import'}
                                </button>
                            </>
                        )}

                        <button
                            onClick={handleExport}
                            className="btn-secondary"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>

                        {isAdmin && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-primary"
                            >
                                <Plus className="w-4 h-4" />
                                Add Product
                            </button>
                        )}
                    </>
                }
            />

            {/* ── FILTERS ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2
                                       -translate-y-1/2 w-4 h-4
                                       text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input pl-9"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="input sm:max-w-[180px]"
                >
                    {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* ── TABLE ──────────────────────────────────────────── */}
            <div className="card">
                {!products ? (
                    <TableSkeleton cols={isAdmin ? 7 : 6} />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th>SKU</Th>
                                <Th>Category</Th>
                                <Th>Unit</Th>
                                <Th>Storage factor</Th>
                                <Th>Price</Th>
                                {isAdmin && <Th>Actions</Th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <EmptyRow
                                    colSpan={isAdmin ? 7 : 6}
                                    message="No products found"
                                />
                            ) : filtered.map(p => (
                                <tr key={p.id}
                                    className="hover:bg-slate-50/60
                                               transition-colors">
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            {/* Avatar — first 2 letters */}
                                            <div className="w-8 h-8 rounded-lg
                                                            bg-indigo-50 text-indigo-600
                                                            flex items-center
                                                            justify-center
                                                            text-xs font-bold shrink-0">
                                                {p.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-medium
                                                             text-slate-800">
                                                {p.name}
                                            </span>
                                            <span className="block text-xs text-slate-500">
                                                {allocations
                                                    .filter(item => item.productId === p.id)
                                                    .map(item =>
                                                        `${item.warehouseName}: ${item.quantity}`
                                                    )
                                                    .join(' · ') || 'No warehouse allocation'}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td>
                                        <code className="text-xs bg-slate-100
                                                         px-2 py-0.5 rounded">
                                            {p.sku}
                                        </code>
                                    </Td>
                                    <Td>
                                        <Badge
                                            tone={CATEGORY_TONE[p.category] ?? 'slate'}
                                        >
                                            {p.category}
                                        </Badge>
                                    </Td>
                                    <Td>{p.unit}</Td>
                                    <Td>{p.storageCapacityFactor ?? 1} storage units</Td>
                                    <Td className="font-semibold text-slate-800">
                                        {money(p.price)}
                                    </Td>
                                    {isAdmin && (
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setAllocateProduct(p)}
                                                    title="Allocate stock to a warehouse"
                                                    className="p-1.5 rounded-lg
                                                               text-slate-400
                                                               hover:text-emerald-600
                                                               hover:bg-emerald-50"
                                                >
                                                    <Boxes className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditProduct(p)}
                                                    className="p-1.5 rounded-lg
                                                               text-slate-400
                                                               hover:text-indigo-600
                                                               hover:bg-indigo-50"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteProduct(p)}
                                                    className="p-1.5 rounded-lg
                                                               text-slate-400
                                                               hover:text-rose-600
                                                               hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </Td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                )}
            </div>

            {/* ── MODALS ─────────────────────────────────────────── */}
            {showAddModal && (
                <ProductFormModal
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => { setShowAddModal(false); load(); }}
                />
            )}

            {editProduct && (
                <ProductFormModal
                    product={editProduct}
                    onClose={() => setEditProduct(null)}
                    onSaved={() => { setEditProduct(null); load(); }}
                />
            )}

            {deleteProduct && (
                <ConfirmDialog
                    title="Delete Product"
                    message={`Are you sure you want to delete "${deleteProduct.name}"? This cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteProduct(null)}
                />
            )}
            {allocateProduct && (
                <StockAllocationModal
                    product={allocateProduct}
                    onClose={() => setAllocateProduct(null)}
                    onSaved={() => {
                        setAllocateProduct(null);
                        void load();
                    }}
                />
            )}
        </>
    );
}

// ── PRODUCT FORM MODAL ────────────────────────────────────────────────

interface ProductFormModalProps {
    product?: Product;
    onClose: () => void;
    onSaved: () => void;
}

type ProductFormState = Omit<ProductRequest,
    'price' | 'storageCapacityFactor' | 'initialWarehouseId'
    | 'initialQuantity' | 'minQuantity' | 'maxQuantity'
> & {
    price: string;
    storageCapacityFactor: string;
    initialWarehouseId: number | '';
    initialQuantity: string;
    minQuantity: string;
    maxQuantity: string;
};

function ProductFormModal({
    product,
    onClose,
    onSaved,
}: ProductFormModalProps) {
    const { error: showError, success: showSuccess } = useToast();
    const isEdit = !!product;
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [form, setForm] = useState<ProductFormState>({
        name:     product?.name     ?? '',
        sku:      product?.sku      ?? '',
        category: product?.category ?? '',
        unit:     product?.unit     ?? '',
        price:    product?.price ? String(product.price) : '',
        storageCapacityFactor: String(product?.storageCapacityFactor ?? 1),
        initialWarehouseId: '',
        initialQuantity: '',
        minQuantity: '0',
        maxQuantity: '100',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<
        Partial<Record<keyof ProductFormState, string>>
    >({});
    const selectedWarehouse = warehouses.find(
        warehouse => warehouse.id === form.initialWarehouseId
    );
    const projectedInitialUsage = selectedWarehouse
        ? Number(selectedWarehouse.usedCapacity ?? 0)
            + Number(form.initialQuantity || 0)
            * Number(form.storageCapacityFactor || 0)
        : 0;

    const UNITS = ['piece', 'kg', 'litre', 'bag', 'box', 'bottle'];
    const CATEGORIES = ['Electronics', 'Food', 'Clothing',
                        'Furniture', 'Other'];

    useEffect(() => {
        if (isEdit) return;
        warehouseApi.getAll()
            .then(setWarehouses)
            .catch(() => showError('Could not load warehouses for initial stock'));
    }, [isEdit, showError]);

    const validate = (): boolean => {
        const e: Partial<Record<keyof ProductFormState, string>> = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.sku.trim())  e.sku  = 'SKU is required';
        if (!form.category)    e.category = 'Category is required';
        if (!form.unit)        e.unit = 'Unit is required';
        if (
            form.price.trim() === '' ||
            !Number.isFinite(Number(form.price)) ||
            Number(form.price) <= 0
        ) {
            e.price = 'Price must be greater than 0';
        }
        if (!Number.isFinite(Number(form.storageCapacityFactor))
            || Number(form.storageCapacityFactor) <= 0) {
            e.storageCapacityFactor = 'Storage factor must be greater than 0';
        }
        const allocationRequested = form.initialWarehouseId !== ''
            || form.initialQuantity !== '';
        if (allocationRequested) {
            if (form.initialWarehouseId === '') {
                e.initialWarehouseId = 'Select the initial warehouse';
            }
            if (!form.initialQuantity || Number(form.initialQuantity) < 0) {
                e.initialQuantity = 'Initial quantity cannot be negative';
            }
            if (!form.maxQuantity || Number(form.maxQuantity) < 1) {
                e.maxQuantity = 'Maximum stock must be at least 1';
            }
            if (Number(form.initialQuantity) > Number(form.maxQuantity)) {
                e.initialQuantity = 'Initial stock cannot exceed maximum stock';
            }
            if (Number(form.minQuantity) > Number(form.maxQuantity)) {
                e.minQuantity = 'Minimum cannot exceed maximum stock';
            }
            if (selectedWarehouse
                && projectedInitialUsage > selectedWarehouse.capacity) {
                e.initialQuantity =
                    'This allocation would exceed warehouse capacity';
            }
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        const fieldName = name as keyof ProductFormState;
        setForm(prev => ({
            ...prev,
            [fieldName]: name === 'initialWarehouseId'
                ? (value ? Number(value) : '')
                : value,
        }));

        if (errors[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const request: ProductRequest = {
                name: form.name,
                sku: form.sku,
                category: form.category,
                unit: form.unit,
                price: Number(form.price),
                storageCapacityFactor: Number(form.storageCapacityFactor),
                ...(form.initialWarehouseId !== '' ? {
                    initialWarehouseId: Number(form.initialWarehouseId),
                    initialQuantity: Number(form.initialQuantity),
                    minQuantity: Number(form.minQuantity),
                    maxQuantity: Number(form.maxQuantity),
                } : {}),
            };
            if (isEdit && product) {
                await productApi.update(product.id, request);
                showSuccess('Product updated');
            } else {
                await productApi.create(request);
                showSuccess('Product created');
            }
            onSaved();
        } catch (err: unknown) {
            showError(getApiErrorMessage(err, 'Save failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={isEdit ? 'Edit Product' : 'Add Product'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name */}
                <div>
                    <label className="label">Product Name *</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g. Laptop 15 inch"
                    />
                    {errors.name && (
                        <p className="text-xs text-rose-500 mt-1">
                            {errors.name}
                        </p>
                    )}
                </div>

                {/* SKU */}
                <div>
                    <label className="label">SKU *</label>
                    <input
                        name="sku"
                        value={form.sku}
                        onChange={handleChange}
                        className="input uppercase"
                        placeholder="e.g. ELEC001"
                        disabled={isEdit}
                    />
                    {isEdit && (
                        <p className="text-xs text-slate-400 mt-1">
                            SKU cannot be changed after creation
                        </p>
                    )}
                    {errors.sku && (
                        <p className="text-xs text-rose-500 mt-1">
                            {errors.sku}
                        </p>
                    )}
                </div>

                {/* Category + Unit in a row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Category *</label>
                        <select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="">Select...</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="text-xs text-rose-500 mt-1">
                                {errors.category}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="label">Unit *</label>
                        <select
                            name="unit"
                            value={form.unit}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="">Select...</option>
                            {UNITS.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                        {errors.unit && (
                            <p className="text-xs text-rose-500 mt-1">
                                {errors.unit}
                            </p>
                        )}
                    </div>
                </div>

                {/* Price */}
                <div>
                    <label className="label">Storage factor *</label>
                    <input
                        name="storageCapacityFactor"
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={form.storageCapacityFactor}
                        onChange={handleChange}
                        className="input"
                        required
                    />
                    <p className="mt-1 text-xs text-slate-400">
                        Storage units consumed by one product unit.
                    </p>
                    {errors.storageCapacityFactor && (
                        <p className="text-xs text-rose-500 mt-1">
                            {errors.storageCapacityFactor}
                        </p>
                    )}
                </div>
                <div>
                    <label className="label">Price (₹) *</label>
                    <input
                        name="price"
                        type="text"
                        inputMode="decimal"
                        value={form.price}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g. 45000"
                    />
                    {errors.price && (
                        <p className="text-xs text-rose-500 mt-1">
                            {errors.price}
                        </p>
                    )}
                </div>

                {!isEdit && (
                    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                        <p className="text-sm font-semibold text-slate-700">
                            Optional initial stock allocation
                        </p>
                        <label>
                            <span className="label">Warehouse</span>
                            <select
                                name="initialWarehouseId"
                                value={form.initialWarehouseId}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="">Do not allocate now</option>
                                {warehouses.map(warehouse => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                    </option>
                                ))}
                            </select>
                            {errors.initialWarehouseId && (
                                <p className="text-xs text-rose-500 mt-1">
                                    {errors.initialWarehouseId}
                                </p>
                            )}
                        </label>
                        {form.initialWarehouseId !== '' && (
                            <div className="grid grid-cols-3 gap-3">
                                <label>
                                    <span className="label">Initial quantity</span>
                                    <input
                                        name="initialQuantity"
                                        type="number"
                                        min="0"
                                        value={form.initialQuantity}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </label>
                                <label>
                                    <span className="label">Minimum</span>
                                    <input
                                        name="minQuantity"
                                        type="number"
                                        min="0"
                                        value={form.minQuantity}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </label>
                                <label>
                                    <span className="label">Maximum</span>
                                    <input
                                        name="maxQuantity"
                                        type="number"
                                        min="1"
                                        value={form.maxQuantity}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </label>
                            </div>
                        )}
                        {selectedWarehouse && (
                            <p className={`text-xs ${
                                projectedInitialUsage > selectedWarehouse.capacity
                                    ? 'text-rose-600'
                                    : 'text-slate-500'
                            }`}>
                                Warehouse capacity: {selectedWarehouse.usedCapacity}
                                {' / '}{selectedWarehouse.capacity} storage units
                                {' · '}after allocation: {projectedInitialUsage}
                                {' / '}{selectedWarehouse.capacity}
                            </p>
                        )}
                        {errors.initialQuantity && (
                            <p className="text-xs text-rose-500">
                                {errors.initialQuantity}
                            </p>
                        )}
                        {errors.minQuantity && (
                            <p className="text-xs text-rose-500">
                                {errors.minQuantity}
                            </p>
                        )}
                        {errors.maxQuantity && (
                            <p className="text-xs text-rose-500">
                                {errors.maxQuantity}
                            </p>
                        )}
                    </div>
                )}

                {/* Buttons */}
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
                        {loading
                            ? 'Saving...'
                            : isEdit ? 'Update' : 'Create'
                        }
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function StockAllocationModal({
    product,
    onClose,
    onSaved,
}: {
    product: Product;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { error: showError, success: showSuccess } = useToast();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [warehouseId, setWarehouseId] = useState('');
    const [quantity, setQuantity] = useState('0');
    const [minQuantity, setMinQuantity] = useState('0');
    const [maxQuantity, setMaxQuantity] = useState('100');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        warehouseApi.getAll()
            .then(setWarehouses)
            .catch(() => showError('Could not load warehouses'));
    }, [showError]);

    const selectedWarehouse = warehouses.find(
        warehouse => warehouse.id === Number(warehouseId)
    );
    const projectedUsage = selectedWarehouse
        ? Number(selectedWarehouse.usedCapacity ?? 0)
            + Number(quantity) * Number(product.storageCapacityFactor ?? 1)
        : 0;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!warehouseId || Number(quantity) < 0
            || Number(minQuantity) < 0 || Number(maxQuantity) < 1
            || Number(minQuantity) > Number(maxQuantity)
            || Number(quantity) > Number(maxQuantity)) {
            showError('Enter valid allocation and stock thresholds');
            return;
        }
        if (selectedWarehouse && projectedUsage > selectedWarehouse.capacity) {
            showError('Allocation exceeds the selected warehouse capacity');
            return;
        }

        setLoading(true);
        try {
            await stockApi.createAllocation({
                warehouseId: Number(warehouseId),
                productId: product.id,
                quantity: Number(quantity),
                minQuantity: Number(minQuantity),
                maxQuantity: Number(maxQuantity),
            });
            showSuccess('Stock allocated to warehouse');
            onSaved();
        } catch (error: unknown) {
            showError(getApiErrorMessage(error, 'Stock allocation failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title={`Allocate ${product.name}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">Warehouse *</label>
                    <select
                        value={warehouseId}
                        onChange={event => setWarehouseId(event.target.value)}
                        className="input"
                        required
                    >
                        <option value="">Select warehouse...</option>
                        {warehouses.map(warehouse => (
                            <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <label>
                        <span className="label">Quantity</span>
                        <input
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={event => setQuantity(event.target.value)}
                            className="input"
                        />
                    </label>
                    <label>
                        <span className="label">Minimum</span>
                        <input
                            type="number"
                            min="0"
                            value={minQuantity}
                            onChange={event => setMinQuantity(event.target.value)}
                            className="input"
                        />
                    </label>
                    <label>
                        <span className="label">Maximum</span>
                        <input
                            type="number"
                            min="1"
                            value={maxQuantity}
                            onChange={event => setMaxQuantity(event.target.value)}
                            className="input"
                        />
                    </label>
                </div>
                {selectedWarehouse && (
                    <p className={`text-xs ${
                        projectedUsage > selectedWarehouse.capacity
                            ? 'text-rose-600'
                            : 'text-slate-500'
                    }`}>
                        Warehouse occupancy after allocation: {projectedUsage}
                        {' / '}{selectedWarehouse.capacity} storage units
                    </p>
                )}
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Allocating...' : 'Allocate stock'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}