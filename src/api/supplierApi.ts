import axiosInstance from './axiosInstance';
import type { Supplier } from '../types';

export const supplierApi = {

    getAll: async (): Promise<Supplier[]> => {
        const response = await axiosInstance.get('/api/suppliers');
        return response.data;
    },

    create: async (data: Partial<Supplier>): Promise<Supplier> => {
        const response = await axiosInstance.post('/api/suppliers', data);
        return response.data;
    },

    update: async (
        id: number,
        data: Partial<Supplier>
    ): Promise<Supplier> => {
        const response = await axiosInstance.put(
            `/api/suppliers/${id}`, data
        );
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/suppliers/${id}`);
    },
};