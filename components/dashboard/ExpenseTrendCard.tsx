import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MonthlyTrend } from '@/types';

interface ExpenseTrendCardProps {
  expenseTrend: {
    percentage: number;
    isIncrease: boolean;
  } | null;
  monthlyTrends: MonthlyTrend[];
}

export default function ExpenseTrendCard({ expenseTrend, monthlyTrends }: ExpenseTrendCardProps) {
  const textColor = useThemeColor({}, 'text');

  if (!expenseTrend) return null;

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const previousExpenses = monthlyTrends[monthlyTrends.length - 2]?.totalExpenses || 0;
  const currentExpenses = monthlyTrends[monthlyTrends.length - 1]?.totalExpenses || 0;

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3" style={{ color: textColor }}>
        Expense Trend
      </Text>
      <View className="rounded-2xl p-4" style={{ backgroundColor: expenseTrend.isIncrease ? '#fee2e2' : '#dcfce7' }}>
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 rounded-full justify-center items-center mr-3" style={{ backgroundColor: expenseTrend.isIncrease ? '#ef4444' : '#22c55e' }}>
            <Ionicons 
              name={expenseTrend.isIncrease ? "trending-up" : "trending-down"} 
              size={24} 
              color="#fff" 
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold mb-0.5" style={{ color: expenseTrend.isIncrease ? '#991b1b' : '#166534' }}>
              {expenseTrend.isIncrease ? 'Spending Increased' : 'Spending Decreased'}
            </Text>
            <Text className="text-sm" style={{ color: expenseTrend.isIncrease ? '#b91c1c' : '#15803d' }}>
              {expenseTrend.percentage.toFixed(1)}% compared to last month
            </Text>
          </View>
        </View>
        <View className="flex-row justify-around items-center pt-4 border-t border-black/10">
          <View className="items-center">
            <Text className="text-xs mb-1" style={{ color: '#6b7280' }}>Last Month</Text>
            <Text className="text-lg font-semibold" style={{ color: textColor }}>
              {formatCurrency(previousExpenses)}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
          <View className="items-center">
            <Text className="text-xs mb-1" style={{ color: '#6b7280' }}>This Month</Text>
            <Text className="text-lg font-semibold" style={{ color: textColor }}>
              {formatCurrency(currentExpenses)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
