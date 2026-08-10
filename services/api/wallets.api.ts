import { MessageResponse, Wallet } from '@/types';
import { axiosInstance } from '../axios-instance';

/**
 * queryFn for react-query: Fetch wallets list using axiosInstance
 */
export async function getWallets(): Promise<{ wallets: Wallet[] }> {
    const response = await axiosInstance.get<{ wallets: Wallet[] }>('/wallets');
    return response.data;
}

/**
 * Wallet service: Create a new wallet using axiosInstance
 */
export async function createWallet(data: { name: string; color?: string; icon?: string; balance?: number }): Promise<{ wallet: Wallet; message?: string }> {
    const response = await axiosInstance.post<{ wallet: Wallet; message?: string }>('/wallets', data);
    return response.data;
}

/**
 * Wallet service: Update an existing wallet using axiosInstance
 */
export async function updateWallet(id: string, data: { name?: string; color?: string; icon?: string; balance?: number }): Promise<{ wallet: Wallet; message?: string }> {
    const response = await axiosInstance.put<{ wallet: Wallet; message?: string }>(`/wallets/${id}`, data);
    return response.data;
}

/**
 * Wallet service: Delete a wallet using axiosInstance
 */
export async function deleteWallet(id: string): Promise<MessageResponse> {
    const response = await axiosInstance.delete<MessageResponse>(`/wallets/${id}`);
    return response.data;
}

export const walletsApi = {
    getWallets,
    createWallet,
    updateWallet,
    deleteWallet,
};
