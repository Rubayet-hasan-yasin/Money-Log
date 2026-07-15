import { MessageResponse, Wallet } from '@/types';
import { axiosInstance } from './axios-instance';

export const walletsApi = {
    async getWallets(): Promise<{ wallets: Wallet[] }> {
        const response = await axiosInstance.get<{ wallets: Wallet[] }>('/wallets');
        return response.data;
    },

    async createWallet(data: { name: string; color?: string; icon?: string; balance?: number }): Promise<{ wallet: Wallet; message?: string }> {
        const response = await axiosInstance.post<{ wallet: Wallet; message?: string }>('/wallets', data);
        return response.data;
    },

    async updateWallet(id: string, data: { name?: string; color?: string; icon?: string; balance?: number }): Promise<{ wallet: Wallet; message?: string }> {
        const response = await axiosInstance.put<{ wallet: Wallet; message?: string }>(`/wallets/${id}`, data);
        return response.data;
    },

    async deleteWallet(id: string): Promise<MessageResponse> {
        const response = await axiosInstance.delete<MessageResponse>(`/wallets/${id}`);
        return response.data;
    },
};
