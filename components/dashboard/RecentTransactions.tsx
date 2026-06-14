import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
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
