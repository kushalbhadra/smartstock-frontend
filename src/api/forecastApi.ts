
import axiosInstance from './axiosInstance';
import type { DemandForecast, ApiResponse } from '../types';

export const forecastApi = {
    getAll: async (): Promise<DemandForecast[]> => {
        const response = await axiosInstance.get('/api/forecasts');
        return response.data;
    },

    getByProduct: async (
        productId: number
    ): Promise<DemandForecast | null> => {
        try {
            const response = await axiosInstance.get(
                `/api/forecasts/product/${productId}`
            );
            return response.data;
        } catch {
            return null;
        }
    },

    runJob: async (): Promise<ApiResponse> => {
        const response = await axiosInstance.post('/api/forecasts/run');
        return response.data;
    },
};
