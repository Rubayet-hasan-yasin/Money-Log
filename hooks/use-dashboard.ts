import { api } from '@/services/api';
import { CategoryAnalytics, DashboardSummary, Expense, MonthlyTrend } from '@/types';
import { useCallback, useState } from 'react';

interface DashboardData {
  summary: DashboardSummary | null;
  categoryAnalytics: CategoryAnalytics[];
  monthlyTrends: MonthlyTrend[];
  recentExpenses: Expense[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    summary: null,
    categoryAnalytics: [],
    monthlyTrends: [],
    recentExpenses: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (options?: {
    startDate?: string;
    endDate?: string;
    year?: number;
    recentLimit?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [summaryRes, analyticsRes, trendsRes, recentRes] = await Promise.all([
        api.getDashboardSummary(options?.startDate, options?.endDate),
        api.getCategoryAnalytics(options?.startDate, options?.endDate),
        api.getMonthlyTrends(options?.year || new Date().getFullYear()),
        api.getRecentExpenses(options?.recentLimit || 5),
      ]);

      setData({
        summary: summaryRes.summary || null,
        categoryAnalytics: analyticsRes.categoryAnalytics || [],
        monthlyTrends: trendsRes.trends || [],
        recentExpenses: recentRes.expenses || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      const response = await api.getDashboardSummary(startDate, endDate);
      if (response.summary) {
        setData(prev => ({ ...prev, summary: response.summary }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    }
  }, []);

  const fetchCategoryAnalytics = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      const response = await api.getCategoryAnalytics(startDate, endDate);
      if (response.categoryAnalytics) {
        setData(prev => ({ ...prev, categoryAnalytics: response.categoryAnalytics }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch category analytics');
    }
  }, []);

  const fetchMonthlyTrends = useCallback(async (year?: number) => {
    try {
      const response = await api.getMonthlyTrends(year);
      if (response.trends) {
        setData(prev => ({ ...prev, monthlyTrends: response.trends }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly trends');
    }
  }, []);

  const fetchRecentExpenses = useCallback(async (limit?: number) => {
    try {
      const response = await api.getRecentExpenses(limit);
      if (response.expenses) {
        setData(prev => ({ ...prev, recentExpenses: response.expenses }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent expenses');
    }
  }, []);

  return {
    ...data,
    isLoading,
    error,
    fetchDashboard,
    fetchSummary,
    fetchCategoryAnalytics,
    fetchMonthlyTrends,
    fetchRecentExpenses,
  };
}
