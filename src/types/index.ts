// ── ENUMS ────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'WAREHOUSE_MGR' | 'VIEWER';

export type MovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';

export type PurchaseOrderStatus =
    'PENDING' | 'APPROVED' | 'DELIVERED' | 'CANCELLED';

export type AlertType =
    'LOW_STOCK' | 'ANOMALY' | 'PO_STATUS' | 'FORECAST_READY';

export type AlertStatus = 'SENT' | 'FAILED' | 'SKIPPED';

export type StockStatus = 'OK' | 'LOW' | 'CRITICAL' | 'OVERSTOCK';

// ── AUTH ─────────────────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    userId: number;
    role: Role;
    warehouseId: number | null;
    name: string;
    phone: string;
}

// ── ENTITIES ─────────────────────────────────────────────────────────

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    warehouseId: number | null;
    phone: string;
    whatsappAlertsEnabled: boolean;
    createdAt?: string;
}

export interface Warehouse {
    id: number;
    name: string;
    location: string;
    capacity: number;
    managerId: number | null;
    createdAt?: string;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    category: string;
    unit: string;
    price: number;
    createdAt?: string;
}

export interface Stock {
    id: number;
    product: Product;
    warehouse: Warehouse;
    quantity: number;
    minQuantity: number;
    maxQuantity: number;
}

export interface StockMovement {
    id: number;
    stock: Stock;
    movementType: MovementType;
    quantity: number;
    reason: string;
    performedBy: User;
    createdAt: string;
}

export interface Supplier {
    id: number;
    name: string;
    contactEmail: string;
    phone: string;
    rating: number;
    createdAt?: string;
}

export interface PurchaseOrder {
    id: number;
    poNumber: string;
    supplier: Supplier;
    product: Product;
    warehouse: Warehouse;
    quantity: number;
    status: PurchaseOrderStatus;
    expectedDate: string;
    createdBy: User;
    createdAt: string;
}

export interface DemandForecast {
    id: number;
    product: Product;
    forecastNextWeek: number;
    forecastNextMonth: number;
    confidenceScore: number;
    anomalyDetected: boolean;
    recommendation: string;
    suggestedReorderQuantity: number;
    createdAt: string;
}

export interface AlertLog {
    id: number;
    user: User;
    alertType: AlertType;
    message: string;
    status: AlertStatus;
    relatedEntityId: number | null;
    sentAt: string;
}

// ── REQUESTS ─────────────────────────────────────────────────────────

export interface ProductRequest {
    name: string;
    sku: string;
    category: string;
    unit: string;
    price: number;
}

export interface StockMovementRequest {
    warehouseId: number;
    productId: number;
    movementType: MovementType;
    quantity: number;
    reason: string;
}

// ── API RESPONSE ─────────────────────────────────────────────────────

export interface ApiResponse {
    success: boolean;
    message: string;
}

// ── AUTH CONTEXT STATE ────────────────────────────────────────────────

export interface AuthState {
    token: string | null;
    userId: number | null;
    role: Role | null;
    warehouseId: number | null;
    name: string | null;
    phone: string | null;
}