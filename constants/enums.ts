import { DateRangeType } from '@/utils/formatters';

export const DATE_FILTERS: { label: string; value: DateRangeType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Year', value: 'year' },
];
