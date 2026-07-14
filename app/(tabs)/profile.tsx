import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Valid email is required');
      return;
    }

    if (password && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: { name?: string; email?: string; password?: string } = {};
      
      if (name !== user?.name) updateData.name = name.trim();
      if (email !== user?.email) updateData.email = email.trim();
      if (password) updateData.password = password;

      if (Object.keys(updateData).length > 0) {
        await updateProfile(updateData);
      }
      
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPassword('');
    setConfirmPassword('');
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Profile Header */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full justify-center items-center mb-4" style={{ backgroundColor: tintColor }}>
          <Text className="text-3xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text className="text-2xl font-bold mb-1" style={{ color: textColor }}>
          {user?.name || 'User'}
        </Text>
        <Text className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
          {user?.email}
        </Text>
      </View>

      {/* Profile Form */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold" style={{ color: textColor }}>
            Account Information
          </Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={20} color={tintColor} />
            </TouchableOpacity>
          )}
        </View>

        <View className="border rounded-xl p-4" style={{ borderColor: '#e5e7eb' }}>
          <View className="mb-4">
            <Text className="text-[13px] font-medium mb-2 opacity-70" style={{ color: textColor }}>Name</Text>
            {isEditing ? (
              <TextInput
                className="border rounded-lg p-3 text-base"
                style={{ color: textColor, borderColor: '#e5e7eb' }}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
              />
            ) : (
              <Text className="text-base" style={{ color: textColor }}>{user?.name}</Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-[13px] font-medium mb-2 opacity-70" style={{ color: textColor }}>Email</Text>
            {isEditing ? (
              <TextInput
                className="border rounded-lg p-3 text-base"
                style={{ color: textColor, borderColor: '#e5e7eb' }}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text className="text-base" style={{ color: textColor }}>{user?.email}</Text>
            )}
          </View>

          {isEditing && (
            <>
              <View className="mb-4">
                <Text className="text-[13px] font-medium mb-2 opacity-70" style={{ color: textColor }}>
                  New Password (optional)
                </Text>
                <TextInput
                  className="border rounded-lg p-3 text-base"
                  style={{ color: textColor, borderColor: '#e5e7eb' }}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>

              <View className="mb-4">
                <Text className="text-[13px] font-medium mb-2 opacity-70" style={{ color: textColor }}>
                  Confirm Password
                </Text>
                <TextInput
                  className="border rounded-lg p-3 text-base"
                  style={{ color: textColor, borderColor: '#e5e7eb' }}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>
            </>
          )}

          <View className="mb-4">
            <Text className="text-[13px] font-medium mb-2 opacity-70" style={{ color: textColor }}>Member Since</Text>
            <Text className="text-base" style={{ color: textColor }}>
              {formatDate(user?.createdAt)}
            </Text>
          </View>
        </View>

        {isEditing && (
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              className="flex-1 p-3.5 rounded-lg items-center bg-gray-100"
              onPress={handleCancel}
            >
              <Text className="text-gray-700 text-sm font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 p-3.5 rounded-lg items-center"
              style={{ backgroundColor: tintColor }}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-sm font-semibold">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        className="flex-row items-center justify-center p-4 border rounded-xl gap-2 mb-6"
        style={{ borderColor: '#ef4444' }}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text className="text-red-500 text-base font-semibold">Log Out</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View className="items-center">
        <Text className="text-xs" style={{ color: textColor, opacity: 0.4 }}>
          Expense Manager v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
