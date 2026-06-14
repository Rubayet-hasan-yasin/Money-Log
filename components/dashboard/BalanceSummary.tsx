import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.summaryContainer}>
      {/* Net Balance Card */}
      <View style={[styles.summaryCard, { backgroundColor: '#1e293b' }]}>
        <Text style={styles.summaryLabel}>Total Net Balance</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(summary?.netBalance || 0)}
        </Text>
        <Text style={styles.summarySubtext}>
          Across {walletsCount} account{walletsCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Income & Expenses Side by Side */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCardSmall, { backgroundColor: '#22c55e' }]}>
          <View style={styles.smallCardHeader}>
            <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.smallCardLabel}>Income</Text>
          </View>
          <Text style={styles.smallCardValue}>
            {formatCurrency(summary?.totalIncome || 0)}
          </Text>
        </View>
        <View style={[styles.summaryCardSmall, { backgroundColor: '#ef4444' }]}>
          <View style={styles.smallCardHeader}>
            <Ionicons name="trending-down" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.smallCardLabel}>Expenses</Text>
          </View>
          <Text style={styles.smallCardValue}>
            {formatCurrency(summary?.totalAmount || 0)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryContainer: {
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 16,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCardSmall: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  smallCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  smallCardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  smallCardValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
