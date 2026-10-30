import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './context/useAuth';
import { AppShell } from './components/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import WarehousesPage from './pages/WarehousesPage';
import StockPage from './pages/StockPage';
import MovementsPage from './pages/MovementsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import SuppliersPage      from './pages/SuppliersPage';
import ForecastsPage      from './pages/ForecastsPage';
import AlertsPage         from './pages/AlertsPage';
import NotificationsPage from './pages/NotificationsPage';
import UsersPage          from './pages/UsersPage';
import SettingsPage       from './pages/SettingsPage';
import LandingPage        from './pages/LandingPage';
import HelpPage           from './pages/HelpPage';
import AuditLogPage       from './pages/AuditLogPage';
import DataManagementPage from './pages/DataManagementPage';
import LegalPage          from './pages/LegalPage';

function HomeRoute() {
    const { token } = useAuth();
    return token
        ? <AppShell><DashboardPage /></AppShell>
        : <LandingPage />;
}

// Redirects to /login if not authenticated
function RequireAuth() {
    const { token } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    return <AppShell />;
    // AppShell renders <Outlet /> which shows the current child route
}

function RequireAdmin({ children }: { children: ReactNode }) {
    const { isAdmin } = useAuth();
    if (!isAdmin) return <Navigate to="/" replace />;
    return children;
}

export default function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy" element={<LegalPage />} />
            <Route path="/terms" element={<LegalPage />} />
            <Route path="/help" element={<HelpPage />} />

            {/* All protected routes live inside AppShell */}
            <Route element={<RequireAuth />}>
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/warehouses" element={<WarehousesPage />} />
                <Route path="/stock"      element={<StockPage />} />
                <Route path="/movements"       element={<MovementsPage />} />
                <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/forecasts" element={<ForecastsPage />} />
                <Route
                    path="/alerts"
                    element={<RequireAdmin><AlertsPage /></RequireAdmin>}
                />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route
                    path="/data"
                    element={<RequireAdmin><DataManagementPage /></RequireAdmin>}
                />
                <Route
                    path="/users"
                    element={<RequireAdmin><UsersPage /></RequireAdmin>}
                />
                <Route
                    path="/settings"
                    element={<RequireAdmin><SettingsPage /></RequireAdmin>}
                />
                <Route
                    path="/audit-log"
                    element={<RequireAdmin><AuditLogPage /></RequireAdmin>}
                />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}