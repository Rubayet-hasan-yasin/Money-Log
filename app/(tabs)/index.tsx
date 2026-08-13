import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
// import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { getUsers } from '@/services/api/auth.api';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';
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

export default function HomeScreen() {
  // Query auth users data using React Query queryFn
  const { data: users, isPending: isUsersPending, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: QUERY_KEYS.auth.users,
    queryFn: getUsers,
  });

  // const { user } = useAuth();

  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const start = Date.now();
      const [summaryRes, recentRes, trendsRes, analyticsRes, walletsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getRecentExpenses(5),
        api.getMonthlyTrends(new Date().getFullYear()),
        api.getCategoryAnalytics(),
        api.getWallets(),
      ]);
      const end = Date.now();
      console.log(`Dashboard data fetched in ${end - start}ms`);

      return {
        summary: summaryRes.summary || null,
        recentExpenses: recentRes.expenses || [],
        monthlyTrends: trendsRes.trends || [],
        categoryAnalytics: analyticsRes.categoryAnalytics || [],
        wallets: walletsRes.wallets || [],
      };
    },
  });

  const summary = dashboardData?.summary || null;
  const recentExpenses = dashboardData?.recentExpenses || [];
  const monthlyTrends = dashboardData?.monthlyTrends || [];
  const categoryAnalytics = dashboardData?.categoryAnalytics || [];
  const wallets = dashboardData?.wallets || [];

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = () => {
    refetchUsers();
    refetch();
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

  if (isDashboardLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor }}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  const expenseTrend = getExpenseTrend();
  const top5Categories = getTop5Categories();
  const totalCategoryAmount = getTotalCategoryAmount();

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
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
