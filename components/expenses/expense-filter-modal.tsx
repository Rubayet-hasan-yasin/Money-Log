import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Category, Wallet } from '@/types';
import { DateRangeType } from '@/utils/formatters';

type SortOption = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

interface ExpenseFilterModalProps {
  visible: boolean;
  onClose: () => void;
  backgroundColor: string;
  textColor: string;
  tintColor: string;
  
  categories: Category[];
  wallets: Wallet[];
  
  selectedType: string;
  setSelectedType: (type: string) => void;
  
  selectedWallet: string;
  setSelectedWallet: (wallet: string) => void;
  
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  
  setSelectedDateFilter: (filter: DateRangeType) => void;
}

export function ExpenseFilterModal({
  visible,
  onClose,
  backgroundColor,
  textColor,
  tintColor,
  categories,
  wallets,
  selectedType,
  setSelectedType,
  selectedWallet,
  setSelectedWallet,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  setSelectedDateFilter,
}: ExpenseFilterModalProps) {
  const handleReset = () => {
    setSelectedCategory('');
    setSelectedType('');
    setSelectedWallet('');
    setSortBy('date');
    setSortOrder('desc');
    setSelectedDateFilter('all');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor }}>
        <View
          className="flex-row items-center justify-between p-4 border-b"
          style={{ borderColor: '#e5e7eb' }}
        >
          <Text className="text-xl font-bold" style={{ color: textColor }}>
            Filters & Sorting
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Transaction Type Filter */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold" style={{ color: textColor }}>
              Transaction Type
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { label: 'All', value: '' },
                { label: 'Expense', value: 'EXPENSE' },
                { label: 'Income', value: 'INCOME' },
                { label: 'Transfer', value: 'TRANSFER' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  className="flex-row items-center px-4 py-2.5 rounded-xl gap-1.5"
                  style={[
                    selectedType === opt.value && { backgroundColor: tintColor },
                    selectedType !== opt.value && { borderColor: '#e5e7eb', borderWidth: 1 },
                  ]}
                  onPress={() => {
                    setSelectedType(opt.value);
                    setSelectedCategory(''); // Reset category filter since category types vary
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={[
                      selectedType === opt.value ? { color: '#fff' } : { color: textColor },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Wallet Filter */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold" style={{ color: textColor }}>
              Wallet / Account
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <TouchableOpacity
                className="flex-row items-center px-4 py-2.5 rounded-[20px] mr-2"
                style={[
                  !selectedWallet && { backgroundColor: tintColor },
                  selectedWallet && { borderColor: '#e5e7eb', borderWidth: 1 },
                ]}
                onPress={() => setSelectedWallet('')}
              >
                <Text
                  className="text-sm font-medium"
                  style={[!selectedWallet ? { color: '#fff' } : { color: textColor }]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  className="flex-row items-center px-4 py-2.5 rounded-[20px] mr-2"
                  style={[
                    selectedWallet === w.id && { backgroundColor: tintColor },
                    selectedWallet !== w.id && { borderColor: '#e5e7eb', borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedWallet(w.id)}
                >
                  <Text className="text-base mr-1.5">{w.icon || '💵'}</Text>
                  <Text
                    className="text-sm font-medium"
                    style={[selectedWallet === w.id ? { color: '#fff' } : { color: textColor }]}
                  >
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category Filter */}
          {selectedType !== 'TRANSFER' && (
            <View className="mb-6">
              <Text className="mb-3 text-base font-semibold" style={{ color: textColor }}>
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                <TouchableOpacity
                  className="flex-row items-center px-4 py-2.5 rounded-[20px] mr-2"
                  style={[
                    !selectedCategory && { backgroundColor: tintColor },
                    selectedCategory && { borderColor: '#e5e7eb', borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text
                    className="text-sm font-medium"
                    style={[!selectedCategory ? { color: '#fff' } : { color: textColor }]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories
                  .filter((cat) => !selectedType || cat.type === selectedType)
                  .map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      className="flex-row items-center px-4 py-2.5 rounded-[20px] mr-2"
                      style={[
                        selectedCategory === cat.id && { backgroundColor: tintColor },
                        selectedCategory !== cat.id && { borderColor: '#e5e7eb', borderWidth: 1 },
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text className="text-base mr-1.5">{cat.icon || '📦'}</Text>
                      <Text
                        className="text-sm font-medium"
                        style={[
                          selectedCategory === cat.id ? { color: '#fff' } : { color: textColor },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}

          {/* Sort By */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold" style={{ color: textColor }}>
              Sort By
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(['date', 'amount', 'category'] as SortOption[]).map((option) => (
                <TouchableOpacity
                  key={option}
                  className="flex-row items-center px-4 py-2.5 rounded-xl gap-1.5"
                  style={[
                    sortBy === option && { backgroundColor: tintColor },
                    sortBy !== option && { borderColor: '#e5e7eb', borderWidth: 1 },
                  ]}
                  onPress={() => setSortBy(option)}
                >
                  <Text
                    className="text-sm font-medium"
                    style={[sortBy === option ? { color: '#fff' } : { color: textColor }]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Order */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold" style={{ color: textColor }}>
              Order
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                className="flex-row items-center px-4 py-2.5 rounded-xl gap-1.5"
                style={[
                  sortOrder === 'desc' && { backgroundColor: tintColor },
                  sortOrder !== 'desc' && { borderColor: '#e5e7eb', borderWidth: 1 },
                ]}
                onPress={() => setSortOrder('desc')}
              >
                <Ionicons
                  name="arrow-down"
                  size={16}
                  color={sortOrder === 'desc' ? '#fff' : textColor}
                />
                <Text
                  className="text-sm font-medium"
                  style={[sortOrder === 'desc' ? { color: '#fff' } : { color: textColor }]}
                >
                  Descending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center px-4 py-2.5 rounded-xl gap-1.5"
                style={[
                  sortOrder === 'asc' && { backgroundColor: tintColor },
                  sortOrder !== 'asc' && { borderColor: '#e5e7eb', borderWidth: 1 },
                ]}
                onPress={() => setSortOrder('asc')}
              >
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={sortOrder === 'asc' ? '#fff' : textColor}
                />
                <Text
                  className="text-sm font-medium"
                  style={[sortOrder === 'asc' ? { color: '#fff' } : { color: textColor }]}
                >
                  Ascending
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View
          className="flex-row p-4 border-t gap-3"
          style={{ borderColor: '#e5e7eb' }}
        >
          <TouchableOpacity
            className="flex-1 items-center p-4 border rounded-xl"
            style={{ borderColor: '#e5e7eb' }}
            onPress={handleReset}
          >
            <Text className="text-base font-semibold" style={{ color: textColor }}>
              Reset
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-[2] p-4 rounded-xl items-center"
            style={{ backgroundColor: tintColor }}
            onPress={onClose}
          >
            <Text className="text-base font-semibold text-white">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
