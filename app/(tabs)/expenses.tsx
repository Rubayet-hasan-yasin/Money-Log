import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { Category, Expense, ExpenseFilters, Wallet } from '@/types';
import { DateRangeType, exportToCSV, formatDate, getDateRange } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ExpenseListItem } from '@/components/expenses/expense-list-item';
import { ExpenseFilterModal } from '@/components/expenses/expense-filter-modal';
import { ExpenseHeader } from '@/components/expenses/expense-header';
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

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <ExpenseHeader
        isSelectionMode={isSelectionMode}
        selectedCount={selectedExpenses.length}
        totalCount={expenses.length}
        tintColor={tintColor}
        textColor={textColor}
        onCloseSelection={() => {
          setIsSelectionMode(false);
          setSelectedExpenses([]);
        }}
        onToggleSelectAll={toggleSelectAll}
        onExport={handleExportCSV}
        onBulkDelete={handleBulkDelete}
        onShowFilters={() => setShowFilters(true)}
      />

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
          renderItem={({ item }) => (
            <ExpenseListItem
              item={item}
              isSelectionMode={isSelectionMode}
              isSelected={selectedExpenses.includes(item.id)}
              tintColor={tintColor}
              textColor={textColor}
              onToggleSelection={toggleExpenseSelection}
              onLongPress={() => {
                if (!isSelectionMode) {
                  setIsSelectionMode(true);
                  setSelectedExpenses([item.id]);
                }
              }}
            />
          )}
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
      <ExpenseFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        backgroundColor={backgroundColor}
        textColor={textColor}
        tintColor={tintColor}
        categories={categories}
        wallets={wallets}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        setSelectedDateFilter={setSelectedDateFilter}
      />
    </View>
  );
}
