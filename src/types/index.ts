// ── ENUMS ────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'WAREHOUSE_MGR' | 'VIEWER';

export type MovementType =
    | 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export type PurchaseOrderStatus =
    | 'PENDING' | 'APPROVED' | 'PARTIALLY_RECEIVED'
    | 'RECEIVED' | 'DELIVERED' | 'CANCELLED';

export type AlertType =
    'LOW_STOCK' | 'ANOMALY' | 'PO_STATUS' | 'FORECAST_READY';

export type AlertStatus = 'SENT' | 'FAILED' | 'SKIPPED';

export type StockStatus = 'OK' | 'LOW' | 'CRITICAL' | 'OVERSTOCK';
export type NotificationType =
    | 'LOW_STOCK'
    | 'OUT_OF_STOCK'
    | 'OVERSTOCK'
    | 'WAREHOUSE_NEAR_CAPACITY'
    | 'WAREHOUSE_CAPACITY_FULL'
    | 'WAREHOUSE_CAPACITY_EXCEEDED'
    | 'FORECAST_ANOMALY'
    | 'PURCHASE_ORDER_APPROVED'
    | 'PURCHASE_ORDER_PARTIALLY_RECEIVED'
    | 'PURCHASE_ORDER_RECEIVED';

export type NotificationSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type NotificationTargetType =
    | 'STOCK' | 'WAREHOUSE' | 'PRODUCT' | 'PURCHASE_ORDER';

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
    createdAt?: string;
}

export interface UserRequest {
    name: string;
    email: string;
    role: Role;
    warehouseId: number | null;
    phone: string;
    password?: string;
}

export interface UserProfileRequest {
    name: string;
    phone: string;
}

export interface SystemSettings {
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    defaultLowStockThreshold: number;
}

export interface Warehouse {
    id: number;
    name: string;
    location: string;
    capacity: number;
    usedCapacity: number;
    remainingCapacity: number;
    utilizationPercentage: number;
    productCount: number;
    capacityUnit: string;
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
    storageCapacityFactor: number;
    createdAt?: string;
    canDelete: boolean;
    deletionBlockedReason: string | null;
}

export interface Stock {
    id: number;
    warehouseId: number;
    warehouseName: string;
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    minQuantity: number;
    maxQuantity: number;
}

export interface StockMovement {
    id: number;
    stockId: number;
    warehouseId: number;
    warehouseName: string;
    productId: number;
    productName: string;
    sku: string;
    movementType: MovementType;
    quantity: number;
    reason: string;
    performedBy: string;
    createdAt: string;
    previousQuantity: number | null;
    newQuantity: number | null;
    referenceNumber: string | null;
    sourceWarehouseId: number | null;
    sourceWarehouseName: string | null;
    destinationWarehouseId: number | null;
    destinationWarehouseName: string | null;
}

export interface StockMovementPage {
    content: StockMovement[];
    number: number;
    totalPages: number;
    totalElements: number;
}

export interface Supplier {
    id: number;
    supplierCode?: string | null;
    name: string;
    contactEmail: string;
    phone: string;
    contactPerson?: string | null;
    address?: string | null;
    rating: number;
    active?: boolean;
    createdAt?: string;
}

export interface PurchaseOrder {
    id: number;
    poNumber: string;
    supplier: Pick<Supplier, 'id' | 'name' | 'contactEmail' | 'phone' | 'rating'>;
    product: Pick<Product, 'id' | 'name' | 'sku'>;
    warehouse: Pick<Warehouse, 'id' | 'name'>;
    quantity: number;
    receivedQuantity: number;
    remainingQuantity: number;
    purchaseUnitPrice: number;
    total: number;
    status: PurchaseOrderStatus;
    expectedDate: string | null;
    createdBy: Pick<User, 'id' | 'name' | 'email'>;
    createdAt: string;
    canApprove: boolean;
}

export interface DashboardSummary {
    role: Role;
    assignedWarehouseName: string | null;
    canApprovePurchaseOrders: boolean;
    totalProducts: number;
    totalWarehouses: number;
    totalStockUnits: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockItems: number;
    pendingPurchaseOrders: number;
    movementsToday: number;
    unreadNotifications: number;
    warehouseDistribution: {
        warehouseId: number;
        warehouseName: string;
        totalUnits: number;
    }[];
    movementTrend: {
        date: string;
        inbound: number;
        outbound: number;
    }[];
    purchaseOrderStatuses: {
        status: PurchaseOrderStatus;
        count: number;
    }[];
    topMovingProducts: {
        productId: number;
        productName: string;
        sku: string;
        movementCount: number;
        totalQuantity: number;
    }[];
    recentMovements: StockMovement[];
    recentPurchaseOrders: PurchaseOrder[];
    lowStockPreview: Stock[];
    forecasts: {
        id: number;
        productId: number;
        productName: string;
        sku: string;
        forecastNextWeek: number | null;
        forecastNextMonth: number | null;
        suggestedReorderQuantity: number | null;
        anomalyDetected: boolean | null;
        createdAt: string;
    }[];
    notifications: AppNotification[];
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
    user: Pick<User, 'id' | 'name'>;
    alertType: AlertType;
    message: string;
    status: AlertStatus;
    relatedEntityId: number | null;
    sentAt: string;
}

export interface AppNotification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    severity: NotificationSeverity;
    active: boolean;
    readAt: string | null;
    createdAt: string;
    lastOccurredAt: string;
    resolvedAt: string | null;
    targetType: NotificationTargetType;
    targetId: number;
}

export interface NotificationPage {
    content: AppNotification[];
    number: number;
    totalPages: number;
    totalElements: number;
}

// ── REQUESTS ─────────────────────────────────────────────────────────

export interface ProductRequest {
    name: string;
    sku: string;
    category: string;
    unit: string;
    price: number;
    storageCapacityFactor: number;
    initialWarehouseId?: number;
    initialQuantity?: number;
    minQuantity?: number;
    maxQuantity?: number;
}

export interface StockMovementRequest {
    warehouseId: number;
    productId: number;
    movementType: MovementType;
    adjustmentDirection?: 'INCREASE' | 'DECREASE';
    quantity: number;
    reason: string;
    referenceNumber?: string;
}

export interface StockAllocationRequest {
    warehouseId: number;
    productId: number;
    quantity: number;
    minQuantity: number;
    maxQuantity: number;
}

export interface StockTransferRequest {
    sourceWarehouseId: number;
    destinationWarehouseId: number;
    productId: number;
    quantity: number;
    reason: string;
    referenceNumber: string;
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