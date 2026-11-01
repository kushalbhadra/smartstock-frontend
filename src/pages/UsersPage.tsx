import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { userApi } from '../api/userApi';
import { warehouseApi } from '../api/warehouseApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { TableWrap, Td, Th } from '../components/Table';
import { getApiErrorMessage } from '../utils/apiError';
import {
    normalizeEmail,
    normalizeIndianPhone,
    validateEmail,
    validateIndianPhone,
} from '../utils/contactValidation';
import type { Role, User, Warehouse } from '../types';

const ROLE_TONE: Record<Role, 'indigo'|'green'|'slate'> = {
    ADMIN:         'indigo',
    WAREHOUSE_MGR: 'green',
    VIEWER:        'slate',
};

export default function UsersPage() {
    const { userId } = useAuth();
    const { error: showError, success: showSuccess } = useToast();
    const [searchParams] = useSearchParams();

    const [users, setUsers]           = useState<User[] | null>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [showAdd, setShowAdd] = useState(
        () => searchParams.get('action') === 'add'
    );
    const [editItem, setEditItem]     = useState<User | null>(null);
    const [deleteItem, setDeleteItem] = useState<User | null>(null);
    const [search, setSearch]         = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
    const [warehouseFilter, setWarehouseFilter] = useState('ALL');

    const load = useCallback(async () => {
        try {
            const [u, w] = await Promise.all([
                userApi.getAll(),
                warehouseApi.getAll(),
            ]);
            setUsers(u);
            setWarehouses(w);
        } catch {
            showError('Failed to load users');
        }
    }, [showError]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const handleDelete = async () => {
        if (!deleteItem) return;
        try {
            await userApi.delete(deleteItem.id);
            showSuccess('User deleted');
            setDeleteItem(null);
            await load();
        } catch (error) {
            showError(getApiErrorMessage(error, 'Delete failed'));
        }
    };

    const getWarehouseName = (wId: number | null): string => {
        if (!wId) return '—';
        return warehouses.find(w => w.id === wId)?.name ?? '—';
    };

    const filteredUsers = users?.filter(user => {
        const query = search.trim().toLowerCase();
        const matchesSearch = !query
            || user.name.toLowerCase().includes(query)
            || user.email.toLowerCase().includes(query);
        const matchesRole = roleFilter === 'ALL'
            || user.role === roleFilter;
        const matchesWarehouse = warehouseFilter === 'ALL'
            || (warehouseFilter === 'UNASSIGNED'
                ? user.warehouseId === null
                : user.warehouseId === Number(warehouseFilter));
        return matchesSearch && matchesRole && matchesWarehouse;
    }) ?? [];

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Users & Access"
                description="Manage accounts, role access, and warehouse assignments."
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

            {users && users.length > 0 && (
                <div className="card mb-4 p-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_200px]">
                    <label className="relative block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className="input pl-9"
                            placeholder="Search name or email"
                            aria-label="Search users by name or email"
                        />
                    </label>
                    <select
                        value={roleFilter}
                        onChange={event =>
                            setRoleFilter(event.target.value as Role | 'ALL')
                        }
                        className="input"
                        aria-label="Filter users by role"
                    >
                        <option value="ALL">All roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="WAREHOUSE_MGR">Warehouse Manager</option>
                        <option value="VIEWER">Viewer</option>
                    </select>
                    <select
                        value={warehouseFilter}
                        onChange={event =>
                            setWarehouseFilter(event.target.value)
                        }
                        className="input"
                        aria-label="Filter users by warehouse"
                    >
                        <option value="ALL">All warehouses</option>
                        <option value="UNASSIGNED">No warehouse assigned</option>
                        {warehouses.map(warehouse => (
                            <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="card">
                {!users ? (
                    <TableSkeleton cols={6} />
                ) : users.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No users yet"
                        message="Add users to control system access."
                    />
                ) : filteredUsers.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="No matching users"
                        message="Try a different search or filter."
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
                            {filteredUsers.map(u => (
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
    const [contactErrors, setContactErrors] = useState<{
        email?: string;
        phone?: string;
    }>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        if (name === 'email' || name === 'phone') {
            setContactErrors(prev => ({ ...prev, [name]: undefined }));
        }
        setForm(prev => ({
            ...prev,
            [name]: name === 'warehouseId'
                ? value ? parseInt(value) : null
                : value,
            ...(name === 'role' && value !== 'WAREHOUSE_MGR'
                ? { warehouseId: null }
                : {}),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Name is required');
            return;
        }
        const emailError = validateEmail(form.email, true);
        const phoneError = validateIndianPhone(form.phone);
        setContactErrors({ email: emailError, phone: phoneError });
        if (emailError || phoneError) return;
        if (form.role === 'WAREHOUSE_MGR' && !form.warehouseId) {
            toast.error('Warehouse manager must be assigned a warehouse');
            return;
        }
        if (form.password && form.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        setLoading(true);
        try {
            const request = {
                ...form,
                email: normalizeEmail(form.email),
                phone: normalizeIndianPhone(form.phone),
            };
            if (isEdit && user) {
                await userApi.update(user.id, request);
                toast.success('User updated');
            } else {
                if (!form.password) {
                    toast.error('Password is required for new users');
                    setLoading(false);
                    return;
                }
                await userApi.create(request);
                toast.success('User created');
            }
            onSaved();
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Save failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={isEdit ? 'Edit User' : 'Add User'}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                        autoComplete="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className={`input ${contactErrors.email
                            ? 'border-rose-500' : ''}`}
                        disabled={isEdit}
                        placeholder="example@gmail.com"
                        aria-invalid={!!contactErrors.email}
                        aria-describedby={contactErrors.email
                            ? 'user-email-error' : undefined}
                    />
                    {contactErrors.email && (
                        <p id="user-email-error" role="alert"
                            className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                            {contactErrors.email}
                        </p>
                    )}
                    {isEdit && (
                        <p className="text-xs text-slate-400 mt-1">
                            Email cannot be changed
                        </p>
                    )}
                </div>

                <div>
                    <label className="label">
                        {isEdit ? 'Set new password (optional)' : 'Password *'}
                    </label>
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        className="input"
                        placeholder={
                            isEdit
                                ? 'Leave blank to keep current password'
                                : 'Minimum 8 characters'
                        }
                        minLength={8}
                        required={!isEdit}
                    />
                </div>

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
                            type="tel"
                            autoComplete="tel"
                            value={form.phone}
                            onChange={handleChange}
                            className={`input ${contactErrors.phone
                                ? 'border-rose-500' : ''}`}
                            placeholder="9876543210"
                            aria-invalid={!!contactErrors.phone}
                            aria-describedby={contactErrors.phone
                                ? 'user-phone-error' : undefined}
                        />
                        {contactErrors.phone && (
                            <p id="user-phone-error" role="alert"
                                className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                {contactErrors.phone}
                            </p>
                        )}
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