import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import { API_CONFIG } from '@/constants/api-config';
import React, { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Ensure the auth session properly completes and closes the browser
WebBrowser.maybeCompleteAuthSession();

import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { loginWithToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // 1. Generate the deep link for this Expo app
      const redirectUrl = Linking.createURL('/login');
      
      // 2. Use the base URL from environment config
      const authUrl = `${API_CONFIG.BASE_URL}/auth/google?redirectUrl=${encodeURIComponent(redirectUrl)}`;

      // 3. Open browser for Google Auth
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      // 4. Handle successful return
      if (result.type === 'success' && result.url) {
        const url = Linking.parse(result.url);
        const token = url.queryParams?.token;
        
        if (typeof token === 'string') {
           await loginWithToken(token);
           router.replace('/(tabs)');
        } else {
           Alert.alert('Login Failed', 'Authentication token was not received.');
        }
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      Alert.alert('Login Failed', 'Unable to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Image 
            source={require('../assets/icons/adaptive-icon.png')} 
            style={{ width: 100, height: 100, marginBottom: 16 }} 
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: textColor }]}>Money Log</Text>
          <Text style={[styles.subtitle, { color: textColor }]}>
            Take control of your finances, effortlessly.
          </Text>
        </View>

        <View style={styles.authContainer}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={styles.googleButtonContent}>
                <AntDesign name="google" size={24} color="#971515ff" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: height * 0.15,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  authContainer: {
    width: '100%',
    paddingVertical: 32,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  footerContainer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
