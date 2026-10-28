import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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
import UsersPage          from './pages/UsersPage';


function ComingSoon({ name }: { name: string }) {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
            <p className="text-slate-400 mt-2 text-sm">
                Coming in next day
            </p>
        </div>
    );
}

// Redirects to /login if not authenticated
function RequireAuth() {
    const { token } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    return <AppShell />;
    // AppShell renders <Outlet /> which shows the current child route
}

function RequireAdmin() {
    const { isAdmin } = useAuth();
    if (!isAdmin) return <Navigate to="/" replace />;
    return <ComingSoon name="Admin Area" />;
}

export default function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* All protected routes live inside AppShell */}
            <Route element={<RequireAuth />}>
                <Route path="/"                element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/warehouses" element={<WarehousesPage />} />
                <Route path="/stock"      element={<StockPage />} />
                <Route path="/movements"       element={<MovementsPage />} />
                <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/forecasts" element={<ForecastsPage />} />
                <Route path="/alerts"    element={<AlertsPage />} />
                <Route path="/users"     element={<UsersPage />} />
                <Route path="/settings"        element={<RequireAdmin />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}