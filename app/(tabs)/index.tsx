import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { CategoryAnalytics, DashboardSummary, Expense, MonthlyTrend, Wallet } from '@/types';
import { calculateTrend } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, recentRes, trendsRes, analyticsRes, walletsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getRecentExpenses(5),
        api.getMonthlyTrends(new Date().getFullYear()),
        api.getCategoryAnalytics(),
        api.getWallets()
      ]);

      if (summaryRes.summary) setSummary(summaryRes.summary);
      if (recentRes.expenses) setRecentExpenses(recentRes.expenses);
      if (trendsRes.trends) setMonthlyTrends(trendsRes.trends);
      if (analyticsRes.categoryAnalytics) setCategoryAnalytics(analyticsRes.categoryAnalytics);
      if (walletsRes.wallets) setWallets(walletsRes.wallets);
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

  const formatCurrency = (amount: number) => {
    return `৳${amount.toFixed(2)}`;
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
    const current = monthlyTrends[monthlyTrends.length - 1]?.totalExpenses || 0;
    const previous = monthlyTrends[monthlyTrends.length - 2]?.totalExpenses || 0;
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

  const maxTrend = Math.max(...monthlyTrends.map(t => Math.max(t.totalExpenses || 0, t.totalIncome || 0)), 1);
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

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        {/* Net Balance Card */}
        <View style={[styles.summaryCard, { backgroundColor: '#1e293b' }]}>
          <Text style={styles.summaryLabel}>Total Net Balance</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary?.netBalance || 0)}
          </Text>
          <Text style={styles.summarySubtext}>
            Across {wallets.length} account{wallets.length !== 1 ? 's' : ''}
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

      {/* Wallets Horizontal Scroll */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>
            My Accounts / Wallets
          </Text>
          <TouchableOpacity 
            style={styles.addWalletButton} 
            onPress={() => router.push('/wallet/new' as any)}
          >
            <Ionicons name="add-circle" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.walletsContainer}
        >
          {wallets.map(w => (
            <TouchableOpacity 
              key={w.id} 
              style={[styles.walletCard, { backgroundColor: cardBg }]}
              onPress={() => router.push(`/wallet/${w.id}` as any)}
            >
              <View style={styles.walletHeader}>
                <View style={[styles.walletIconBadge, { backgroundColor: (w.color || tintColor) + '20' }]}>
                  <Text style={styles.walletIcon}>{w.icon || '💵'}</Text>
                </View>
                <Text style={[styles.walletName, { color: textColor }]} numberOfLines={1}>
                  {w.name}
                </Text>
              </View>
              <Text style={[styles.walletBalance, { color: textColor }]}>
                {formatCurrency(w.balance)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Expense Trend Alert Card */}
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
                  {formatCurrency(monthlyTrends[monthlyTrends.length - 2]?.totalExpenses || 0)}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
              <View style={styles.trendCompareItem}>
                <Text style={[styles.trendCompareLabel, { color: '#6b7280' }]}>This Month</Text>
                <Text style={[styles.trendCompareValue, { color: textColor }]}>
                  {formatCurrency(monthlyTrends[monthlyTrends.length - 1]?.totalExpenses || 0)}
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
          <View style={[styles.card, { borderColor: '#e5e7eb', backgroundColor: cardBg }]}>
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

      {/* Category Breakdown Legend */}
      {categoryAnalytics.length > 0 && (
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
      )}

      {/* Monthly Trends (Side-by-Side Income vs Expense Bars) */}
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
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Recent Transactions
        </Text>
        <View style={[styles.card, { borderColor: '#e5e7eb', backgroundColor: cardBg }]}>
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
                    {expense.type === 'TRANSFER'
                      ? `${expense.wallet?.name || 'Source'} ➔ ${expense.toWallet?.name || 'Dest'}`
                      : `${expense.category?.icon || '📦'} ${expense.category?.name || 'Uncategorized'} • ${expense.wallet?.name || 'Cash'}`
                    } • {formatDate(expense.date)}
                  </Text>
                </View>
                <Text style={[
                  styles.expenseAmount, 
                  { 
                    color: expense.type === 'INCOME' 
                      ? '#22c55e' 
                      : (expense.type === 'TRANSFER' ? '#64748b' : textColor) 
                  }
                ]}>
                  {expense.type === 'INCOME' ? '+' : (expense.type === 'TRANSFER' ? '' : '-')}{formatCurrency(expense.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: textColor, opacity: 0.6 }]}>
              No recent transactions. Start tracking!
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
  // Wallets Slider Styles
  walletsContainer: {
    paddingVertical: 4,
    gap: 12,
  },
  walletCard: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    marginRight: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  walletIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIcon: {
    fontSize: 16,
  },
  walletName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: '700',
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
  addWalletButton: {
    padding: 4,
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
  // Trend Card Styles
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
  categoryIcon: {
    fontSize: 16,
  },
  // Trends chart
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
