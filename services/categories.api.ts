import {
    CategoriesResponse,
    CategoryResponse,
    CreateCategoryData,
    MessageResponse,
    UpdateCategoryData,
} from '@/types';
import { axiosInstance } from './axios-instance';

export const categoriesApi = {
    async getCategories(page = 1, limit = 50): Promise<CategoriesResponse> {
        const response = await axiosInstance.get<CategoriesResponse>('/categories', {
            params: { page, limit },
        });
        return response.data;
    },

    async getCategory(id: string): Promise<CategoryResponse> {
        const response = await axiosInstance.get<CategoryResponse>(`/categories/${id}`);
        return response.data;
    },

    async createCategory(data: CreateCategoryData): Promise<CategoryResponse> {
        const response = await axiosInstance.post<CategoryResponse>('/categories', data);
        return response.data;
    },

    async updateCategory(id: string, data: UpdateCategoryData): Promise<CategoryResponse> {
        const response = await axiosInstance.put<CategoryResponse>(`/categories/${id}`, data);
        return response.data;
    },

    async deleteCategory(id: string): Promise<MessageResponse> {
        const response = await axiosInstance.delete<MessageResponse>(`/categories/${id}`);
        return response.data;
    },
};
