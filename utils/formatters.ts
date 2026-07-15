import { format as formatFns, formatDistanceToNow } from 'date-fns';
import { CURRENCIES } from '@/types';

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currencyCode = 'USD'): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || '$';

  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = new Date(dateString);

  switch (format) {
    case 'short':
      return formatFns(date, 'MMM d');
    case 'long':
      return formatFns(date, 'EEEE, MMMM d, yyyy');
    case 'medium':
    default:
      return formatFns(date, 'MMM d, yyyy');
  }
}

/**
 * Format a date for input (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date = new Date()): string {
  return formatFns(date, 'yyyy-MM-dd');
}

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 */
export function getRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Get month name from month number (0-11)
 */
export function getMonthName(month: number, format: 'short' | 'long' = 'long'): string {
  const date = new Date(2000, month, 1);
  return formatFns(date, format === 'short' ? 'MMM' : 'MMMM');
}

/**
 * Get current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get start and end of month
 */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  };
}

/**
 * Get start and end of year
 */
export function getYearRange(year: number): { start: string; end: string } {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Generate a random color from the CATEGORY_COLORS array
 */
export function getRandomColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#78716c', '#71717a',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get date range for quick filters
 */
export type DateRangeType = 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'all';

export function getDateRange(range: DateRangeType): { startDate: string; endDate: string } | null {
  const today = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (range) {
    case 'today':
      startDate = today;
      endDate = today;
      break;
    case 'week':
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(1); // First day of current month
      break;
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    case 'all':
      return null;
  }

  return {
    startDate: formatDateForInput(startDate),
    endDate: formatDateForInput(endDate),
  };
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  filename: string
): string {
  const csvHeaders = headers.map(h => h.label).join(',');
  const csvRows = data.map(row =>
    headers.map(h => {
      const value = row[h.key];
      // Escape commas and quotes in values
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Calculate trend percentage between two values
 */
export function calculateTrend(current: number, previous: number): { percentage: number; isIncrease: boolean } {
  if (previous === 0) {
    return { percentage: current > 0 ? 100 : 0, isIncrease: current > 0 };
  }
  const percentage = ((current - previous) / previous) * 100;
  return { percentage: Math.abs(percentage), isIncrease: percentage >= 0 };
}
