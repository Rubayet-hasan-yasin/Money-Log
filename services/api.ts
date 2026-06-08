import { API_CONFIG } from '@/constants/api-config';
import {
    AuthResponse,
    CategoriesResponse,
    CategoryAnalyticsResponse,
    CategoryResponse,
    CreateCategoryData,
    CreateExpenseData,
    DashboardSummaryResponse,
    ExpenseFilters,
    ExpenseResponse,
    ExpensesResponse,
    LoginCredentials,
    MessageResponse,
    MonthlyTrendsResponse,
    ProfileUpdateResponse,
    RecentExpensesResponse,
    RegisterCredentials,
    UpdateCategoryData,
    UpdateExpenseData,
    UpdateProfileData,
    User,
    Wallet,
} from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';

// Token storage key
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

class ApiService {
    private token: string | null = null;
    private axiosInstance: AxiosInstance;

    constructor() {
        // Create axios instance with base configuration
        this.axiosInstance = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include auth token
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                const token = await this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.data) {
                    const errorData = error.response.data as { error?: string };
                    throw new Error(errorData.error || 'An error occurred');
                }
                throw error;
            }
        );

        this.loadToken();
    }

    private async loadToken() {
        try {
            this.token = await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error loading token:', error);
        }
    }

    async setToken(token: string | null) {
        this.token = token;
        try {
            if (token) {
                await AsyncStorage.setItem(TOKEN_KEY, token);
            } else {
                await AsyncStorage.removeItem(TOKEN_KEY);
            }
        } catch (error) {
            console.error('Error saving token:', error);
        }
    }

    async getToken(): Promise<string | null> {
        if (!this.token) {
            await this.loadToken();
        }
        return this.token;
    }

    async saveUser(user: User | null) {
        try {
            if (user) {
                await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
            } else {
                await AsyncStorage.removeItem(USER_KEY);
            }
        } catch (error) {
            console.error('Error saving user:', error);
        }
    }

    async getStoredUser(): Promise<User | null> {
        try {
            const userData = await AsyncStorage.getItem(USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting stored user:', error);
            return null;
        }
    }

    // ==================== Auth API ====================

    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        const response = await this.axiosInstance.post<AuthResponse>('/auth/register', credentials);
        const data = response.data;

        if (data.token) {
            await this.setToken(data.token);
            await this.saveUser(data.user);
        }

        return data;
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await this.axiosInstance.post<AuthResponse>('/auth/login', credentials);
        const data = response.data;

        if (data.token) {
            await this.setToken(data.token);
            await this.saveUser(data.user);
        }

        return data;
    }

    async getProfile(): Promise<User> {
        const response = await this.axiosInstance.get<User>('/auth/profile');
        return response.data;
    }

    async updateProfile(data: UpdateProfileData): Promise<ProfileUpdateResponse> {
        const response = await this.axiosInstance.put<ProfileUpdateResponse>('/auth/profile', data);
        const result = response.data;

        if (result.user) {
            await this.saveUser(result.user);
        }

        return result;
    }

    async logout() {
        await this.setToken(null);
        await this.saveUser(null);
    }

    // ==================== Categories API ====================

    async getCategories(page = 1, limit = 50): Promise<CategoriesResponse> {
        const response = await this.axiosInstance.get<CategoriesResponse>('/categories', {
            params: { page, limit },
        });
        return response.data;
    }

    async getCategory(id: string): Promise<CategoryResponse> {
        const response = await this.axiosInstance.get<CategoryResponse>(`/categories/${id}`);
        return response.data;
    }

    async createCategory(data: CreateCategoryData): Promise<CategoryResponse> {
        const response = await this.axiosInstance.post<CategoryResponse>('/categories', data);
        return response.data;
    }

    async updateCategory(id: string, data: UpdateCategoryData): Promise<CategoryResponse> {
        const response = await this.axiosInstance.put<CategoryResponse>(`/categories/${id}`, data);
        return response.data;
    }

    async deleteCategory(id: string): Promise<MessageResponse> {
        const response = await this.axiosInstance.delete<MessageResponse>(`/categories/${id}`);
        return response.data;
    }

    // ==================== Wallets API ====================

    async getWallets(): Promise<{ wallets: Wallet[] }> {
        const response = await this.axiosInstance.get<{ wallets: Wallet[] }>('/wallets');
        return response.data;
    }

    async createWallet(data: { name: string; color?: string; icon?: string; balance?: number }): Promise<{ wallet: Wallet; message?: string }> {
        const response = await this.axiosInstance.post<{ wallet: Wallet; message?: string }>('/wallets', data);
        return response.data;
    }

    async updateWallet(id: string, data: { name?: string; color?: string; icon?: string; balance?: number }): Promise<{ wallet: Wallet; message?: string }> {
        const response = await this.axiosInstance.put<{ wallet: Wallet; message?: string }>(`/wallets/${id}`, data);
        return response.data;
    }

    async deleteWallet(id: string): Promise<MessageResponse> {
        const response = await this.axiosInstance.delete<MessageResponse>(`/wallets/${id}`);
        return response.data;
    }

    // ==================== Expenses API ====================

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

        const response = await this.axiosInstance.get<ExpensesResponse>('/expenses', { params });
        return response.data;
    }

    async bulkDeleteExpenses(ids: string[]): Promise<MessageResponse> {
        const response = await this.axiosInstance.post<MessageResponse>('/expenses/bulk-delete', { ids });
        return response.data;
    }

    async getExpense(id: string): Promise<ExpenseResponse> {
        const response = await this.axiosInstance.get<ExpenseResponse>(`/expenses/${id}`);
        return response.data;
    }

    async createExpense(data: CreateExpenseData): Promise<ExpenseResponse> {
        const response = await this.axiosInstance.post<ExpenseResponse>('/expenses', data);
        return response.data;
    }

    async updateExpense(id: string, data: UpdateExpenseData): Promise<ExpenseResponse> {
        const response = await this.axiosInstance.put<ExpenseResponse>(`/expenses/${id}`, data);
        return response.data;
    }

    async patchExpense(id: string, data: UpdateExpenseData): Promise<ExpenseResponse> {
        const response = await this.axiosInstance.patch<ExpenseResponse>(`/expenses/${id}`, data);
        return response.data;
    }

    async deleteExpense(id: string): Promise<MessageResponse> {
        const response = await this.axiosInstance.delete<MessageResponse>(`/expenses/${id}`);
        return response.data;
    }

    // ==================== Dashboard API ====================

    async getDashboardSummary(startDate?: string, endDate?: string): Promise<DashboardSummaryResponse> {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await this.axiosInstance.get<DashboardSummaryResponse>('/dashboard/summary', { params });
        return response.data;
    }

    async getCategoryAnalytics(startDate?: string, endDate?: string): Promise<CategoryAnalyticsResponse> {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await this.axiosInstance.get<CategoryAnalyticsResponse>('/dashboard/category-analytics', { params });
        return response.data;
    }

    async getMonthlyTrends(year?: number): Promise<MonthlyTrendsResponse> {
        const params: Record<string, number> = {};
        if (year) params.year = year;

        const response = await this.axiosInstance.get<MonthlyTrendsResponse>('/dashboard/monthly-trends', { params });
        return response.data;
    }

    async getRecentExpenses(limit = 5): Promise<RecentExpensesResponse> {
        const response = await this.axiosInstance.get<RecentExpensesResponse>('/dashboard/recent-expenses', {
            params: { limit },
        });
        return response.data;
    }

    // ==================== Health API ====================

    async healthCheck(): Promise<{ status: string; message: string }> {
        const response = await this.axiosInstance.get<{ status: string; message: string }>('/health');
        return response.data;
    }
}

// Export singleton instance
export const api = new ApiService();
