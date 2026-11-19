
import axiosInstance from './axiosInstance';
import type { DemandForecast, ApiResponse } from '../types';

export const forecastApi = {
    getCurrent: async (): Promise<DemandForecast[]> => {
        const response = await axiosInstance.get('/api/forecasts/current');
        return response.data;
    },

    getByProduct: async (
        productId: number
    ): Promise<DemandForecast | null> => {
        const response = await axiosInstance.get(
            `/api/forecasts/product/${productId}`
        );
        return response.data;
    },

    runJob: async (): Promise<ApiResponse> => {
        const response = await axiosInstance.post('/api/forecasts/run');
        return response.data;
    },
};
