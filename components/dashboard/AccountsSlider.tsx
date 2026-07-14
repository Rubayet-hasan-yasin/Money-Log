import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Wallet } from '@/types';

interface AccountsSliderProps {
  wallets: Wallet[];
}

export default function AccountsSlider({ wallets }: AccountsSliderProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold" style={{ color: textColor }}>
          My Accounts / Wallets
        </Text>
        <TouchableOpacity 
          className="p-1"
          onPress={() => router.push('/wallet/new' as any)}
        >
          <Ionicons name="add-circle" size={24} color={tintColor} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingVertical: 4, gap: 12 }}
      >
        {wallets.map(w => (
          <TouchableOpacity 
            key={w.id} 
            className="w-40 p-4 rounded-2xl mr-1"
            style={{ backgroundColor: cardBg }}
            onPress={() => router.push(`/wallet/${w.id}` as any)}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-8 h-8 rounded-[10px] justify-center items-center" style={{ backgroundColor: (w.color || tintColor) + '20' }}>
                <Text className="text-base">{w.icon || '💵'}</Text>
              </View>
              <Text className="text-sm font-semibold flex-1" style={{ color: textColor }} numberOfLines={1}>
                {w.name}
              </Text>
            </View>
            <Text className="text-lg font-bold" style={{ color: textColor }}>
              {formatCurrency(w.balance)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
