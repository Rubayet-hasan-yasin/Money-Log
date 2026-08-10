import { axiosInstance } from '../axios-instance';

/**
 * Health service: Check system health using axiosInstance
 */
export async function healthCheck(): Promise<{ status: string; message: string }> {
    const response = await axiosInstance.get<{ status: string; message: string }>('/health');
    return response.data;
}

export const healthApi = {
    healthCheck
};
