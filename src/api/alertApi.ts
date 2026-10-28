import axiosInstance from './axiosInstance';
import type { AlertLog } from '../types';

export const alertApi = {

    getAll: async (): Promise<AlertLog[]> => {
        const response = await axiosInstance.get('/api/alerts');
        return response.data;
    },

    getFailed: async (): Promise<AlertLog[]> => {
        const response = await axiosInstance.get('/api/alerts/failed');
        return response.data;
    },
};