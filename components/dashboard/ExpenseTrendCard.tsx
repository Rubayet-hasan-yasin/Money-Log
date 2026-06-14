import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Expense Trend
      </Text>
      <View style={[styles.trendCard, { backgroundColor: expenseTrend.isIncrease ? '#fee2e2' : '#dcfce7' }]}>
        <View style={styles.trendCardContent}>
          <View style={[styles.trendIconContainer, { backgroundColor: expenseTrend.isIncrease ? '#ef4444' : '#22c55e' }]}>
            <Ionicons 
              name={expenseTrend.isIncrease ? "trending-up" : "trending-down"} 
              size={24} 
              color="#fff" 
            />
          </View>
          <View style={styles.trendCardInfo}>
            <Text style={[styles.trendCardTitle, { color: expenseTrend.isIncrease ? '#991b1b' : '#166534' }]}>
              {expenseTrend.isIncrease ? 'Spending Increased' : 'Spending Decreased'}
            </Text>
            <Text style={[styles.trendCardSubtitle, { color: expenseTrend.isIncrease ? '#b91c1c' : '#15803d' }]}>
              {expenseTrend.percentage.toFixed(1)}% compared to last month
            </Text>
          </View>
        </View>
        <View style={styles.trendComparison}>
          <View style={styles.trendCompareItem}>
            <Text style={[styles.trendCompareLabel, { color: '#6b7280' }]}>Last Month</Text>
            <Text style={[styles.trendCompareValue, { color: textColor }]}>
              {formatCurrency(previousExpenses)}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
          <View style={styles.trendCompareItem}>
            <Text style={[styles.trendCompareLabel, { color: '#6b7280' }]}>This Month</Text>
            <Text style={[styles.trendCompareValue, { color: textColor }]}>
              {formatCurrency(currentExpenses)}
            </Text>
          </View>
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
  trendCard: {
    borderRadius: 16,
    padding: 16,
  },
  trendCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trendCardInfo: {
    flex: 1,
  },
  trendCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trendCardSubtitle: {
    fontSize: 14,
  },
  trendComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  trendCompareItem: {
    alignItems: 'center',
  },
  trendCompareLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  trendCompareValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});
