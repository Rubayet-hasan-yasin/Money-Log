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

interface TopCategoriesProps {
  top5Categories: CategoryAnalytics[];
  totalCategoryAmount: number;
}

export default function TopCategories({ top5Categories, totalCategoryAmount }: TopCategoriesProps) {
  const textColor = useThemeColor({}, 'text');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  if (top5Categories.length === 0) return null;

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const maxAmount = top5Categories[0]?.totalAmount || 1;

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3" style={{ color: textColor }}>
        Top 5 Spending Categories
      </Text>
      <View className="border rounded-xl p-4" style={{ borderColor: '#e5e7eb', backgroundColor: cardBg }}>
        {top5Categories.map((category, index) => {
          const percentage = totalCategoryAmount > 0 ? (category.totalAmount / totalCategoryAmount) * 100 : 0;
          const barWidth = (category.totalAmount / maxAmount) * 100;
          return (
            <View key={category.categoryId || index} className="py-3 border-b" style={{ borderBottomColor: index === top5Categories.length - 1 ? 'transparent' : '#e5e7eb' }}>
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center flex-1">
                  <View className="w-6 h-6 rounded-full justify-center items-center mr-2.5" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}>
                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                  </View>
                  <Text className="text-base mr-2">
                    {category.icon || '📦'}
                  </Text>
                  <Text className="text-sm font-medium flex-1" style={{ color: textColor }}>
                    {category.categoryName}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-semibold" style={{ color: textColor }}>
                    {formatCurrency(category.totalAmount)}
                  </Text>
                  <Text className="text-xs font-medium" style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}>
                    {percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View className="h-2 rounded bg-gray-200 mb-1.5 overflow-hidden">
                <View 
                  className="h-full rounded"
                  style={{ 
                    width: `${barWidth}%`, 
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length] 
                  }} 
                />
              </View>
              <Text className="text-xs" style={{ color: '#6b7280' }}>
                {category.count} transaction{category.count !== 1 ? 's' : ''} • Avg: {formatCurrency(category.averageAmount)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
