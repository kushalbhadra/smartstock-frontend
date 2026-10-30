import axiosInstance from './axiosInstance';
import type { User, UserProfileRequest, UserRequest } from '../types';

export const userApi = {

    getAll: async (): Promise<User[]> => {
        const response = await axiosInstance.get('/api/users');
        return response.data;
    },

    getCurrentProfile: async (): Promise<User> => {
        const response = await axiosInstance.get('/api/users/me');
        return response.data;
    },

    updateCurrentProfile: async (
        data: UserProfileRequest
    ): Promise<User> => {
        const response = await axiosInstance.put('/api/users/me', data);
        return response.data;
    },

    create: async (data: UserRequest): Promise<User> => {
        const response = await axiosInstance.post('/api/users', data);
        return response.data;
    },

    update: async (
        id: number,
        data: UserRequest
    ): Promise<User> => {
        const response = await axiosInstance.put(`/api/users/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/users/${id}`);
    },
};