import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { Category, CURRENCIES, Expense, ExpenseFilters, Wallet } from '@/types';
import { DateRangeType, exportToCSV, formatDate, getDateRange } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type SortOption = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

const DATE_FILTERS: { label: string; value: DateRangeType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Year', value: 'year' },
];

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New filter states
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateRangeType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection states for bulk operations
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const buildFilters = useCallback((): ExpenseFilters => {
    const filters: ExpenseFilters = {
      sortBy,
      sortOrder,
    };
    
    const dateRange = getDateRange(selectedDateFilter);
    if (dateRange) {
      filters.startDate = dateRange.startDate;
      filters.endDate = dateRange.endDate;
    }
    
    if (selectedCategory) {
      filters.category = selectedCategory;
    }

    if (selectedType) {
      filters.type = selectedType as any;
    }

    if (selectedWallet) {
      filters.walletId = selectedWallet;
    }
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    
    return filters;
  }, [selectedDateFilter, selectedCategory, selectedType, selectedWallet, sortBy, sortOrder, searchQuery]);

  const fetchExpenses = async (pageNum = 1, refresh = false) => {
    try {
      const filters = buildFilters();
      const response = await api.getExpenses({ ...filters, page: pageNum, limit: 20 });
      
      if (response.expenses) {
        if (refresh || pageNum === 1) {
          setExpenses(response.expenses);
        } else {
          setExpenses(prev => [...prev, ...response.expenses]);
        }
        setHasMore(response.pagination.page < response.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories(1, 100);
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWallets = async () => {
    try {
      const response = await api.getWallets();
      if (response.wallets) {
        setWallets(response.wallets);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses(1, true);
      fetchCategories();
      fetchWallets();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDateFilter, selectedCategory, selectedType, selectedWallet, sortBy, sortOrder])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    setSelectedExpenses([]);
    setIsSelectionMode(false);
    fetchExpenses(1, true);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchExpenses(page + 1);
    }
  };

  const handleSearch = () => {
    setIsLoading(true);
    fetchExpenses(1, true);
  };

  // Bulk delete functionality
  const handleBulkDelete = () => {
    if (selectedExpenses.length === 0) return;
    
    Alert.alert(
      'Delete Transactions',
      `Are you sure you want to delete ${selectedExpenses.length} transaction(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              try {
                await api.bulkDeleteExpenses(selectedExpenses);
              } catch {
                await Promise.all(selectedExpenses.map(id => api.deleteExpense(id)));
              }
              setExpenses(prev => prev.filter(e => !selectedExpenses.includes(e.id)));
              setSelectedExpenses([]);
              setIsSelectionMode(false);
              Alert.alert('Success', `${selectedExpenses.length} transaction(s) deleted`);
            } catch {
              Alert.alert('Error', 'Failed to delete transactions');
            }
          },
        },
      ]
    );
  };

  // Toggle expense selection
  const toggleExpenseSelection = (id: string) => {
    setSelectedExpenses(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select all / Deselect all
  const toggleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map(e => e.id));
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      const dataToExport = selectedExpenses.length > 0 
        ? expenses.filter(e => selectedExpenses.includes(e.id))
        : expenses;
      
      if (dataToExport.length === 0) {
        Alert.alert('No Data', 'There are no transactions to export');
        return;
      }

      const csv = exportToCSV(
        dataToExport.map(e => ({
          title: e.title,
          amount: e.amount,
          currency: e.currency,
          type: e.type,
          category: e.type === 'TRANSFER' ? 'Transfer' : (e.category?.name || 'Uncategorized'),
          wallet: e.wallet?.name || 'Cash',
          toWallet: e.type === 'TRANSFER' ? (e.toWallet?.name || '') : '',
          date: formatDate(e.date),
          description: e.description || '',
        })),
        [
          { key: 'title', label: 'Title' },
          { key: 'amount', label: 'Amount' },
          { key: 'currency', label: 'Currency' },
          { key: 'type', label: 'Type' },
          { key: 'category', label: 'Category' },
          { key: 'wallet', label: 'Wallet/Account' },
          { key: 'toWallet', label: 'To Wallet' },
          { key: 'date', label: 'Date' },
          { key: 'description', label: 'Description' },
        ],
        'transactions'
      );

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `transactions_${timestamp}.csv`;

      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      
      if (!permissions.granted) {
        Alert.alert('Permission Required', 'Please grant folder access to save the CSV file');
        return;
      }

      const fileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        'text/csv'
      );

      await StorageAccessFramework.writeAsStringAsync(fileUri, csv);

      Alert.alert('Success', `Transactions exported to ${filename}`);
      
      if (selectedExpenses.length > 0) {
        setSelectedExpenses([]);
        setIsSelectionMode(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export transactions. Please try again.');
    }
  };

  const formatCurrencyValue = (amount: number, currency = 'BDT') => {
    const curr = CURRENCIES.find(c => c.code === currency);
    return `${curr?.symbol || '৳'}${amount.toFixed(2)}`;
  };

  const formatDateValue = (dateString: string) => {
    return formatDate(dateString, 'medium');
  };

  const getTransactionColor = (item: Expense) => {
    if (item.type === 'INCOME') return '#22c55e';
    if (item.type === 'TRANSFER') return '#64748b';
    return '#ef4444'; // EXPENSE
  };

  const getTransactionPrefix = (item: Expense) => {
    if (item.type === 'INCOME') return '+';
    if (item.type === 'TRANSFER') return '⇄ ';
    return '-'; // EXPENSE
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      className="flex-row justify-between items-center p-4 border rounded-xl mb-3"
      style={[
        { borderColor: selectedExpenses.includes(item.id) ? tintColor : '#e5e7eb' },
        selectedExpenses.includes(item.id) && { backgroundColor: tintColor + '10' }
      ]}
      onPress={() => {
        if (isSelectionMode) {
          toggleExpenseSelection(item.id);
        } else {
          router.push(`/expense/${item.id}` as any);
        }
      }}
      onLongPress={() => {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
          setSelectedExpenses([item.id]);
        }
      }}
    >
      {isSelectionMode && (
        <View 
          className="w-[22px] h-[22px] rounded border-2 mr-3 justify-center items-center"
          style={[
            { borderColor: '#9ca3af' },
            selectedExpenses.includes(item.id) && { backgroundColor: tintColor, borderColor: tintColor }
          ]}
        >
          {selectedExpenses.includes(item.id) && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>
      )}
      <View className="flex-row items-center flex-1">
        <View
          className="w-11 h-11 rounded-xl justify-center items-center mr-3"
          style={{ 
              backgroundColor: item.type === 'TRANSFER' 
                ? '#64748b' 
                : (item.type === 'INCOME' ? '#22c55e' : (item.category?.color || '#ef4444'))
          }}
        >
          <Text className="text-xl">
            {item.type === 'TRANSFER' ? '⇄' : (item.category?.icon || (item.type === 'INCOME' ? '💵' : '📋'))}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold mb-1" style={{ color: textColor }}>
            {item.title}
          </Text>
          <Text className="text-[13px]" style={{ color: textColor, opacity: 0.6 }}>
            {item.type === 'TRANSFER'
              ? `${item.wallet?.name || 'Source'} ➔ ${item.toWallet?.name || 'Dest'}`
              : `${item.category?.name || 'No Category'} • ${item.wallet?.name || 'Cash'}`
            } • {formatDateValue(item.date)}
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
        {getTransactionPrefix(item)}{formatCurrencyValue(item.amount, item.currency)}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading && expenses.length === 0) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor }}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      {/* Header with actions */}
      {isSelectionMode ? (
        <View className="flex-row justify-between items-center px-4 py-3 shrink-0" style={{ backgroundColor: tintColor }}>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedExpenses([]); }}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-base font-semibold">{selectedExpenses.length} selected</Text>
          </View>
          <View className="flex-row gap-4">
            <TouchableOpacity onPress={toggleSelectAll} className="p-1">
              <Ionicons name={selectedExpenses.length === expenses.length ? "checkbox" : "square-outline"} size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportCSV} className="p-1">
              <Ionicons name="download-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBulkDelete} className="p-1">
              <Ionicons name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-row justify-end px-4 pt-3 gap-3 shrink-0">
          <TouchableOpacity 
            className="flex-row items-center px-3 py-2 rounded-lg border gap-1.5"
            style={{ borderColor: '#e5e7eb' }}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={18} color={textColor} />
            <Text className="text-sm font-medium" style={{ color: textColor }}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-row items-center px-3 py-2 rounded-lg border gap-1.5"
            style={{ borderColor: '#e5e7eb' }}
            onPress={handleExportCSV}
          >
            <Ionicons name="download-outline" size={18} color={textColor} />
            <Text className="text-sm font-medium" style={{ color: textColor }}>Export</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Filter Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="min-h-[50px] max-h-[50px] grow-0 shrink-0"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' }}
      >
        {DATE_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.value}
            className="px-4 rounded-full mr-2 h-9 justify-center items-center"
            style={[
              selectedDateFilter === filter.value && { backgroundColor: tintColor },
              selectedDateFilter !== filter.value && { borderColor: '#e5e7eb', borderWidth: 1 },
            ]}
            onPress={() => setSelectedDateFilter(filter.value)}
          >
            <Text className="text-sm font-medium" style={[
              selectedDateFilter === filter.value ? { color: '#fff' } : { color: textColor },
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Bar */}
      <View className="px-4 pb-2 pt-2 shrink-0">
        <View className="flex-row items-center border rounded-xl px-3 py-2.5 gap-2" style={{ borderColor: '#e5e7eb' }}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 text-base p-0"
            style={{ color: textColor }}
            placeholder="Search transactions..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); handleSearch(); }}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Expenses List */}
      <View className="flex-1">
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && !isLoading ? (
              <ActivityIndicator className="py-5" color={tintColor} />
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center pt-[60px] px-10">
              <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
              <Text className="text-xl font-semibold mt-4" style={{ color: textColor }}>
                No transactions yet
              </Text>
              <Text className="text-sm text-center mt-2" style={{ color: textColor, opacity: 0.6 }}>
                Tap the + button to add your first transaction
              </Text>
            </View>
          }
        />
      </View>

      {/* Add Button */}
      {!isSelectionMode && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full justify-center items-center shadow-md elevation-5"
          style={{ backgroundColor: tintColor }}
          onPress={() => router.push('/expense/new')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1" style={{ backgroundColor }}>
          <View className="flex-row justify-between items-center p-4 border-b" style={{ borderColor: '#e5e7eb' }}>
            <Text className="text-xl font-bold" style={{ color: textColor }}>Filters & Sorting</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Transaction Type Filter */}
            <View className="mb-6">
              <Text className="text-base font-semibold mb-3" style={{ color: textColor }}>Transaction Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { label: 'All', value: '' },
                  { label: 'Expense', value: 'EXPENSE' },
                  { label: 'Income', value: 'INCOME' },
                  { label: 'Transfer', value: 'TRANSFER' }
                ].map(opt => (
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
                    <Text className="text-sm font-medium" style={[selectedType === opt.value ? { color: '#fff' } : { color: textColor }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Wallet Filter */}
            <View className="mb-6">
              <Text className="text-base font-semibold mb-3" style={{ color: textColor }}>Wallet / Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  className="flex-row items-center px-4 py-2.5 rounded-[20px] mr-2"
                  style={[
                    !selectedWallet && { backgroundColor: tintColor },
                    selectedWallet && { borderColor: '#e5e7eb', borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedWallet('')}
                >
                  <Text className="text-sm font-medium" style={[!selectedWallet ? { color: '#fff' } : { color: textColor }]}>
                    All
                  </Text>
                </TouchableOpacity>
                {wallets.map(w => (
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
                    <Text className="text-sm font-medium" style={[selectedWallet === w.id ? { color: '#fff' } : { color: textColor }]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Category Filter */}
            {selectedType !== 'TRANSFER' && (
              <View className="mb-6">
                <Text className="text-base font-semibold mb-3" style={{ color: textColor }}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-2.5 rounded-[20px] mr-2"
                    style={[
                      !selectedCategory && { backgroundColor: tintColor },
                      selectedCategory && { borderColor: '#e5e7eb', borderWidth: 1 },
                    ]}
                    onPress={() => setSelectedCategory('')}
                  >
                    <Text className="text-sm font-medium" style={[!selectedCategory ? { color: '#fff' } : { color: textColor }]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {categories
                    .filter(cat => !selectedType || cat.type === selectedType)
                    .map(cat => (
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
                        <Text className="text-sm font-medium" style={[selectedCategory === cat.id ? { color: '#fff' } : { color: textColor }]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            {/* Sort By */}
            <View className="mb-6">
              <Text className="text-base font-semibold mb-3" style={{ color: textColor }}>Sort By</Text>
              <View className="flex-row flex-wrap gap-2">
                {(['date', 'amount', 'category'] as SortOption[]).map(option => (
                  <TouchableOpacity
                    key={option}
                    className="flex-row items-center px-4 py-2.5 rounded-xl gap-1.5"
                    style={[
                      sortBy === option && { backgroundColor: tintColor },
                      sortBy !== option && { borderColor: '#e5e7eb', borderWidth: 1 },
                    ]}
                    onPress={() => setSortBy(option)}
                  >
                    <Text className="text-sm font-medium" style={[sortBy === option ? { color: '#fff' } : { color: textColor }]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Order */}
            <View className="mb-6">
              <Text className="text-base font-semibold mb-3" style={{ color: textColor }}>Order</Text>
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity
                  className="flex-row items-center px-4 py-2.5 rounded-xl gap-1.5"
                  style={[
                    sortOrder === 'desc' && { backgroundColor: tintColor },
                    sortOrder !== 'desc' && { borderColor: '#e5e7eb', borderWidth: 1 },
                  ]}
                  onPress={() => setSortOrder('desc')}
                >
                  <Ionicons name="arrow-down" size={16} color={sortOrder === 'desc' ? '#fff' : textColor} />
                  <Text className="text-sm font-medium" style={[sortOrder === 'desc' ? { color: '#fff' } : { color: textColor }]}>
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
                  <Ionicons name="arrow-up" size={16} color={sortOrder === 'asc' ? '#fff' : textColor} />
                  <Text className="text-sm font-medium" style={[sortOrder === 'asc' ? { color: '#fff' } : { color: textColor }]}>
                    Ascending
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View className="flex-row p-4 border-t gap-3" style={{ borderColor: '#e5e7eb' }}>
            <TouchableOpacity
              className="flex-1 p-4 rounded-xl border items-center"
              style={{ borderColor: '#e5e7eb' }}
              onPress={() => {
                setSelectedCategory('');
                setSelectedType('');
                setSelectedWallet('');
                setSortBy('date');
                setSortOrder('desc');
                setSelectedDateFilter('all');
              }}
            >
              <Text className="text-base font-semibold" style={{ color: textColor }}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-[2] p-4 rounded-xl items-center"
              style={{ backgroundColor: tintColor }}
              onPress={() => setShowFilters(false)}
            >
              <Text className="text-white text-base font-semibold">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
