// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  authProvider?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth response - matches actual backend response format
export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Profile update response
export interface ProfileUpdateResponse {
  message: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  password?: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    expenses: number;
  };
}

export interface CreateCategoryData {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
  icon?: string;
}

// Expense types
export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  categoryId?: string;
  category?: Category;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  title: string;
  amount: number;
  currency?: string;
  categoryId?: string;
  description?: string;
  date: string;
}

export interface UpdateExpenseData {
  title?: string;
  amount?: number;
  currency?: string;
  categoryId?: string;
  description?: string;
  date?: string;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Dashboard types
export interface DashboardSummary {
  totalAmount: number;
  totalCount: number;
  averageExpense: number;
  categoryBreakdown: Record<string, number>;
}

// Dashboard response wrappers (actual backend format)
export interface DashboardSummaryResponse {
  summary: DashboardSummary;
}

export interface CategoryAnalyticsResponse {
  categoryAnalytics: CategoryAnalytics[];
}

export interface MonthlyTrendsResponse {
  trends: MonthlyTrend[];
}

export interface RecentExpensesResponse {
  expenses: Expense[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  categoryIcon?: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  color?: string;
  icon?: string;
  totalAmount: number;
  count: number;
  averageAmount: number;
}

export interface MonthlyTrend {
  month: number;
  monthName: string;
  totalAmount: number;
  count: number;
}

// API Response types (for endpoints that use success/data wrapper)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Actual backend response formats
export interface ExpensesResponse {
  expenses: Expense[];
  pagination: Pagination;
}

export interface ExpenseResponse {
  expense: Expense;
  message?: string;
}

export interface CategoriesResponse {
  categories: Category[];
  pagination: Pagination;
}

export interface CategoryResponse {
  category: Category;
  message?: string;
}

export interface MessageResponse {
  message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

// Supported currencies
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

// Default category icons/emojis
export const CATEGORY_ICONS = [
  '🍔', '🛒', '🚗', '🏠', '💊', '🎬', '📚', '✈️', '👕', '💰',
  '🎁', '⚡', '📱', '💻', '🏋️', '🎵', '🎮', '☕', '🍕', '🚌',
  '💅', '🔧', '📦', '🎓', '👶', '🐕', '💼', '🏥', '🎨', '📰'
] as const;

// Default category colors
export const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#78716c', '#71717a'
] as const;
