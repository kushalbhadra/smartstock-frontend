import { useEffect, useRef, useState } from 'react';
import {
    Download, FileUp,
    Pencil, Plus, Search, Trash2, Upload,
} from 'lucide-react';
import { productApi } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import { Th, Td, TableWrap, EmptyRow } from '../components/Table';
import { downloadBlob } from '../utils/excel';
import { money } from '../utils/format';
import type { Product, ProductRequest } from '../types';

// Category → badge tone mapping
const CATEGORY_TONE: Record<string, 'indigo' | 'green' | 'orange' | 'blue' | 'slate'> = {
    Electronics: 'indigo',
    Food:        'green',
    Clothing:    'orange',
    Furniture:   'blue',
};

export default function ProductsPage() {
    const { isAdmin } = useAuth();
    const toast = useToast();

    // ── STATE ─────────────────────────────────────────────────────────
    const [products, setProducts]         = useState<Product[] | null>(null);
    const [search, setSearch]             = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editProduct, setEditProduct]   = useState<Product | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [importing, setImporting]       = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── LOAD ──────────────────────────────────────────────────────────
    const load = async () => {
        try {
            const data = await productApi.getAll();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products:', error);
            setProducts([]);
        }
    };

    useEffect(() => {
        let cancelled = false;

        productApi.getAll()
            .then(data => {
                if (!cancelled) setProducts(data);
            })
            .catch(error => {
                console.error('Failed to load products:', error);
                if (!cancelled) setProducts([]);
            });

        return () => {
            cancelled = true;
        };
    }, []);


    // ── DERIVED DATA ──────────────────────────────────────────────────
    const categories = products
        ? ['All', ...new Set(products.map(p => p.category))]
        : ['All'];

    const filtered = products?.filter(p => {
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
            toast.success('Product deleted');
            setDeleteProduct(null);
            load();
        } catch {
            toast.error('Delete failed');
        }
    };

    const handleExport = async () => {
        try {
            const blob = await productApi.exportExcel();
            downloadBlob(blob, 'products.xlsx');
            toast.success('Products exported');
        } catch {
            toast.error('Export failed');
        }
    };

    const handleTemplate = async () => {
        try {
            const blob = await productApi.downloadTemplate();
            downloadBlob(blob, 'products-template.xlsx');
            toast.success('Template downloaded');
        } catch {
            toast.error('Template download failed');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const result = await productApi.importExcel(file);
            toast.success(
                `Imported ${result.success} products` +
                (result.failed > 0 ? `, ${result.failed} failed` : '')
            );
            load();
        } catch {
            toast.error('Import failed');
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
                    <TableSkeleton cols={6} />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th>SKU</Th>
                                <Th>Category</Th>
                                <Th>Unit</Th>
                                <Th>Price</Th>
                                {isAdmin && <Th>Actions</Th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <EmptyRow
                                    colSpan={isAdmin ? 6 : 5}
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
                                    <Td className="font-semibold text-slate-800">
                                        {money(p.price)}
                                    </Td>
                                    {isAdmin && (
                                        <Td>
                                            <div className="flex items-center gap-2">
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
        </>
    );
}

// ── PRODUCT FORM MODAL ────────────────────────────────────────────────

interface ProductFormModalProps {
    product?: Product;
    onClose: () => void;
    onSaved: () => void;
}

type ProductFormState = Omit<ProductRequest, 'price'> & { price: string };

function ProductFormModal({
    product,
    onClose,
    onSaved,
}: ProductFormModalProps) {
    const toast = useToast();
    const isEdit = !!product;

    const [form, setForm] = useState<ProductFormState>({
        name:     product?.name     ?? '',
        sku:      product?.sku      ?? '',
        category: product?.category ?? '',
        unit:     product?.unit     ?? '',
        price:    product ? String(product.price) : '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<
        Partial<Record<keyof ProductFormState, string>>
    >({});

    const UNITS = ['piece', 'kg', 'litre', 'bag', 'box', 'bottle'];
    const CATEGORIES = ['Electronics', 'Food', 'Clothing',
                        'Furniture', 'Other'];

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
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        const fieldName = name as keyof ProductFormState;

        setForm(prev => ({ ...prev, [fieldName]: value }));

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
                ...form,
                price: Number(form.price),
            };
            if (isEdit && product) {
                await productApi.update(product.id, request);
                toast.success('Product updated');
            } else {
                await productApi.create(request);
                toast.success('Product created');
            }
            onSaved();
        } catch (err: unknown) {
            const msg = err instanceof Error
                ? err.message
                : 'Save failed';
            toast.error(msg);
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