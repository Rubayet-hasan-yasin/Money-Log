import React from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import GoogleLoginButton from '@/components/auth/google-login-button';
import EmailLoginForm from '@/components/auth/email-login-form';


const SHOW_EMAIL_LOGIN = true;

export default function LoginScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
        className={`px-6 pt-[12vh] ${Platform.OS === 'ios' ? 'pb-10' : 'pb-6'}`}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mt-3">
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

        <View className="w-full py-6 gap-4">
          {SHOW_EMAIL_LOGIN && (
            <>
              <EmailLoginForm />
              <View className="flex-row items-center my-2">
                <View className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-800" />
                <Text className="mx-4 text-xs font-semibold text-gray-400 uppercase">OR</Text>
                <View className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-800" />
              </View>
            </>
          )}

          <GoogleLoginButton />
        </View>
        
        <View className="items-center">
          <Text className="text-[13px] text-gray-400 text-center leading-5 px-5">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
