import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Top 5 Spending Categories
      </Text>
      <View style={[styles.card, { borderColor: '#e5e7eb', backgroundColor: cardBg }]}>
        {top5Categories.map((category, index) => {
          const percentage = totalCategoryAmount > 0 ? (category.totalAmount / totalCategoryAmount) * 100 : 0;
          const barWidth = (category.totalAmount / maxAmount) * 100;
          return (
            <View key={category.categoryId || index} style={styles.topCategoryRow}>
              <View style={styles.topCategoryHeader}>
                <View style={styles.topCategoryInfo}>
                  <View style={[styles.topCategoryRank, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]}>
                    <Text style={styles.topCategoryRankText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.categoryIcon, { marginRight: 8 }]}>
                    {category.icon || '📦'}
                  </Text>
                  <Text style={[styles.topCategoryName, { color: textColor }]}>
                    {category.categoryName}
                  </Text>
                </View>
                <View style={styles.topCategoryAmountContainer}>
                  <Text style={[styles.topCategoryAmount, { color: textColor }]}>
                    {formatCurrency(category.totalAmount)}
                  </Text>
                  <Text style={[styles.topCategoryPercent, { color: CHART_COLORS[index % CHART_COLORS.length] }]}>
                    {percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.topCategoryBarBg}>
                <View 
                  style={[
                    styles.topCategoryBar, 
                    { 
                      width: `${barWidth}%`, 
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length] 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.topCategoryCount, { color: '#6b7280' }]}>
                {category.count} transaction{category.count !== 1 ? 's' : ''} • Avg: {formatCurrency(category.averageAmount)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  topCategoryRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  topCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topCategoryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  topCategoryRankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryIcon: {
    fontSize: 16,
  },
  topCategoryName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  topCategoryAmountContainer: {
    alignItems: 'flex-end',
  },
  topCategoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  topCategoryPercent: {
    fontSize: 12,
    fontWeight: '500',
  },
  topCategoryBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  topCategoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  topCategoryCount: {
    fontSize: 12,
  },
});
