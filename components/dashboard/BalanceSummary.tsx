import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSummary } from '@/types';

interface BalanceSummaryProps {
  summary: DashboardSummary | null;
  walletsCount: number;
}

export default function BalanceSummary({ summary, walletsCount }: BalanceSummaryProps) {
  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <View className="gap-3 mb-6">
      {/* Net Balance Card */}
      <View className="p-6 rounded-2xl" style={{ backgroundColor: '#1e293b' }}>
        <Text className="text-white/80 text-sm mb-2">Total Net Balance</Text>
        <Text className="text-white text-4xl font-bold mb-1">
          {formatCurrency(summary?.netBalance || 0)}
        </Text>
        <Text className="text-white/80 text-sm">
          Across {walletsCount} account{walletsCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Income & Expenses Side by Side */}
      <View className="flex-row gap-3">
        <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: '#22c55e' }}>
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
            <Text className="text-white/80 text-xs">Income</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {formatCurrency(summary?.totalIncome || 0)}
          </Text>
        </View>
        <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: '#ef4444' }}>
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons name="trending-down" size={16} color="rgba(255,255,255,0.8)" />
            <Text className="text-white/80 text-xs">Expenses</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {formatCurrency(summary?.totalAmount || 0)}
          </Text>
        </View>
      </View>
    </View>
  );
}
