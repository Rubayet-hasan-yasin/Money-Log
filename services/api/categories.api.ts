import {
    CategoriesResponse,
    CategoryResponse,
    CreateCategoryData,
    MessageResponse,
    UpdateCategoryData,
} from '@/types';
import { axiosInstance } from '../axios-instance';

/**
 * queryFn for react-query: Fetch categories list using axiosInstance
 */
export async function getCategories(page = 1, limit = 50): Promise<CategoriesResponse> {
    const response = await axiosInstance.get<CategoriesResponse>('/categories', {
        params: { page, limit },
    });
    return response.data;
}

/**
 * queryFn for react-query: Fetch single category using axiosInstance
 */
export async function getCategory(id: string): Promise<CategoryResponse> {
    const response = await axiosInstance.get<CategoryResponse>(`/categories/${id}`);
    return response.data;
}

/**
 * Category service: Create a new category using axiosInstance
 */
export async function createCategory(data: CreateCategoryData): Promise<CategoryResponse> {
    const response = await axiosInstance.post<CategoryResponse>('/categories', data);
    return response.data;
}

/**
 * Category service: Update an existing category using axiosInstance
 */
export async function updateCategory(id: string, data: UpdateCategoryData): Promise<CategoryResponse> {
    const response = await axiosInstance.put<CategoryResponse>(`/categories/${id}`, data);
    return response.data;
}

/**
 * Category service: Delete a category using axiosInstance
 */
export async function deleteCategory(id: string): Promise<MessageResponse> {
    const response = await axiosInstance.delete<MessageResponse>(`/categories/${id}`);
    return response.data;
}

export const categoriesApi = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
};
