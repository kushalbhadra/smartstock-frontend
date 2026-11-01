import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { warehouseApi } from '../api/warehouseApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { TableWrap, Td, Th } from '../components/Table';
import { fmt } from '../utils/format';
import { getApiErrorMessage } from '../utils/apiError';
import type { User, Warehouse } from '../types';

export default function WarehousesPage() {
    const { isAdmin } = useAuth();
    const { error: showError, success: showSuccess } = useToast();
    const [searchParams] = useSearchParams();
    const focusWarehouseId = Number(searchParams.get('warehouseId'));

    const [warehouses, setWarehouses] = useState<Warehouse[] | null>(null);
    const [users, setUsers]           = useState<User[]>([]);
    const [showAdd, setShowAdd] = useState(
        () => searchParams.get('action') === 'add' && isAdmin
    );
    const [editItem, setEditItem]     = useState<Warehouse | null>(null);
    const [deleteItem, setDeleteItem] = useState<Warehouse | null>(null);

    const load = useCallback(async () => {
        try {
            const [warehouseList, userList] = await Promise.all([
                warehouseApi.getAll(),
                isAdmin ? userApi.getAll() : Promise.resolve([] as User[]),
            ]);
            setWarehouses(warehouseList);
            setUsers(userList);
        } catch {
            showError('Failed to load warehouses');
        }
    }, [isAdmin, showError]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const handleDelete = async () => {
        if (!deleteItem) return;
        try {
            await warehouseApi.delete(deleteItem.id);
            showSuccess('Warehouse deleted');
            setDeleteItem(null);
            await load();
        } catch (reason) {
            showError(getApiErrorMessage(reason, 'Delete failed'));
        }
    };

    // Find manager name for a warehouse
    const getManagerName = (wh: Warehouse): string => {
        const manager = users.find(
            u => u.role === 'WAREHOUSE_MGR' &&
                 u.warehouseId === wh.id
        );
        return manager?.name ?? '—';
    };
    const visibleWarehouses = warehouses?.filter(warehouse =>
        !focusWarehouseId || warehouse.id === focusWarehouseId
    ) ?? [];

    return (
        <>
            <PageHeader
                eyebrow="Locations"
                title="Warehouses"
                description="Manage your warehouse locations and capacity."
                actions={
                    isAdmin && (
                        <button
                            onClick={() => setShowAdd(true)}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Add Warehouse
                        </button>
                    )
                }
            />

            <div className="card">
                {!warehouses ? (
                    <TableSkeleton cols={5} />
                ) : visibleWarehouses.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="No warehouses yet"
                        message="Add your first warehouse to get started."
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>Name</Th>
                                <Th>Location</Th>
                                <Th>Capacity</Th>
                                <Th>Manager</Th>
                                {isAdmin && <Th>Actions</Th>}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleWarehouses.map(wh => (
                                <tr key={wh.id}
                                    className="hover:bg-slate-50/60
                                               transition-colors">
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg
                                                            bg-blue-50
                                                            text-blue-600
                                                            flex items-center
                                                            justify-center">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium
                                                             text-slate-800">
                                                {wh.name}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td>{wh.location}</Td>
                                    <Td>
                                        <span className="font-semibold
                                                         text-slate-700">
                                            {fmt(wh.capacity)}
                                        </span>
                                        <span className="text-slate-400
                                                         text-xs ml-1">
                                                         {wh.capacityUnit || 'storage units'}
                                        </span>
                                        <div className="mt-2 w-40">
                                                         <div className="mb-1 flex justify-between
                                                                         text-[11px] text-slate-500">
                                                             <span>
                                                                 {fmt(wh.usedCapacity ?? 0)} used
                                                             </span>
                                                             <span>
                                                                 {Number(wh.utilizationPercentage ?? 0).toFixed(1)}%
                                                             </span>
                                                         </div>
                                                         <div className="h-1.5 overflow-hidden
                                                                         rounded-full bg-slate-100">
                                                             <div
                                                                 className={`h-full rounded-full ${
                                                                     wh.utilizationPercentage > 100
                                                                         ? 'bg-rose-500'
                                                                         : wh.utilizationPercentage >= 90
                                                                         ? 'bg-amber-500'
                                                                         : 'bg-blue-500'
                                                                 }`}
                                                                 style={{
                                                                     width: `${Math.min(100,
                                                                         Math.max(0,
                                                                             Number(wh.utilizationPercentage ?? 0)))}%`,
                                                                 }}
                                                             />
                                                         </div>
                                                         <span className="mt-1 block text-[11px]
                                                                           text-slate-400">
                                                             {fmt(wh.remainingCapacity ?? wh.capacity)} remaining
                                                             · {wh.productCount ?? 0} products
                                                         </span>
                                        </div>
                                    </Td>
                                    <Td>{getManagerName(wh)}</Td>
                                    {isAdmin && (
                                        <Td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditItem(wh)}
                                                    className="p-1.5 rounded-lg
                                                               text-slate-400
                                                               hover:text-indigo-600
                                                               hover:bg-indigo-50"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteItem(wh)}
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
                <WarehouseFormModal
                    onClose={() => setShowAdd(false)}
                    onSaved={() => { setShowAdd(false); load(); }}
                />
            )}

            {editItem && (
                <WarehouseFormModal
                    warehouse={editItem}
                    onClose={() => setEditItem(null)}
                    onSaved={() => { setEditItem(null); load(); }}
                />
            )}

            {deleteItem && (
                <ConfirmDialog
                    title="Delete Warehouse"
                    message={`Delete "${deleteItem.name}"? This cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteItem(null)}
                />
            )}
        </>
    );
}

// ── FORM MODAL ────────────────────────────────────────────────────────

function WarehouseFormModal({ warehouse, onClose, onSaved }: {
    warehouse?: Warehouse;
    onClose: () => void;
    onSaved: () => void;
}) {
    const toast = useToast();
    const isEdit = !!warehouse;

    const [form, setForm] = useState({
        name:     warehouse?.name     ?? '',
        location: warehouse?.location ?? '',
        capacity: warehouse?.capacity ?? 1000,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'capacity'
                ? parseInt(value) || 0
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.location.trim()) {
            toast.error('Name and location are required');
            return;
        }
        setLoading(true);
        try {
            if (isEdit && warehouse) {
                await warehouseApi.update(warehouse.id, form);
                toast.success('Warehouse updated');
            } else {
                await warehouseApi.create(form);
                toast.success('Warehouse created');
            }
            onSaved();
        } catch (reason) {
            toast.error(getApiErrorMessage(reason, 'Save failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={isEdit ? 'Edit Warehouse' : 'Add Warehouse'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">Warehouse Name *</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g. Mumbai Central"
                    />
                </div>
                <div>
                    <label className="label">Location *</label>
                    <input
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g. Andheri East, Mumbai"
                    />
                </div>
                <div>
                    <label className="label">Capacity (units)</label>
                    <input
                        name="capacity"
                        type="number"
                        min="1"
                        value={form.capacity}
                        onChange={handleChange}
                        className="input"
                    />
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