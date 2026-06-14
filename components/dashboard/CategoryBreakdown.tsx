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

interface CategoryBreakdownProps {
  categoryAnalytics: CategoryAnalytics[];
  totalCategoryAmount: number;
}

export default function CategoryBreakdown({ categoryAnalytics, totalCategoryAmount }: CategoryBreakdownProps) {
  const textColor = useThemeColor({}, 'text');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  if (categoryAnalytics.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Category Breakdown
      </Text>
      <View style={[styles.card, { borderColor: '#e5e7eb', backgroundColor: cardBg }]}>
        {/* Horizontal bar representation */}
        <View style={styles.pieBarContainer}>
          {categoryAnalytics.slice(0, 6).map((cat, index) => {
            const percentage = totalCategoryAmount > 0 ? (cat.totalAmount / totalCategoryAmount) * 100 : 0;
            return (
              <View 
                key={cat.categoryId} 
                style={[
                  styles.pieBarSegment, 
                  { 
                    flex: percentage,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length] 
                  }
                ]} 
              />
            );
          })}
        </View>
        {/* Legend */}
        <View style={styles.pieLegend}>
          {categoryAnalytics.slice(0, 6).map((cat, index) => {
            const percentage = totalCategoryAmount > 0 ? (cat.totalAmount / totalCategoryAmount) * 100 : 0;
            return (
              <View key={cat.categoryId} style={styles.pieLegendItem}>
                <View style={[styles.pieLegendDot, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
                <Text style={[styles.pieLegendText, { color: textColor }]} numberOfLines={1}>
                  {cat.icon || '📦'} {cat.categoryName}
                </Text>
                <Text style={[styles.pieLegendPercent, { color: '#6b7280' }]}>
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
  pieBarContainer: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  pieBarSegment: {
    minWidth: 2,
  },
  pieLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  pieLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  pieLegendText: {
    fontSize: 12,
    flex: 1,
  },
  pieLegendPercent: {
    fontSize: 12,
    fontWeight: '500',
  },
});
