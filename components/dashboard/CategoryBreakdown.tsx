import React from 'react';
import { Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CategoryAnalytics } from '@/types';

const CHART_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

interface CategoryBreakdownProps {
  categoryAnalytics: CategoryAnalytics[];
  totalCategoryAmount: number;
}

export default function CategoryBreakdown({ categoryAnalytics, totalCategoryAmount }: CategoryBreakdownProps) {
  const textColor = useThemeColor({}, 'text');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  if (categoryAnalytics.length === 0) return null;

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3" style={{ color: textColor }}>
        Category Breakdown
      </Text>
      <View className="border rounded-xl p-4" style={{ borderColor: '#e5e7eb', backgroundColor: cardBg }}>
        {/* Horizontal bar representation */}
        <View className="flex-row h-4 rounded-lg overflow-hidden mb-4">
          {categoryAnalytics.slice(0, 6).map((cat, index) => {
            const percentage = totalCategoryAmount > 0 ? (cat.totalAmount / totalCategoryAmount) * 100 : 0;
            return (
              <View 
                key={cat.categoryId} 
                className="min-w-[2px]"
                style={{ 
                  flex: percentage,
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length] 
                }} 
              />
            );
          })}
        </View>
        {/* Legend */}
        <View className="flex-row flex-wrap gap-2">
          {categoryAnalytics.slice(0, 6).map((cat, index) => {
            const percentage = totalCategoryAmount > 0 ? (cat.totalAmount / totalCategoryAmount) * 100 : 0;
            return (
              <View key={cat.categoryId} className="flex-row items-center w-[48%] mb-2">
                <View className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <Text className="text-xs flex-1" style={{ color: textColor }} numberOfLines={1}>
                  {cat.icon || '📦'} {cat.categoryName}
                </Text>
                <Text className="text-xs font-medium" style={{ color: '#6b7280' }}>
                  {percentage.toFixed(0)}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
