import { api } from '@/services/api';
import { LoginCredentials, RegisterCredentials, UpdateProfileData, User } from '@/types';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = await api.getToken();
      
      if (token) {
        // Try to get user profile to verify token is valid
        const user = await api.getProfile();
        if (user && user.id) {
          setUser(user);
        } else {
          // Token is invalid, clear it
          await api.logout();
          setUser(null);
        }
      } else {
        // Try to get stored user data
        const storedUser = await api.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid session
      await api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await api.login(credentials);
    if (response.token && response.user) {
      setUser(response.user);
    } else {
      throw new Error('Login failed');
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await api.register(credentials);
    if (response.token && response.user) {
      setUser(response.user);
    } else {
      throw new Error('Registration failed');
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    const response = await api.updateProfile(data);
    if (response.user) {
      setUser(response.user);
    } else {
      throw new Error('Profile update failed');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const user = await api.getProfile();
    if (user && user.id) {
      setUser(user);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
