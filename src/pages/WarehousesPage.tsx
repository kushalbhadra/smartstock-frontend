import { useEffect, useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { warehouseApi } from '../api/warehouseApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { TableWrap, Td, Th } from '../components/Table';
import { fmt } from '../utils/format';
import type { User, Warehouse } from '../types';

export default function WarehousesPage() {
    const { isAdmin } = useAuth();
    const toast = useToast();

    const [warehouses, setWarehouses] = useState<Warehouse[] | null>(null);
    const [users, setUsers]           = useState<User[]>([]);
    const [showAdd, setShowAdd]       = useState(false);
    const [editItem, setEditItem]     = useState<Warehouse | null>(null);
    const [deleteItem, setDeleteItem] = useState<Warehouse | null>(null);

    
    const load = async () => {
        try {
            setWarehouses(await warehouseApi.getAll());
        } catch {
            toast.error('Failed to load warehouses');
        }
    };

    useEffect(() => {
        let active = true;

        const fetchWarehouses = async () => {
            try {
                const result = await warehouseApi.getAll();
                if (active) {
                    setWarehouses(result);
                }
            } catch {
                if (active) {
                    toast.error('Failed to load warehouses');
                }
            }
        };

        void fetchWarehouses();

        return () => {
            active = false;
        };
    }, [toast.error]);


    const handleDelete = async () => {
        if (!deleteItem) return;
        try {
            await warehouseApi.delete(deleteItem.id);
            toast.success('Warehouse deleted');
            setDeleteItem(null);
            load();
        } catch {
            toast.error('Delete failed');
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
                ) : warehouses.length === 0 ? (
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
                            {warehouses.map(wh => (
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
                                            units
                                        </span>
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
        } catch {
            toast.error('Save failed');
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