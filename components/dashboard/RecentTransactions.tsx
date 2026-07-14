import React from 'react';
import { Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Expense } from '@/types';

interface RecentTransactionsProps {
  recentExpenses: Expense[];
}

export default function RecentTransactions({ recentExpenses }: RecentTransactionsProps) {
  const textColor = useThemeColor({}, 'text');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3" style={{ color: textColor }}>
        Recent Transactions
      </Text>
      <View className="border rounded-xl p-4" style={{ borderColor: '#e5e7eb', backgroundColor: cardBg }}>
        {recentExpenses.length > 0 ? (
          recentExpenses.map((expense, index) => (
            <View
              key={expense.id}
              className={`flex-row justify-between items-center py-3 ${index < recentExpenses.length - 1 ? 'border-b border-gray-200' : ''}`}
            >
              <View className="flex-1 mr-4">
                <Text className="text-sm font-medium mb-1" style={{ color: textColor }}>
                  {expense.title}
                </Text>
                <Text className="text-xs" style={{ color: textColor, opacity: 0.6 }}>
                  {expense.type === 'TRANSFER'
                    ? `${expense.wallet?.name || 'Source'} ➔ ${expense.toWallet?.name || 'Dest'}`
                    : `${expense.category?.icon || '📦'} ${expense.category?.name || 'Uncategorized'} • ${expense.wallet?.name || 'Cash'}`
                  } • {formatDate(expense.date)}
                </Text>
              </View>
              <Text className="text-sm font-semibold" style={{ 
                  color: expense.type === 'INCOME' 
                    ? '#22c55e' 
                    : (expense.type === 'TRANSFER' ? '#64748b' : textColor) 
                }}>
                {expense.type === 'INCOME' ? '+' : (expense.type === 'TRANSFER' ? '' : '-')}{formatCurrency(expense.amount)}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-center py-5" style={{ color: textColor, opacity: 0.6 }}>
            No recent transactions. Start tracking!
          </Text>
        )}
      </View>
    </View>
  );
}
