import {
    CreateExpenseData,
    ExpenseFilters,
    ExpenseResponse,
    ExpensesResponse,
    MessageResponse,
    UpdateExpenseData,
} from '@/types';
import { axiosInstance } from '../axios-instance';

/**
 * queryFn for react-query: Fetch expenses list using axiosInstance
 */
export async function getExpenses(filters: ExpenseFilters = {}): Promise<ExpensesResponse> {
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
}

/**
 * Expense service: Bulk delete expenses using axiosInstance
 */
export async function bulkDeleteExpenses(ids: string[]): Promise<MessageResponse> {
    const response = await axiosInstance.post<MessageResponse>('/expenses/bulk-delete', { ids });
    return response.data;
}

/**
 * queryFn for react-query: Fetch single expense using axiosInstance
 */
export async function getExpense(id: string): Promise<ExpenseResponse> {
    const response = await axiosInstance.get<ExpenseResponse>(`/expenses/${id}`);
    return response.data;
}

/**
 * Expense service: Create a new expense using axiosInstance
 */
export async function createExpense(data: CreateExpenseData): Promise<ExpenseResponse> {
    const response = await axiosInstance.post<ExpenseResponse>('/expenses', data);
    return response.data;
}

/**
 * Expense service: Update an existing expense using axiosInstance
 */
export async function updateExpense(id: string, data: UpdateExpenseData): Promise<ExpenseResponse> {
    const response = await axiosInstance.put<ExpenseResponse>(`/expenses/${id}`, data);
    return response.data;
}

/**
 * Expense service: Patch an existing expense using axiosInstance
 */
export async function patchExpense(id: string, data: UpdateExpenseData): Promise<ExpenseResponse> {
    const response = await axiosInstance.patch<ExpenseResponse>(`/expenses/${id}`, data);
    return response.data;
}

/**
 * Expense service: Delete an expense using axiosInstance
 */
export async function deleteExpense(id: string): Promise<MessageResponse> {
    const response = await axiosInstance.delete<MessageResponse>(`/expenses/${id}`);
    return response.data;
}

export const expensesApi = {
    getExpenses,
    bulkDeleteExpenses,
    getExpense,
    createExpense,
    updateExpense,
    patchExpense,
    deleteExpense,
};
