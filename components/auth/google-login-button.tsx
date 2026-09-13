import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/services/api';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleLoginButton() {
  const { loginWithToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { token } = await api.loginWithGoogle();
      
      if (token) {
        await loginWithToken(token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', 'Authentication token was not received.');
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      Alert.alert('Login Failed', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-full py-4 px-6 w-full shadow-md elevation-4"
      onPress={handleGoogleLogin}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <View className="flex-row items-center justify-center gap-3">
          <AntDesign name="google" size={24} color="#971515ff" />
          <Text className="text-black text-lg font-semibold">
            Continue with Google
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
