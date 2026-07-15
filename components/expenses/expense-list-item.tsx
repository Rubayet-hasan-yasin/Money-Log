import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CURRENCIES, Expense } from '@/types';
import { formatDate } from '@/utils/formatters';

interface ExpenseListItemProps {
  item: Expense;
  isSelectionMode: boolean;
  isSelected: boolean;
  tintColor: string;
  textColor: string;
  onToggleSelection: (id: string) => void;
  onLongPress: () => void;
}

export function ExpenseListItem({
  item,
  isSelectionMode,
  isSelected,
  tintColor,
  textColor,
  onToggleSelection,
  onLongPress,
}: ExpenseListItemProps) {
  const formatCurrencyValue = (amount: number, currency = 'BDT') => {
    const curr = CURRENCIES.find((c) => c.code === currency);
    return `${curr?.symbol || '৳'}${amount.toFixed(2)}`;
  };

  const formatDateValue = (dateString: string) => {
    return formatDate(dateString, 'medium');
  };

  const getTransactionColor = (expense: Expense) => {
    if (expense.type === 'INCOME') return '#22c55e';
    if (expense.type === 'TRANSFER') return '#64748b';
    return '#ef4444'; // EXPENSE
  };

  const getTransactionPrefix = (expense: Expense) => {
    if (expense.type === 'INCOME') return '+';
    if (expense.type === 'TRANSFER') return '⇄ ';
    return '-'; // EXPENSE
  };

  return (
    <TouchableOpacity
      className="flex-row items-center justify-between p-4 mb-3 border rounded-xl"
      style={[
        { borderColor: isSelected ? tintColor : '#e5e7eb' },
        isSelected && { backgroundColor: tintColor + '10' },
      ]}
      onPress={() => {
        if (isSelectionMode) {
          onToggleSelection(item.id);
        } else {
          router.push(`/expense/${item.id}` as any);
        }
      }}
      onLongPress={onLongPress}
    >
      {isSelectionMode && (
        <View
          className="w-[22px] h-[22px] rounded border-2 mr-3 justify-center items-center"
          style={[
            { borderColor: '#9ca3af' },
            isSelected && { backgroundColor: tintColor, borderColor: tintColor },
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      )}
      <View className="flex-row items-center flex-1">
        <View
          className="items-center justify-center mr-3 w-11 h-11 rounded-xl"
          style={{
            backgroundColor:
              item.type === 'TRANSFER'
                ? '#64748b'
                : item.type === 'INCOME'
                ? '#22c55e'
                : item.category?.color || '#ef4444',
          }}
        >
          <Text className="text-xl">
            {item.type === 'TRANSFER'
              ? '⇄'
              : item.category?.icon || (item.type === 'INCOME' ? '💵' : '📋')}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-base font-semibold" style={{ color: textColor }}>
            {item.title}
          </Text>
          <Text className="text-[13px]" style={{ color: textColor, opacity: 0.6 }}>
            {item.type === 'TRANSFER'
              ? `${item.wallet?.name || 'Source'} ➔ ${item.toWallet?.name || 'Dest'}`
              : `${item.category?.name || 'No Category'} • ${item.wallet?.name || 'Cash'}`}
            {' • '}
            {formatDateValue(item.date)}
          </Text>
          {item.description && (
            <Text
              className="text-xs mt-0.5"
              style={{ color: textColor, opacity: 0.5 }}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}
        </View>
      </View>
      <Text className="text-base font-bold" style={{ color: getTransactionColor(item) }}>
        {getTransactionPrefix(item)}
        {formatCurrencyValue(item.amount, item.currency)}
      </Text>
    </TouchableOpacity>
  );
}
