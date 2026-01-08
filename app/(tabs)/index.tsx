import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { CategoryAnalytics, DashboardSummary, Expense, MonthlyTrend } from '@/types';
import { calculateTrend } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

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

export default function DashboardScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, recentRes, trendsRes, analyticsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getRecentExpenses(5),
        api.getMonthlyTrends(new Date().getFullYear()),
        api.getCategoryAnalytics(),
      ]);

      if (summaryRes.summary) setSummary(summaryRes.summary);
      if (recentRes.expenses) setRecentExpenses(recentRes.expenses);
      if (trendsRes.trends) setMonthlyTrends(trendsRes.trends);
      if (analyticsRes.categoryAnalytics) setCategoryAnalytics(analyticsRes.categoryAnalytics);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    // const curr = CURRENCIES.find(c => c.code === currency);
    return `${'৳'}${amount.toFixed(2)}`;
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) return `৳${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}K`;
    return `৳${amount.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate expense trend
  const getExpenseTrend = () => {
    if (monthlyTrends.length < 2) return null;
    const current = monthlyTrends[monthlyTrends.length - 1]?.totalAmount || 0;
    const previous = monthlyTrends[monthlyTrends.length - 2]?.totalAmount || 0;
    return calculateTrend(current, previous);
  };

  // Get top 5 categories by amount
  const getTop5Categories = () => {
    return [...categoryAnalytics]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  };

  // Calculate total for category breakdown
  const getTotalCategoryAmount = () => {
    return categoryAnalytics.reduce((sum, cat) => sum + cat.totalAmount, 0);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  const maxTrend = Math.max(...monthlyTrends.map(t => t.totalAmount), 1);
  const expenseTrend = getExpenseTrend();
  const top5Categories = getTop5Categories();
  const totalCategoryAmount = getTotalCategoryAmount();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: textColor, opacity: 0.7 }]}>
          Welcome back,
        </Text>
        <Text style={[styles.userName, { color: textColor }]}>
          {user?.name || 'User'} 👋
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: tintColor }]}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary?.totalAmount || 0)}
          </Text>
          <View style={styles.summaryFooter}>
            <Text style={styles.summarySubtext}>
              {summary?.totalCount || 0} transactions
            </Text>
            {monthlyTrends.length >= 2 && (
              <View style={styles.trendBadge}>
                {(() => {
                  const current = monthlyTrends[monthlyTrends.length - 1]?.totalAmount || 0;
                  const previous = monthlyTrends[monthlyTrends.length - 2]?.totalAmount || 0;
                  const trend = calculateTrend(current, previous);
                  return (
                    <>
                      <Ionicons 
                        name={trend.isIncrease ? "arrow-up" : "arrow-down"} 
                        size={12} 
                        color="#fff" 
                      />
                      <Text style={styles.trendText}>
                        {trend.percentage.toFixed(0)}%
                      </Text>
                    </>
                  );
                })()}
              </View>
            )}
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCardSmall, { backgroundColor: '#22c55e' }]}>
            <Text style={styles.smallCardLabel}>Average</Text>
            <Text style={styles.smallCardValue}>
              {formatCurrency(summary?.averageExpense || 0)}
            </Text>
          </View>
          <View style={[styles.summaryCardSmall, { backgroundColor: '#8b5cf6' }]}>
            <Text style={styles.smallCardLabel}>Categories</Text>
            <Text style={styles.smallCardValue}>
              {summary?.categoryBreakdown ? Object.keys(summary.categoryBreakdown).length : 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Expense Trend Card */}
      {expenseTrend && (
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
                  {formatCurrency(monthlyTrends[monthlyTrends.length - 2]?.totalAmount || 0)}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
              <View style={styles.trendCompareItem}>
                <Text style={[styles.trendCompareLabel, { color: '#6b7280' }]}>This Month</Text>
                <Text style={[styles.trendCompareValue, { color: textColor }]}>
                  {formatCurrency(monthlyTrends[monthlyTrends.length - 1]?.totalAmount || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Top 5 Spending Categories */}
      {top5Categories.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Top 5 Spending Categories
          </Text>
          <View style={[styles.card, { borderColor: '#e5e7eb' }]}>
            {top5Categories.map((category, index) => {
              const maxAmount = top5Categories[0]?.totalAmount || 1;
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
      )}

      {/* Category Breakdown (Pie Chart Style) */}
      {categoryAnalytics.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Category Breakdown
          </Text>
          <View style={[styles.card, { borderColor: '#e5e7eb' }]}>
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
      )}

      {/* Monthly Trends */}
      {monthlyTrends.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Monthly Trends
            </Text>
            <Text style={[styles.sectionSubtitle, { color: '#6b7280' }]}>
              {new Date().getFullYear()}
            </Text>
          </View>
          <View style={[styles.card, { borderColor: '#e5e7eb' }]}>
            {/* Total for year */}
            <View style={styles.yearSummary}>
              <Text style={[styles.yearSummaryLabel, { color: '#6b7280' }]}>Total This Year</Text>
              <Text style={[styles.yearSummaryValue, { color: textColor }]}>
                {formatCurrency(monthlyTrends.reduce((sum, t) => sum + t.totalAmount, 0))}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.trendsContainer}>
                {monthlyTrends.map((trend, index) => {
                  const isCurrentMonth = index === monthlyTrends.length - 1;
                  return (
                    <View key={index} style={styles.trendBar}>
                      <Text style={[styles.trendAmount, { color: isCurrentMonth ? tintColor : textColor, fontWeight: isCurrentMonth ? '600' : '400' }]}>
                        {formatCompactCurrency(trend.totalAmount)}
                      </Text>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max((trend.totalAmount / maxTrend) * 100, 4),
                              backgroundColor: isCurrentMonth ? tintColor : '#94a3b8',
                              opacity: isCurrentMonth ? 1 : 0.6,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.trendMonth, { color: isCurrentMonth ? tintColor : textColor, fontWeight: isCurrentMonth ? '600' : '400' }]}>
                        {trend.monthName.slice(0, 3)}
                      </Text>
                      <Text style={[styles.trendCount, { color: '#9ca3af' }]}>
                        {trend.count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Recent Expenses */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Recent Expenses
        </Text>
        <View style={[styles.card, { borderColor: '#e5e7eb' }]}>
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense, index) => (
              <View
                key={expense.id}
                style={[
                  styles.expenseRow,
                  index < recentExpenses.length - 1 && styles.expenseRowBorder,
                ]}
              >
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseTitle, { color: textColor }]}>
                    {expense.title}
                  </Text>
                  <Text style={[styles.expenseCategory, { color: textColor, opacity: 0.6 }]}>
                    {expense.category?.icon || '📦'} {expense.category?.name || 'Uncategorized'} • {formatDate(expense.date)}
                  </Text>
                </View>
                <Text style={[styles.expenseAmount, { color: textColor }]}>
                  -{formatCurrency(expense.amount, expense.currency)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: textColor, opacity: 0.6 }]}>
              No recent expenses. Start tracking!
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
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
  smallCardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  smallCardValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
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
  // Expense Trend Card Styles
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
  // Top 5 Categories Styles
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
  // Category Breakdown (Pie) Styles
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
  // Year Summary
  yearSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  yearSummaryLabel: {
    fontSize: 14,
  },
  yearSummaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 14,
    flex: 1,
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPercent: {
    fontSize: 12,
    marginTop: 2,
  },
  trendsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    paddingVertical: 8,
  },
  trendBar: {
    alignItems: 'center',
    width: 50,
  },
  trendAmount: {
    fontSize: 10,
    marginBottom: 4,
  },
  barContainer: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  trendMonth: {
    fontSize: 12,
  },
  trendCount: {
    fontSize: 10,
    marginTop: 2,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  expenseRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  expenseInfo: {
    flex: 1,
    marginRight: 16,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
});
