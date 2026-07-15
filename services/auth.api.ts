import { API_CONFIG } from '@/constants/api-config';
import {
    AuthResponse,
    LoginCredentials,
    ProfileUpdateResponse,
    UpdateProfileData,
    User,
} from '@/types';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { axiosInstance, tokenManager } from './axios-instance';

export const authApi = {
    async loginWithGoogle(): Promise<{ token?: string }> {
        const redirectUrl = Linking.createURL('/login');
        const authUrl = `${API_CONFIG.BASE_URL}/auth/google?redirectUrl=${encodeURIComponent(redirectUrl)}`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

        if (result.type === 'success' && result.url) {
            const url = Linking.parse(result.url);
            const token = url.queryParams?.token;
            if (typeof token === 'string') {
                return { token };
            }
        }

        return {};
    },

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
        const data = response.data;

        if (data.token) {
            await tokenManager.setToken(data.token);
            await tokenManager.saveUser(data.user);
        }

        return data;
    },

    async getProfile(): Promise<User> {
        const response = await axiosInstance.get<User>('/auth/profile');
        return response.data;
    },

    async updateProfile(data: UpdateProfileData): Promise<ProfileUpdateResponse> {
        const response = await axiosInstance.put<ProfileUpdateResponse>('/auth/profile', data);
        const result = response.data;

        if (result.user) {
            await tokenManager.saveUser(result.user);
        }

        return result;
    },

    async logout() {
        await tokenManager.setToken(null);
        await tokenManager.saveUser(null);
    },
};
