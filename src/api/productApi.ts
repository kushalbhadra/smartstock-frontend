import axiosInstance from './axiosInstance';
import type { Product, ProductRequest, ApiResponse } from '../types';

export const productApi = {

    getAll: async (): Promise<Product[]> => {
        const response = await axiosInstance.get('/api/products');
        return response.data;
    },

    getById: async (id: number): Promise<Product> => {
        const response = await axiosInstance.get(`/api/products/${id}`);
        return response.data;
    },

    create: async (data: ProductRequest): Promise<Product> => {
        const response = await axiosInstance.post('/api/products', data);
        return response.data;
    },

    update: async (id: number, data: ProductRequest): Promise<Product> => {
        const response = await axiosInstance.put(`/api/products/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<ApiResponse> => {
        const response = await axiosInstance.delete(`/api/products/${id}`);
        return response.data;
    },

    search: async (keyword: string): Promise<Product[]> => {
        const response = await axiosInstance.get(
            `/api/products/search?keyword=${keyword}`
        );
        return response.data;
    },

    exportExcel: async (): Promise<Blob> => {
        const response = await axiosInstance.get('/api/products/export', {
            responseType: 'blob',
        });
        return response.data;
    },

    downloadTemplate: async (): Promise<Blob> => {
        const response = await axiosInstance.get('/api/products/template', {
            responseType: 'blob',
        });
        return response.data;
    },

    importExcel: async (file: File): Promise<{
        success: number;
        failed: number;
        errors: string;
    }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(
            '/api/products/import',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    },
};