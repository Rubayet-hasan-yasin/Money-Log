import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
// import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { CategoryAnalytics, DashboardSummary, Expense, MonthlyTrend, Wallet } from '@/types';
import { calculateTrend } from '@/utils/formatters';

// Modular Dashboard Components
// import DashboardHeader from '@/components/dashboard/DashboardHeader';
import BalanceSummary from '@/components/dashboard/BalanceSummary';
import AccountsSlider from '@/components/dashboard/AccountsSlider';
import ExpenseTrendCard from '@/components/dashboard/ExpenseTrendCard';
import TopCategories from '@/components/dashboard/TopCategories';
import CategoryBreakdown from '@/components/dashboard/CategoryBreakdown';
import MonthlyTrendsChart from '@/components/dashboard/MonthlyTrendsChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';

export default function DashboardScreen() {
  // const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const fetchDashboardData = async () => {
    try {

      const start = Date.now();
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

      const end = Date.now();
      console.log(`Dashboard data fetched in ${end - start}ms`);

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
      <View className="flex-1 justify-center items-center" style={{ backgroundColor }}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  const expenseTrend = getExpenseTrend();
  const top5Categories = getTop5Categories();
  const totalCategoryAmount = getTotalCategoryAmount();

  console.log('summary', summary);
  console.log('recentExpenses', recentExpenses);
  console.log('monthlyTrends', monthlyTrends);
  console.log('categoryAnalytics', categoryAnalytics);
  console.log('wallets', wallets);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* <DashboardHeader userName={user?.name} /> */}

      <BalanceSummary summary={summary} walletsCount={wallets.length} />

      <AccountsSlider wallets={wallets} />

      <ExpenseTrendCard expenseTrend={expenseTrend} monthlyTrends={monthlyTrends} />

      <TopCategories top5Categories={top5Categories} totalCategoryAmount={totalCategoryAmount} />

      <CategoryBreakdown categoryAnalytics={categoryAnalytics} totalCategoryAmount={totalCategoryAmount} />

      <MonthlyTrendsChart monthlyTrends={monthlyTrends} />

      <RecentTransactions recentExpenses={recentExpenses} />
    </ScrollView>
  );
}
