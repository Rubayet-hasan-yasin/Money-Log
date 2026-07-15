import { API_CONFIG } from '@/constants/api-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { User } from '@/types';

export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user_data';

let currentToken: string | null = null;

export const axiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const tokenManager = {
    async loadToken() {
        try {
            currentToken = await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error loading token:', error);
        }
    },

    async setToken(token: string | null) {
        currentToken = token;
        try {
            if (token) {
                await AsyncStorage.setItem(TOKEN_KEY, token);
            } else {
                await AsyncStorage.removeItem(TOKEN_KEY);
            }
        } catch (error) {
            console.error('Error saving token:', error);
        }
    },

    async getToken(): Promise<string | null> {
        if (!currentToken) {
            await this.loadToken();
        }
        return currentToken;
    },

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
    },

    async getStoredUser(): Promise<User | null> {
        try {
            const userData = await AsyncStorage.getItem(USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting stored user:', error);
            return null;
        }
    },
};

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await tokenManager.getToken();
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
axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Log the exact endpoint that failed so we know what went wrong
        console.error(`API Error on ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response?.status);
        
        if (error.response?.data) {
            // Some backends send { error: '...' } and some send { message: '...' }
            const errorData = error.response.data as any;
            const errorMessage = errorData?.error || errorData?.message || typeof errorData === 'string' ? errorData : 'An error occurred';
            throw new Error(errorMessage);
        }
        throw error;
    }
);

// Initialize token loading
tokenManager.loadToken();
