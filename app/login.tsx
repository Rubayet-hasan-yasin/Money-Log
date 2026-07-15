import { AntDesign } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import { api } from '@/services/api';
import React, { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';

import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Ensure the auth session properly completes and closes the browser
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { loginWithToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

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
    <View className="flex-1" style={{ backgroundColor }}>
      <View className={`flex-1 px-6 justify-between pt-[15vh] ${Platform.OS === 'ios' ? 'pb-10' : 'pb-6'}`}>
        <View className="items-center mt-5">
          <Image 
            source={require('../assets/icons/adaptive-icon.png')} 
            className="w-[100px] h-[100px] mb-4"
            resizeMode="contain"
          />
          <Text className="text-3xl font-extrabold mb-3 text-center" style={{ color: textColor }}>
            Money Log
          </Text>
          <Text className="text-base text-center opacity-60 leading-6 px-5" style={{ color: textColor }}>
            Take control of your finances, effortlessly.
          </Text>
        </View>

        <View className="w-full py-8">
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
        </View>
        
        <View className="items-center">
          <Text className="text-[13px] text-gray-400 text-center leading-5 px-5">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </View>
  );
}
