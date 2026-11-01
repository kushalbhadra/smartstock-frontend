import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Star, Trash2, Truck } from 'lucide-react';
import { supplierApi } from '../api/supplierApi';
import { purchaseOrderApi } from '../api/purchaseOrderApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { TableWrap, Td, Th } from '../components/Table';
import { getApiErrorMessage } from '../utils/apiError';
import { money } from '../utils/format';
import {
    normalizeEmail,
    normalizeIndianPhone,
    validateEmail,
    validateIndianPhone,
} from '../utils/contactValidation';
import type { PurchaseOrder, Supplier } from '../types';

// Star rating display component
function StarRating({ rating }: { rating: number }) {
    const safeRating = rating ?? 0;
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                        i <= Math.round(safeRating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 fill-slate-200'
                    }`}
                />
            ))}
            <span className="text-xs font-semibold text-slate-600 ml-1">
                {safeRating.toFixed(1)}
            </span>
        </span>
    );
}

export default function SuppliersPage() {
    const { isAdmin } = useAuth();
    const { error } = useToast();
    const toast = useToast();
    const [searchParams] = useSearchParams();

    const [suppliers, setSuppliers]   = useState<Supplier[] | null>(null);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [showAdd, setShowAdd] = useState(
        () => searchParams.get('action') === 'add' && isAdmin
    );
    const [editItem, setEditItem]     = useState<Supplier | null>(null);
    const [deleteItem, setDeleteItem] = useState<Supplier | null>(null);

   
const load = useCallback(async () => {
    try {
        setSuppliers(await supplierApi.getAll());
        try {
            setPurchaseOrders(await purchaseOrderApi.getAll());
        } catch {
            setPurchaseOrders([]);
            error('Supplier purchase history is unavailable');
        }
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
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Delete failed'));
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
                                <Th>Supplier / Code</Th>
                                <Th>Contact person</Th>
                                <Th>Email</Th>
                                <Th>Phone</Th>
                                <Th>Address</Th>
                                <Th>Rating</Th>
                                <Th>Purchase history</Th>
                                <Th>Status</Th>
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
                                            <span className="block text-xs text-slate-500">
                                                {s.supplierCode || 'No supplier code'}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td>{s.contactPerson || '—'}</Td>
                                    <Td className="text-slate-500">
                                        {s.contactEmail || '—'}
                                    </Td>
                                    <Td className="text-slate-500">
                                        {s.phone || '—'}
                                    </Td>
                                    <Td className="max-w-[200px] truncate text-slate-500">
                                        {s.address || '—'}
                                    </Td>
                                    <Td>
                                        <StarRating rating={s.rating} />
                                    </Td>
                                    <Td>
                                        {(() => {
                                            const orders = purchaseOrders.filter(
                                                order => order.supplier.id === s.id
                                            );
                                            const spend = orders.reduce(
                                                (sum, order) => sum + order.total,
                                                0
                                            );
                                            return (
                                                <span className="text-xs text-slate-600">
                                                    {orders.length} orders
                                                    {' · '}{money(spend)}
                                                </span>
                                            );
                                        })()}
                                    </Td>
                                    <Td>
                                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                            s.active === false
                                                ? 'bg-slate-100 text-slate-600'
                                                : 'bg-emerald-50 text-emerald-700'
                                        }`}>
                                            {s.active === false ? 'Inactive' : 'Active'}
                                        </span>
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
        supplierCode: supplier?.supplierCode ?? '',
        name:         supplier?.name         ?? '',
        contactEmail: supplier?.contactEmail ?? '',
        phone:        supplier?.phone        ?? '',
        contactPerson: supplier?.contactPerson ?? '',
        address: supplier?.address ?? '',
        rating:       supplier?.rating       ?? 3.0,
        active:       supplier?.active ?? true,
    });
    const [loading, setLoading] = useState(false);
    const [contactErrors, setContactErrors] = useState<{
        email?: string;
        phone?: string;
    }>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        if (name === 'contactEmail' || name === 'phone') {
            setContactErrors(prev => ({
                ...prev,
                [name === 'contactEmail' ? 'email' : 'phone']: undefined,
            }));
        }
        setForm(prev => ({
            ...prev,
            [name]: name === 'rating'
                ? parseFloat(value) || 0
                : name === 'active' ? value === 'true' : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Supplier name is required');
            return;
        }
        const emailError = validateEmail(form.contactEmail);
        const phoneError = validateIndianPhone(form.phone);
        setContactErrors({ email: emailError, phone: phoneError });
        if (emailError || phoneError) return;

        setLoading(true);
        try {
            const request = {
                ...form,
                contactEmail: normalizeEmail(form.contactEmail),
                phone: normalizeIndianPhone(form.phone),
            };
            if (isEdit && supplier) {
                await supplierApi.update(supplier.id, request);
                toast.success('Supplier updated');
            } else {
                await supplierApi.create(request);
                toast.success('Supplier created');
            }
            onSaved();
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Save failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={isEdit ? 'Edit Supplier' : 'Add Supplier'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <label className="label">Supplier Code</label>
                    <input
                        name="supplierCode"
                        value={form.supplierCode}
                        onChange={handleChange}
                        maxLength={40}
                        className="input uppercase"
                        placeholder="e.g. SUP-001"
                    />
                </div>
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
                        autoComplete="email"
                        value={form.contactEmail}
                        onChange={handleChange}
                        className={`input ${contactErrors.email
                            ? 'border-rose-500' : ''}`}
                        placeholder="example@gmail.com"
                        aria-invalid={!!contactErrors.email}
                        aria-describedby={contactErrors.email
                            ? 'supplier-email-error' : undefined}
                    />
                    {contactErrors.email && (
                        <p id="supplier-email-error" role="alert"
                            className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                            {contactErrors.email}
                        </p>
                    )}
                </div>
                <div>
                    <label className="label">Phone</label>
                    <input
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={handleChange}
                        className={`input ${contactErrors.phone
                            ? 'border-rose-500' : ''}`}
                        placeholder="9876543210"
                        aria-invalid={!!contactErrors.phone}
                        aria-describedby={contactErrors.phone
                            ? 'supplier-phone-error' : undefined}
                    />
                    {contactErrors.phone && (
                        <p id="supplier-phone-error" role="alert"
                            className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                            {contactErrors.phone}
                        </p>
                    )}
                </div>
                <div>
                    <label className="label">Contact Person</label>
                    <input
                        name="contactPerson"
                        value={form.contactPerson}
                        onChange={handleChange}
                        maxLength={150}
                        className="input"
                        placeholder="Name of primary contact"
                    />
                </div>
                <div>
                    <label className="label">Address</label>
                    <textarea
                        name="address"
                        value={form.address}
                        onChange={event => setForm(prev => ({
                            ...prev, address: event.target.value,
                        }))}
                        maxLength={500}
                        rows={2}
                        className="input resize-none"
                        placeholder="Supplier business address"
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
                    <div>
                        <label className="label">Status</label>
                        <select
                            name="active"
                            value={String(form.active)}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
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