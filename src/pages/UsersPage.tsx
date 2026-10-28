import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { userApi } from '../api/userApi';
import { warehouseApi } from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { TableWrap, Td, Th } from '../components/Table';
import type { Role, User, Warehouse } from '../types';

const ROLE_TONE: Record<Role, 'indigo'|'green'|'slate'> = {
    ADMIN:         'indigo',
    WAREHOUSE_MGR: 'green',
    VIEWER:        'slate',
};

export default function UsersPage() {
    const { userId } = useAuth();
    const toast = useToast();

    const [users, setUsers]           = useState<User[] | null>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [showAdd, setShowAdd]       = useState(false);
    const [editItem, setEditItem]     = useState<User | null>(null);
    const [deleteItem, setDeleteItem] = useState<User | null>(null);

    const load = async () => {
        try {
            const [u, w] = await Promise.all([
                userApi.getAll(),
                warehouseApi.getAll(),
            ]);
            setUsers(u);
            setWarehouses(w);
        } catch {
            toast.error('Failed to load users');
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async () => {
        if (!deleteItem) return;
        try {
            await userApi.delete(deleteItem.id);
            toast.success('User deleted');
            setDeleteItem(null);
            await load();
        } catch {
            toast.error('Delete failed');
        }
    };

    const getWarehouseName = (wId: number | null): string => {
        if (!wId) return '—';
        return warehouses.find(w => w.id === wId)?.name ?? '—';
    };

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Users & Access"
                description="Manage user accounts and role assignments."
                actions={
                    <button
                        onClick={() => setShowAdd(true)}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        Add User
                    </button>
                }
            />

            <div className="card">
                {!users ? (
                    <TableSkeleton cols={6} />
                ) : users.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No users yet"
                        message="Add users to control system access."
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>User</Th>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Warehouse</Th>
                                <Th>Phone</Th>
                                <Th>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr
                                    key={u.id}
                                    className="hover:bg-slate-50/60
                                               transition-colors"
                                >
                                    <Td>
                                        <div className="flex items-center
                                                        gap-3">
                                            <div className="w-8 h-8 rounded-full
                                                            bg-indigo-100
                                                            text-indigo-700
                                                            flex items-center
                                                            justify-center
                                                            text-xs font-bold">
                                                {u.name
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()
                                                }
                                            </div>
                                            <div>
                                                <p className="font-medium
                                                              text-slate-800">
                                                    {u.name}
                                                </p>
                                                {u.id === userId && (
                                                    <p className="text-[11px]
                                                                  text-indigo-500">
                                                        You
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Td>
                                    <Td className="text-slate-500 text-xs">
                                        {u.email}
                                    </Td>
                                    <Td>
                                        <Badge tone={ROLE_TONE[u.role]}>
                                            {u.role === 'WAREHOUSE_MGR'
                                                ? 'MANAGER'
                                                : u.role
                                            }
                                        </Badge>
                                    </Td>
                                    <Td className="text-slate-500">
                                        {getWarehouseName(u.warehouseId)}
                                    </Td>
                                    <Td className="text-slate-500 text-xs">
                                        {u.phone || '—'}
                                    </Td>
                                    <Td>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditItem(u)}
                                                className="p-1.5 rounded-lg
                                                           text-slate-400
                                                           hover:text-indigo-600
                                                           hover:bg-indigo-50"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {/* Cannot delete yourself */}
                                            {u.id !== userId && (
                                                <button
                                                    onClick={() =>
                                                        setDeleteItem(u)
                                                    }
                                                    className="p-1.5 rounded-lg
                                                               text-slate-400
                                                               hover:text-rose-600
                                                               hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                )}
            </div>

            {showAdd && (
                <UserFormModal
                    warehouses={warehouses}
                    onClose={() => setShowAdd(false)}
                    onSaved={() => { setShowAdd(false); load(); }}
                />
            )}

            {editItem && (
                <UserFormModal
                    user={editItem}
                    warehouses={warehouses}
                    onClose={() => setEditItem(null)}
                    onSaved={() => { setEditItem(null); load(); }}
                />
            )}

            {deleteItem && (
                <ConfirmDialog
                    title="Delete User"
                    message={`Delete "${deleteItem.name}"? They will lose all access.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteItem(null)}
                />
            )}
        </>
    );
}

// ── USER FORM MODAL ───────────────────────────────────────────────────

function UserFormModal({
    user,
    warehouses,
    onClose,
    onSaved,
}: {
    user?: User;
    warehouses: Warehouse[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const toast = useToast();
    const isEdit = !!user;

    const [form, setForm] = useState({
        name:        user?.name        ?? '',
        email:       user?.email       ?? '',
        role:        user?.role        ?? 'VIEWER' as Role,
        warehouseId: user?.warehouseId ?? null as number | null,
        phone:       user?.phone       ?? '',
        password:    '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'warehouseId'
                ? value ? parseInt(value) : null
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) {
            toast.error('Name and email are required');
            return;
        }
        if (form.role === 'WAREHOUSE_MGR' && !form.warehouseId) {
            toast.error('Warehouse manager must be assigned a warehouse');
            return;
        }
        setLoading(true);
        try {
            if (isEdit && user) {
                await userApi.update(user.id, form);
                toast.success('User updated');
            } else {
                if (!form.password) {
                    toast.error('Password is required for new users');
                    setLoading(false);
                    return;
                }
                await userApi.create(form);
                toast.success('User created');
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
            title={isEdit ? 'Edit User' : 'Add User'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">Full Name *</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g. Rahul Sharma"
                    />
                </div>

                <div>
                    <label className="label">Email *</label>
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className="input"
                        disabled={isEdit}
                        placeholder="user@company.com"
                    />
                    {isEdit && (
                        <p className="text-xs text-slate-400 mt-1">
                            Email cannot be changed
                        </p>
                    )}
                </div>

                {!isEdit && (
                    <div>
                        <label className="label">Password *</label>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            className="input"
                            placeholder="Minimum 8 characters"
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Role *</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="ADMIN">Admin</option>
                            <option value="WAREHOUSE_MGR">
                                Warehouse Manager
                            </option>
                            <option value="VIEWER">Viewer</option>
                        </select>
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
                </div>

                {/* Warehouse — only shown for WAREHOUSE_MGR */}
                {form.role === 'WAREHOUSE_MGR' && (
                    <div>
                        <label className="label">
                            Assigned Warehouse *
                        </label>
                        <select
                            name="warehouseId"
                            value={form.warehouseId ?? ''}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="">Select warehouse...</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

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