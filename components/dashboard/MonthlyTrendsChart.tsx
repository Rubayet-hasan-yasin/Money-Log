import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Monthly Trends
        </Text>
        <Text style={[styles.sectionSubtitle, { color: '#6b7280' }]}>
          {new Date().getFullYear()}
        </Text>
      </View>
      <View style={[styles.card, { borderColor: '#e5e7eb', backgroundColor: cardBg }]}>
        {/* Legend indicators */}
        <View style={styles.chartLegend}>
          <View style={styles.chartLegendItem}>
            <View style={[styles.legendIndicatorDot, { backgroundColor: '#22c55e' }]} />
            <Text style={[styles.legendIndicatorText, { color: textColor }]}>Income</Text>
          </View>
          <View style={styles.chartLegendItem}>
            <View style={[styles.legendIndicatorDot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.legendIndicatorText, { color: textColor }]}>Expense</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.trendsContainer}>
            {monthlyTrends.map((trend, index) => {
              const isCurrentMonth = index === monthlyTrends.length - 1;
              return (
                <View key={index} style={styles.trendBar}>
                  <View style={styles.barContainer}>
                    {/* Income Bar (green) */}
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(((trend.totalIncome || 0) / maxTrend) * 90, 4),
                          backgroundColor: '#22c55e',
                          opacity: isCurrentMonth ? 1 : 0.7,
                        },
                      ]}
                    />
                    {/* Expense Bar (red) */}
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(((trend.totalExpenses || 0) / maxTrend) * 90, 4),
                          backgroundColor: '#ef4444',
                          opacity: isCurrentMonth ? 1 : 0.7,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.trendMonth, { color: isCurrentMonth ? tintColor : textColor, fontWeight: isCurrentMonth ? '600' : '400' }]}>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 12,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendIndicatorText: {
    fontSize: 12,
    opacity: 0.8,
  },
  trendsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
    paddingVertical: 8,
  },
  trendBar: {
    alignItems: 'center',
    width: 54,
  },
  barContainer: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 8,
  },
  bar: {
    width: 10,
    borderRadius: 3,
    minHeight: 4,
  },
  trendMonth: {
    fontSize: 12,
  },
});
