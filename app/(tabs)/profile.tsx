import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
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
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: tintColor }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.userName, { color: textColor }]}>
          {user?.name || 'User'}
        </Text>
        <Text style={[styles.userEmail, { color: textColor, opacity: 0.6 }]}>
          {user?.email}
        </Text>
      </View>

      {/* Profile Form */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Account Information
          </Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={20} color={tintColor} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.card, { borderColor: '#e5e7eb' }]}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { color: textColor, borderColor: '#e5e7eb' }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
              />
            ) : (
              <Text style={[styles.value, { color: textColor }]}>{user?.name}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>Email</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { color: textColor, borderColor: '#e5e7eb' }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={[styles.value, { color: textColor }]}>{user?.email}</Text>
            )}
          </View>

          {isEditing && (
            <>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: textColor }]}>
                  New Password (optional)
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: '#e5e7eb' }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: textColor }]}>
                  Confirm Password
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: '#e5e7eb' }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>Member Since</Text>
            <Text style={[styles.value, { color: textColor }]}>
              {formatDate(user?.createdAt)}
            </Text>
          </View>
        </View>

        {isEditing && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: '#ef4444' }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appVersion, { color: textColor, opacity: 0.4 }]}>
          Expense Manager v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 12,
  },
});
