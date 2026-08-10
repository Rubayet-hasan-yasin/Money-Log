import {
    CategoryAnalyticsResponse,
    DashboardSummaryResponse,
    MonthlyTrendsResponse,
    RecentExpensesResponse,
} from '@/types';
import { axiosInstance } from '../axios-instance';

/**
 * queryFn for react-query: Fetch dashboard summary using axiosInstance
 */
export async function getDashboardSummary(startDate?: string, endDate?: string): Promise<DashboardSummaryResponse> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosInstance.get<DashboardSummaryResponse>('/dashboard/summary', { params });
    return response.data;
}

/**
 * queryFn for react-query: Fetch category analytics using axiosInstance
 */
export async function getCategoryAnalytics(startDate?: string, endDate?: string): Promise<CategoryAnalyticsResponse> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosInstance.get<CategoryAnalyticsResponse>('/dashboard/category-analytics', { params });
    return response.data;
}

/**
 * queryFn for react-query: Fetch monthly trends using axiosInstance
 */
export async function getMonthlyTrends(year?: number): Promise<MonthlyTrendsResponse> {
    const params: Record<string, number> = {};
    if (year) params.year = year;

    const response = await axiosInstance.get<MonthlyTrendsResponse>('/dashboard/monthly-trends', { params });
    return response.data;
}

/**
 * queryFn for react-query: Fetch recent expenses using axiosInstance
 */
export async function getRecentExpenses(limit = 5): Promise<RecentExpensesResponse> {
    const response = await axiosInstance.get<RecentExpensesResponse>('/dashboard/recent-expenses', {
        params: { limit },
    });
    return response.data;
}

export const dashboardApi = {
    getDashboardSummary,
    getCategoryAnalytics,
    getMonthlyTrends,
    getRecentExpenses,
};
