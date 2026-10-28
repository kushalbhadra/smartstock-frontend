import axiosInstance from './axiosInstance';
import type { User } from '../types';

export const userApi = {

    getAll: async (): Promise<User[]> => {
        const response = await axiosInstance.get('/api/users');
        return response.data;
    },

    create: async (data: Partial<User> & {
        password?: string
    }): Promise<User> => {
        const response = await axiosInstance.post('/api/users', data);
        return response.data;
    },

    update: async (
        id: number,
        data: Partial<User>
    ): Promise<User> => {
        const response = await axiosInstance.put(`/api/users/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/users/${id}`);
    },
};