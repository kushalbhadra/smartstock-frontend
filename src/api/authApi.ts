import axiosInstance from './axiosInstance';
import type { LoginRequest, LoginResponse } from '../types';

export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await axiosInstance.post('/auth/login', data);
        return response.data;
    },
};