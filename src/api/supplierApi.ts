import axiosInstance from './axiosInstance';
import type {
    Supplier,
    SupplierProduct,
    SupplierProductAdminMapping,
} from '../types';

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

    getProducts: async (supplierId: number): Promise<SupplierProduct[]> => {
        const response = await axiosInstance.get(
            `/api/suppliers/${supplierId}/products`
        );
        return response.data;
    },

    getAllMappings: async (): Promise<SupplierProductAdminMapping[]> => {
        const response = await axiosInstance.get('/api/supplier-products');
        return response.data;
    },

    getActiveProducts: async (
        supplierId: number
    ): Promise<SupplierProduct[]> => {
        const response = await axiosInstance.get(
            `/api/suppliers/${supplierId}/products/active`
        );
        return response.data;
    },

    addProduct: async (
        supplierId: number,
        mapping: {
            productId: number;
            purchasePrice?: number | null;
            leadTimeDays?: number | null;
            supplierProductCode?: string | null;
        }
    ): Promise<SupplierProduct> => {
        const response = await axiosInstance.post(
            `/api/suppliers/${supplierId}/products`,
            mapping
        );
        return response.data;
    },

    setProductActive: async (
        supplierId: number,
        productId: number,
        active: boolean
    ): Promise<SupplierProduct> => {
        const response = await axiosInstance.patch(
            `/api/suppliers/${supplierId}/products/${productId}`,
            { active }
        );
        return response.data;
    },
};