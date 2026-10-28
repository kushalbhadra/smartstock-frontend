import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Star, Trash2, Truck } from 'lucide-react';
import { supplierApi } from '../api/supplierApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { TableWrap, Td, Th } from '../components/Table';
import type { Supplier } from '../types';

// Star rating display component
function StarRating({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                        i <= Math.round(rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 fill-slate-200'
                    }`}
                />
            ))}
            <span className="text-xs font-semibold text-slate-600 ml-1">
                {rating.toFixed(1)}
            </span>
        </span>
    );
}

export default function SuppliersPage() {
    const { isAdmin } = useAuth();
    const { error } = useToast();
    const toast = useToast();

    const [suppliers, setSuppliers]   = useState<Supplier[] | null>(null);
    const [showAdd, setShowAdd]       = useState(false);
    const [editItem, setEditItem]     = useState<Supplier | null>(null);
    const [deleteItem, setDeleteItem] = useState<Supplier | null>(null);

   
const load = useCallback(async () => {
    try {
        setSuppliers(await supplierApi.getAll());
    } catch {
        error('Failed to load suppliers');
    }
}, [error]);

useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
        await load();
    };

    void run();

    return () => {
        controller.abort();
    };
}, [load]);


    const handleDelete = async () => {
        if (!deleteItem) return;
        try {
            await supplierApi.delete(deleteItem.id);
            toast.success('Supplier deleted');
            setDeleteItem(null);
            load();
        } catch {
            toast.error('Delete failed');
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Partners"
                title="Suppliers"
                description="Manage your supplier relationships."
                actions={
                    isAdmin && (
                        <button
                            onClick={() => setShowAdd(true)}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Add Supplier
                        </button>
                    )
                }
            />

            <div className="card">
                {!suppliers ? (
                    <TableSkeleton cols={5} />
                ) : suppliers.length === 0 ? (
                    <EmptyState
                        icon={Truck}
                        title="No suppliers yet"
                        message="Add your first supplier to get started."
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>Supplier</Th>
                                <Th>Email</Th>
                                <Th>Phone</Th>
                                <Th>Rating</Th>
                                {isAdmin && <Th>Actions</Th>}
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map(s => (
                                <tr
                                    key={s.id}
                                    className="hover:bg-slate-50/60
                                               transition-colors"
                                >
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg
                                                            bg-amber-50
                                                            text-amber-600
                                                            flex items-center
                                                            justify-center
                                                            text-xs font-bold">
                                                {s.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-medium
                                                             text-slate-800">
                                                {s.name}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td className="text-slate-500">
                                        {s.contactEmail || '—'}
                                    </Td>
                                    <Td className="text-slate-500">
                                        {s.phone || '—'}
                                    </Td>
                                    <Td>
                                        <StarRating rating={s.rating} />
                                    </Td>
                                    {isAdmin && (
                                        <Td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        setEditItem(s)
                                                    }
                                                    className="p-1.5 rounded-lg
                                                               text-slate-400
                                                               hover:text-indigo-600
                                                               hover:bg-indigo-50"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDeleteItem(s)
                                                    }
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

            {showAdd && (
                <SupplierFormModal
                    onClose={() => setShowAdd(false)}
                    onSaved={() => { setShowAdd(false); load(); }}
                />
            )}

            {editItem && (
                <SupplierFormModal
                    supplier={editItem}
                    onClose={() => setEditItem(null)}
                    onSaved={() => { setEditItem(null); load(); }}
                />
            )}

            {deleteItem && (
                <ConfirmDialog
                    title="Delete Supplier"
                    message={`Delete "${deleteItem.name}"? This cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteItem(null)}
                />
            )}
        </>
    );
}

// ── SUPPLIER FORM MODAL ───────────────────────────────────────────────

function SupplierFormModal({
    supplier,
    onClose,
    onSaved,
}: {
    supplier?: Supplier;
    onClose: () => void;
    onSaved: () => void;
}) {
    const toast = useToast();
    const isEdit = !!supplier;

    const [form, setForm] = useState({
        name:         supplier?.name         ?? '',
        contactEmail: supplier?.contactEmail ?? '',
        phone:        supplier?.phone        ?? '',
        rating:       supplier?.rating       ?? 3.0,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'rating'
                ? parseFloat(value) || 0
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Supplier name is required');
            return;
        }
        setLoading(true);
        try {
            if (isEdit && supplier) {
                await supplierApi.update(supplier.id, form);
                toast.success('Supplier updated');
            } else {
                await supplierApi.create(form);
                toast.success('Supplier created');
            }
            onSaved();
        } catch {
            toast.error('Save failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={isEdit ? 'Edit Supplier' : 'Add Supplier'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">Supplier Name *</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g. TechSupply Co"
                    />
                </div>
                <div>
                    <label className="label">Contact Email</label>
                    <input
                        name="contactEmail"
                        type="email"
                        value={form.contactEmail}
                        onChange={handleChange}
                        className="input"
                        placeholder="supplier@company.com"
                    />
                </div>
                <div>
                    <label className="label">Phone</label>
                    <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="input"
                        placeholder="+91-9876543210"
                    />
                </div>
                <div>
                    <label className="label">
                        Rating: {form.rating.toFixed(1)} / 5.0
                    </label>
                    <input
                        name="rating"
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={form.rating}
                        onChange={handleChange}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs
                                    text-slate-400 mt-1">
                        <span>0</span>
                        <StarRating rating={form.rating} />
                        <span>5</span>
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