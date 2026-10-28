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
        expectedDate: string;
    }): Promise<PurchaseOrder> => {
        const response = await axiosInstance.post(
            '/api/purchase-orders', data
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