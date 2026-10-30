
import axiosInstance from './axiosInstance';
import type {
    Stock,
    StockMovement,
    StockMovementPage,
    StockMovementRequest,
    StockTransferRequest,
    StockAllocationRequest,
} from '../types';

export const stockApi = {
    createAllocation: async (data: StockAllocationRequest): Promise<Stock> => {
        const response = await axiosInstance.post('/api/stocks', data);
        return response.data;
    },

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

    getHistory: async (filters: {
        type?: string;
        warehouseId?: number;
        from?: string;
        to?: string;
        search?: string;
        page?: number;
        size?: number;
    }): Promise<StockMovementPage> => {
        const response = await axiosInstance.get<StockMovementPage>(
            '/api/stocks/movements/history',
            { params: filters }
        );
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

    transfer: async (
        data: StockTransferRequest
    ): Promise<StockMovement[]> => {
        const response = await axiosInstance.post(
            '/api/stocks/transfers',
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

    exportMovements: async (filters: {
        type?: string;
        warehouseId?: number;
        from?: string;
        to?: string;
        search?: string;
    } = {}): Promise<Blob> => {
        const response = await axiosInstance.get(
            '/api/stocks/movements/export',
            { params: filters, responseType: 'blob' }
        );
        return response.data;
    },
};
