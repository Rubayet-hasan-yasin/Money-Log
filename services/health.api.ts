import { axiosInstance } from './axios-instance';

export const healthApi = {
    async healthCheck(): Promise<{ status: string; message: string }> {
        const response = await axiosInstance.get<{ status: string; message: string }>('/health');
        return response.data;
    }
};
