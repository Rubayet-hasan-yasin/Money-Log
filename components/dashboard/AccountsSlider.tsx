import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>
          My Accounts / Wallets
        </Text>
        <TouchableOpacity 
          style={styles.addWalletButton} 
          onPress={() => router.push('/wallet/new' as any)}
        >
          <Ionicons name="add-circle" size={24} color={tintColor} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.walletsContainer}
      >
        {wallets.map(w => (
          <TouchableOpacity 
            key={w.id} 
            style={[styles.walletCard, { backgroundColor: cardBg }]}
            onPress={() => router.push(`/wallet/${w.id}` as any)}
          >
            <View style={styles.walletHeader}>
              <View style={[styles.walletIconBadge, { backgroundColor: (w.color || tintColor) + '20' }]}>
                <Text style={styles.walletIcon}>{w.icon || '💵'}</Text>
              </View>
              <Text style={[styles.walletName, { color: textColor }]} numberOfLines={1}>
                {w.name}
              </Text>
            </View>
            <Text style={[styles.walletBalance, { color: textColor }]}>
              {formatCurrency(w.balance)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addWalletButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  walletsContainer: {
    paddingVertical: 4,
    gap: 12,
  },
  walletCard: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    marginRight: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  walletIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIcon: {
    fontSize: 16,
  },
  walletName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: '700',
  },
});
