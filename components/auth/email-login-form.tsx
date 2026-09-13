import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export default function EmailLoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const textColor = useThemeColor({}, 'text');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login({ email: data.email.trim(), password: data.password });
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Email Login Error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full gap-3">
      {/* Email Input */}
      <View>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-full px-5 py-3.5 border ${errors.email ? 'border-red-500' : 'border-transparent'}`}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-base font-normal"
                style={{ color: textColor }}
                placeholder="Email address"
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
        />
        {errors.email && (
          <Text className="text-red-500 text-xs mt-1 ml-4">{errors.email.message}</Text>
        )}
      </View>

      {/* Password Input */}
      <View>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-full px-5 py-3.5 border ${errors.password ? 'border-red-500' : 'border-transparent'}`}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-base font-normal"
                style={{ color: textColor }}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          )}
        />
        {errors.password && (
          <Text className="text-red-500 text-xs mt-1 ml-4">{errors.password.message}</Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        className="bg-black dark:bg-white rounded-full py-4 px-6 w-full items-center mt-1 shadow-md"
        onPress={handleSubmit(handleLogin)}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={textColor === '#11181C' ? '#fff' : '#000'} />
        ) : (
          <Text className="text-white dark:text-black text-lg font-semibold">
            Sign In
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
