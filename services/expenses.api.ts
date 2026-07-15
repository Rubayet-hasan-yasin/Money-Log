import {
    CreateExpenseData,
    ExpenseFilters,
    ExpenseResponse,
    ExpensesResponse,
    MessageResponse,
    UpdateExpenseData,
} from '@/types';
import { axiosInstance } from './axios-instance';

export const expensesApi = {
    async getExpenses(filters: ExpenseFilters = {}): Promise<ExpensesResponse> {
        const params: Record<string, string | number> = {};

        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;
        if (filters.category) params.categoryId = filters.category;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.sortBy) params.sortBy = filters.sortBy;
        if (filters.sortOrder) params.sortOrder = filters.sortOrder;
        if (filters.search) params.search = filters.search;
        if (filters.minAmount) params.minAmount = filters.minAmount;
        if (filters.maxAmount) params.maxAmount = filters.maxAmount;
        if (filters.type) params.type = filters.type;
        if (filters.walletId) params.walletId = filters.walletId;

        const response = await axiosInstance.get<ExpensesResponse>('/expenses', { params });
        return response.data;
    },

    async bulkDeleteExpenses(ids: string[]): Promise<MessageResponse> {
        const response = await axiosInstance.post<MessageResponse>('/expenses/bulk-delete', { ids });
        return response.data;
    },

    async getExpense(id: string): Promise<ExpenseResponse> {
        const response = await axiosInstance.get<ExpenseResponse>(`/expenses/${id}`);
        return response.data;
    },

    async createExpense(data: CreateExpenseData): Promise<ExpenseResponse> {
        const response = await axiosInstance.post<ExpenseResponse>('/expenses', data);
        return response.data;
    },

    async updateExpense(id: string, data: UpdateExpenseData): Promise<ExpenseResponse> {
        const response = await axiosInstance.put<ExpenseResponse>(`/expenses/${id}`, data);
        return response.data;
    },

    async patchExpense(id: string, data: UpdateExpenseData): Promise<ExpenseResponse> {
        const response = await axiosInstance.patch<ExpenseResponse>(`/expenses/${id}`, data);
        return response.data;
    },

    async deleteExpense(id: string): Promise<MessageResponse> {
        const response = await axiosInstance.delete<MessageResponse>(`/expenses/${id}`);
        return response.data;
    },
};
