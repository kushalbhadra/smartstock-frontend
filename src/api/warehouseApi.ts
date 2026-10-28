import axiosInstance from './axiosInstance';
import type { Warehouse } from '../types';

export const warehouseApi = {

    getAll: async (): Promise<Warehouse[]> => {
        const response = await axiosInstance.get('/api/warehouses');
        return response.data;
    },

    getById: async (id: number): Promise<Warehouse> => {
        const response = await axiosInstance.get(`/api/warehouses/${id}`);
        return response.data;
    },

    create: async (data: Partial<Warehouse>): Promise<Warehouse> => {
        const response = await axiosInstance.post('/api/warehouses', data);
        return response.data;
    },

    update: async (
        id: number,
        data: Partial<Warehouse>
    ): Promise<Warehouse> => {
        const response = await axiosInstance.put(
            `/api/warehouses/${id}`, data
        );
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/warehouses/${id}`);
    },
};