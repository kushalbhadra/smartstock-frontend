
import axiosInstance from './axiosInstance';
import type {
    Stock,
    StockMovement,
    StockMovementRequest,
} from '../types';

export const stockApi = {
    getAll: async (): Promise<Stock[]> => {
        const response = await axiosInstance.get('/api/stocks');
        return response.data;
    },

    getByWarehouse: async (warehouseId: number): Promise<Stock[]> => {
        const response = await axiosInstance.get(
            `/api/stocks/warehouse/${warehouseId}`
        );
        return response.data;
    },

    getLowStock: async (): Promise<Stock[]> => {
        const response = await axiosInstance.get('/api/stocks/low');
        return response.data;
    },

    getMovements: async (): Promise<StockMovement[]> => {
        const response = await axiosInstance.get('/api/stocks/movements');
        return response.data;
    },

    recordMovement: async (
        data: StockMovementRequest
    ): Promise<StockMovement> => {
        const response = await axiosInstance.post(
            '/api/stocks/movements',
            data
        );
        return response.data;
    },

    exportStocks: async (): Promise<Blob> => {
        const response = await axiosInstance.get('/api/stocks/export', {
            responseType: 'blob',
        });
        return response.data;
    },

    exportMovements: async (): Promise<Blob> => {
        const response = await axiosInstance.get(
            '/api/stocks/movements/export',
            { responseType: 'blob' }
        );
        return response.data;
    },
};
