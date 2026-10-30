import axiosInstance from './axiosInstance';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types';

export const purchaseOrderApi = {

    getAll: async (): Promise<PurchaseOrder[]> => {
        const response = await axiosInstance.get('/api/purchase-orders');
        return response.data;
    },

    create: async (data: {
        supplierId: number;
        productId: number;
        warehouseId: number;
        quantity: number;
        purchaseUnitPrice: number;
        expectedDate: string | null;
    }): Promise<PurchaseOrder> => {
        const response = await axiosInstance.post(
            '/api/purchase-orders', data
        );
        return response.data;
    },

    receive: async (id: number, data: {
        quantity: number;
        receivedDate: string;
        warehouseId: number;
        referenceNumber: string;
        notes: string;
    }): Promise<PurchaseOrder> => {
        const response = await axiosInstance.post(
            `/api/purchase-orders/${id}/receipts`, data
        );
        return response.data;
    },

    updateStatus: async (
        id: number,
        status: PurchaseOrderStatus
    ): Promise<PurchaseOrder> => {
        const response = await axiosInstance.put(
            `/api/purchase-orders/${id}/status`,
            { status }
        );
        return response.data;
    },
};