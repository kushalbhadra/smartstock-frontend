import axiosInstance from './axiosInstance';
import type { SystemSettings } from '../types';

export const settingsApi = {
    get: async (): Promise<SystemSettings> => {
        const response = await axiosInstance.get('/api/settings');
        return response.data;
    },

    update: async (data: SystemSettings): Promise<SystemSettings> => {
        const response = await axiosInstance.put('/api/settings', data);
        return response.data;
    },
};
