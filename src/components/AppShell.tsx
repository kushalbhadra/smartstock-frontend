import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    BarChart3, Bell, Boxes, Building2, ClipboardList,
    LayoutDashboard, LogOut, Menu, Package, Settings,
    Sparkles, Truck, Users, X, CircleHelp, ClipboardClock, Database,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { cx } from '../utils/format';
import { Badge } from './ui/Badge';
import { NotificationBell } from './NotificationBell';

const ADMIN_NAV_ITEMS = [
    { to: '/',                label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/products',        label: 'Products',        icon: Package },
    { to: '/warehouses',      label: 'Warehouses',      icon: Building2 },
    { to: '/stock',           label: 'Stock Levels',    icon: Boxes },
    { to: '/movements',       label: 'Stock Movements', icon: BarChart3 },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
    { to: '/suppliers',       label: 'Suppliers',       icon: Truck },
    { to: '/forecasts',       label: 'AI Forecasts',    icon: Sparkles },
    { to: '/notifications',  label: 'Notifications',   icon: Bell },
    { to: '/help',            label: 'Help & Support',  icon: CircleHelp },
];

const MANAGER_NAV_ITEMS = [
    { to: '/',                label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/products',        label: 'Products',        icon: Package },
    { to: '/warehouses',      label: 'Assigned Warehouse', icon: Building2 },
    { to: '/stock',           label: 'Stock Levels',    icon: Boxes },
    { to: '/movements',       label: 'Stock Movements', icon: BarChart3 },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
    { to: '/suppliers',       label: 'Suppliers',       icon: Truck },
    { to: '/forecasts',       label: 'AI Forecasts',    icon: Sparkles },
    { to: '/notifications',  label: 'Notifications',   icon: Bell },
    { to: '/help',            label: 'Help & Support',  icon: CircleHelp },
];

const VIEWER_NAV_ITEMS = [
    { to: '/',                label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/products',        label: 'Products',        icon: Package },
    { to: '/warehouses',      label: 'Warehouses',      icon: Building2 },
    { to: '/stock',           label: 'Stock Levels',    icon: Boxes },
    { to: '/movements',       label: 'Stock Movements', icon: BarChart3 },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
    { to: '/suppliers',       label: 'Suppliers',       icon: Truck },
    { to: '/forecasts',       label: 'AI Forecasts',    icon: Sparkles },
    { to: '/help',            label: 'Help & Support',  icon: CircleHelp },
];

const ADMIN_ITEMS = [
    { to: '/users',    label: 'Users & Access', icon: Users },
    { to: '/settings', label: 'Settings',       icon: Settings },
    { to: '/audit-log', label: 'Audit Log',      icon: ClipboardClock },
    { to: '/data',      label: 'Data & Retention', icon: Database },
];

export function AppShell({ children }: { children?: ReactNode }) {
    const { name, role, isAdmin, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get initials for avatar — "Rahul Sharma" → "RS"
    const initials = name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() ?? '?';

    const roleTone = role === 'ADMIN'
        ? 'indigo'
        : role === 'WAREHOUSE_MGR'
        ? 'green'
        : 'slate';
    const roleLabel = role === 'WAREHOUSE_MGR' ? 'MANAGER' : role;
    const navItems = role === 'ADMIN'
        ? ADMIN_NAV_ITEMS
        : role === 'WAREHOUSE_MGR'
        ? MANAGER_NAV_ITEMS
        : VIEWER_NAV_ITEMS;

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* ── SIDEBAR ────────────────────────────────────────── */}
            <aside className={cx(
                'fixed top-0 bottom-0 left-0 w-[260px]',
                'bg-[#0f172a] text-slate-300 z-40 flex flex-col',
                'transition-transform duration-200',
                'lg:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>

                {/* Logo */}
                <NavLink
                    to="/"
                    end
                    onClick={() => setSidebarOpen(false)}
                    aria-label="SmartStock dashboard"
                    className="h-16 flex items-center gap-3 px-5
                               border-b border-slate-700/50
                               transition-colors hover:bg-slate-800
                               focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-inset
                               focus-visible:ring-indigo-400"
                >
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl
                                    flex items-center justify-center">
                        <Package className="w-5 h-5 text-white"
                                  strokeWidth={2.2} />
                    </div>
                    <span className="font-bold text-white text-lg
                                     tracking-tight">
                        SmartStock
                    </span>
                </NavLink>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase
                                  tracking-[0.16em] text-slate-500
                                  px-3 mb-2">
                        Workspace
                    </p>

                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => cx(
                                'flex items-center gap-3 px-3 py-2.5',
                                'rounded-lg text-sm font-medium',
                                'transition-all',
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <Icon className="w-[18px] h-[18px]"
                                  strokeWidth={1.8} />
                            {label}
                            {label === 'AI Forecasts' && (
                                <span className="ml-auto text-[9px]
                                                 font-bold
                                                 bg-indigo-500/30
                                                 text-indigo-300
                                                 rounded px-1.5 py-0.5">
                                    AI
                                </span>
                            )}
                        </NavLink>
                    ))}

                    {/* Admin section */}
                    {isAdmin && (
                        <>
                            <p className="text-[10px] font-bold uppercase
                                          tracking-[0.16em] text-slate-500
                                          px-3 mb-2 mt-6">
                                Administration
                            </p>
                            {ADMIN_ITEMS.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) => cx(
                                        'flex items-center gap-3 px-3 py-2.5',
                                        'rounded-lg text-sm font-medium',
                                        'transition-all',
                                        isActive
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    )}
                                >
                                    <Icon className="w-[18px] h-[18px]"
                                          strokeWidth={1.8} />
                                    {label}
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                {/* User info + logout */}
                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600
                                        text-white flex items-center
                                        justify-center font-semibold text-sm">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white
                                          truncate">
                                {name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                {role === 'WAREHOUSE_MGR'
                                    ? 'Warehouse Manager'
                                    : role === 'ADMIN'
                                    ? 'Administrator'
                                    : 'Viewer'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2
                                   rounded-lg text-sm text-slate-400
                                   hover:text-rose-400 hover:bg-slate-800
                                   transition-colors w-full"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Mobile backdrop */}
            {sidebarOpen && (
                <button
                    aria-label="Close menu"
                    className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── MAIN AREA ───────────────────────────────────────── */}
            <div className="flex-1 lg:ml-[260px] min-h-screen flex flex-col">

                {/* Top header */}
                <header className="h-16 bg-white border-b border-slate-200
                                   flex items-center justify-between
                                   px-5 lg:px-8 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            className="lg:hidden p-2 -ml-2 text-slate-600"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen
                                ? <X className="w-5 h-5" />
                                : <Menu className="w-5 h-5" />
                            }
                        </button>
                        <div>
                            <h1 className="font-bold text-slate-900 text-lg
                                           leading-tight">
                                SmartStock
                            </h1>
                            <p className="text-xs text-slate-400">
                                Inventory Intelligence
                            </p>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {role !== 'VIEWER' && <NotificationBell />}

                        <div className="h-8 w-px bg-slate-200" />

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold
                                              text-slate-800 leading-tight">
                                    {name}
                                </p>
                                <div className="mt-0.5">
                                    <Badge tone={roleTone as 'indigo' | 'green' | 'slate'}>
                                        {roleLabel}
                                    </Badge>
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-full
                                            bg-indigo-100 text-indigo-700
                                            flex items-center justify-center
                                            font-semibold text-sm">
                                {initials}
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="hidden sm:flex items-center gap-2
                                       text-sm text-slate-500
                                       hover:text-rose-600 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Page content — Outlet renders current route */}
                <main className="flex-1 p-5 sm:p-7 lg:p-8
                                 max-w-[1600px] w-full mx-auto">
                    {children ?? <Outlet />}
                </main>
                <footer className="border-t border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:px-8">
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                        <NavLink to="/help" className="hover:text-indigo-700">Help & Support</NavLink>
                        <NavLink to="/privacy" className="hover:text-indigo-700">Privacy policy</NavLink>
                        <NavLink to="/terms" className="hover:text-indigo-700">Terms of use</NavLink>
                        {isAdmin && (
                            <NavLink to="/data" className="hover:text-indigo-700">
                                Data & Retention
                            </NavLink>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
}