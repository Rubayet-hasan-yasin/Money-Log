import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MonthlyTrend } from '@/types';

interface MonthlyTrendsChartProps {
  monthlyTrends: MonthlyTrend[];
}

export default function MonthlyTrendsChart({ monthlyTrends }: MonthlyTrendsChartProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  if (monthlyTrends.length === 0) return null;

  const maxTrend = Math.max(...monthlyTrends.map(t => Math.max(t.totalExpenses || 0, t.totalIncome || 0)), 1);

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold" style={{ color: textColor }}>
          Monthly Trends
        </Text>
        <Text className="text-sm" style={{ color: '#6b7280' }}>
          {new Date().getFullYear()}
        </Text>
      </View>
      <View className="border rounded-xl p-4" style={{ borderColor: '#e5e7eb', backgroundColor: cardBg }}>
        {/* Legend indicators */}
        <View className="flex-row justify-end gap-3 mb-3">
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-xs opacity-80" style={{ color: textColor }}>Income</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-red-500" />
            <Text className="text-xs opacity-80" style={{ color: textColor }}>Expense</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-end gap-5 py-2">
            {monthlyTrends.map((trend, index) => {
              const isCurrentMonth = index === monthlyTrends.length - 1;
              return (
                <View key={index} className="items-center w-[54px]">
                  <View className="h-[100px] flex-row items-end gap-1 mb-2">
                    {/* Income Bar (green) */}
                    <View
                      className="w-2.5 rounded-sm min-h-[4px]"
                      style={{
                        height: Math.max(((trend.totalIncome || 0) / maxTrend) * 90, 4),
                        backgroundColor: '#22c55e',
                        opacity: isCurrentMonth ? 1 : 0.7,
                      }}
                    />
                    {/* Expense Bar (red) */}
                    <View
                      className="w-2.5 rounded-sm min-h-[4px]"
                      style={{
                        height: Math.max(((trend.totalExpenses || 0) / maxTrend) * 90, 4),
                        backgroundColor: '#ef4444',
                        opacity: isCurrentMonth ? 1 : 0.7,
                      }}
                    />
                  </View>
                  <Text className="text-xs" style={{ color: isCurrentMonth ? tintColor : textColor, fontWeight: isCurrentMonth ? '600' : '400' }}>
                    {trend.monthName.slice(0, 3)}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
