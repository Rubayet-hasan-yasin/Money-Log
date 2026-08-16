import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === 'new';

  const queryClient = useQueryClient();

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💵');
  const [color, setColor] = useState('#10B981');
  const [balance, setBalance] = useState('0.00');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  const { data: walletsResponse, isLoading: isQueryLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => api.getWallets(),
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (walletsResponse?.wallets) {
      const wallet = walletsResponse.wallets.find(w => w.id === id);
      if (wallet) {
        setName(wallet.name);
        setIcon(wallet.icon || '💵');
        setColor(wallet.color || '#10B981');
        setBalance(wallet.balance.toString());
      } else {
        Alert.alert('Error', 'Wallet not found');
        router.back();
      }
    }
  }, [walletsResponse, id]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.createWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save wallet');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => api.updateWallet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save wallet');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID missing');
      return api.deleteWallet(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete wallet');
    },
  });

  const isLoading = isQueryLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Wallet name is required');
      return false;
    }
    if (isNaN(parseFloat(balance))) {
      Alert.alert('Validation Error', 'Starting balance must be a number');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    const walletData = {
      name: name.trim(),
      icon,
      color,
      balance: parseFloat(balance),
    };

    if (isNew) {
      createMutation.mutate(walletData);
    } else if (id) {
      updateMutation.mutate(walletData);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Wallet',
      'Are you sure you want to delete this wallet? You can only delete wallets with no transaction history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor }}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <View className="items-center mb-6 pt-2">
          <View className="w-20 h-20 rounded-[20px] justify-center items-center mb-4" style={{ backgroundColor: color }}>
            <Text className="text-4xl">{icon}</Text>
          </View>
          <Text className="text-xl font-semibold mb-1" style={{ color: textColor }}>
            {name || 'Account Name'}
          </Text>
          <Text className="text-2xl font-bold" style={{ color: textColor }}>
            ৳{parseFloat(balance || '0').toFixed(2)}
          </Text>
        </View>

        {/* Name */}
        <View className="mb-5">
          <Text className="text-sm font-semibold mb-2" style={{ color: textColor }}>Name *</Text>
          <TextInput
            className="border border-gray-200 rounded-xl p-3.5 text-base"
            style={{ color: textColor, borderColor: '#e5e7eb' }}
            value={name}
            onChangeText={setName}
            placeholder="e.g., DBBL, UCB, Cash, Bkash"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Starting Balance (only when creating new) */}
        {isNew && (
          <View className="mb-5">
            <Text className="text-sm font-semibold mb-2" style={{ color: textColor }}>Starting Balance *</Text>
            <TextInput
              className="border border-gray-200 rounded-xl p-3.5 text-base"
              style={{ color: textColor, borderColor: '#e5e7eb' }}
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {/* Icon */}
        <View className="mb-5">
          <Text className="text-sm font-semibold mb-2" style={{ color: textColor }}>Icon</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between border rounded-xl p-3.5"
            style={{ borderColor: '#e5e7eb' }}
            onPress={() => {
              setShowIconPicker(!showIconPicker);
              setShowColorPicker(false);
            }}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">{icon}</Text>
              <Text className="text-base" style={{ color: textColor }}>
                Select an icon
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Icon Picker */}
        {showIconPicker && (
          <View className="border rounded-xl p-3 mb-5" style={{ borderColor: '#e5e7eb', backgroundColor: cardBg }}>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_ICONS.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-12 h-12 rounded-xl justify-center items-center"
                  style={icon === emoji ? { backgroundColor: tintColor + '30' } : {}}
                  onPress={() => {
                    setIcon(emoji);
                    setShowIconPicker(false);
                  }}
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Color */}
        <View className="mb-5">
          <Text className="text-sm font-semibold mb-2" style={{ color: textColor }}>Color</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between border rounded-xl p-3.5"
            style={{ borderColor: '#e5e7eb' }}
            onPress={() => {
              setShowColorPicker(!showColorPicker);
              setShowIconPicker(false);
            }}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
              <Text className="text-base" style={{ color: textColor }}>
                {color}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Color Picker */}
        {showColorPicker && (
          <View className="border rounded-xl p-3 mb-5" style={{ borderColor: '#e5e7eb', backgroundColor: cardBg }}>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_COLORS.map((clr, index) => (
                <TouchableOpacity
                  key={index}
                  className={`w-11 h-11 rounded-full justify-center items-center ${color === clr ? 'border-[3px] border-white shadow-sm elevation-3' : ''}`}
                  style={color === clr ? { backgroundColor: clr, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 } : { backgroundColor: clr }}
                  onPress={() => {
                    setColor(clr);
                    setShowColorPicker(false);
                  }}
                >
                  {color === clr && (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          className="p-4 rounded-xl items-center mt-2"
          style={{ backgroundColor: tintColor }}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {isNew ? 'Create Wallet' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Delete Button */}
        {!isNew && (
          <TouchableOpacity
            className="flex-row items-center justify-center p-4 border border-red-500 rounded-xl mt-4 gap-2"
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 text-base font-semibold">Delete Wallet</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
