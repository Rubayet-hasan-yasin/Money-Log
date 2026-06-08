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
    StyleSheet,
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
      style={[
        styles.expenseCard, 
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
        <View style={[styles.checkbox, selectedExpenses.includes(item.id) && { backgroundColor: tintColor, borderColor: tintColor }]}>
          {selectedExpenses.includes(item.id) && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>
      )}
      <View style={styles.expenseLeft}>
        <View
          style={[
            styles.categoryIcon,
            { 
              backgroundColor: item.type === 'TRANSFER' 
                ? '#64748b' 
                : (item.type === 'INCOME' ? '#22c55e' : (item.category?.color || '#ef4444'))
            },
          ]}
        >
          <Text style={styles.categoryEmoji}>
            {item.type === 'TRANSFER' ? '⇄' : (item.category?.icon || (item.type === 'INCOME' ? '💵' : '📋'))}
          </Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseTitle, { color: textColor }]}>
            {item.title}
          </Text>
          <Text style={[styles.expenseCategory, { color: textColor, opacity: 0.6 }]}>
            {item.type === 'TRANSFER'
              ? `${item.wallet?.name || 'Source'} ➔ ${item.toWallet?.name || 'Dest'}`
              : `${item.category?.name || 'No Category'} • ${item.wallet?.name || 'Cash'}`
            } • {formatDateValue(item.date)}
          </Text>
          {item.description && (
            <Text
              style={[styles.expenseDescription, { color: textColor, opacity: 0.5 }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}
        </View>
      </View>
      <Text style={[styles.expenseAmount, { color: getTransactionColor(item) }]}>
        {getTransactionPrefix(item)}{formatCurrencyValue(item.amount, item.currency)}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading && expenses.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header with actions */}
      {isSelectionMode ? (
        <View style={[styles.selectionHeader, { backgroundColor: tintColor }]}>
          <View style={styles.selectionLeft}>
            <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedExpenses([]); }}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.selectionText}>{selectedExpenses.length} selected</Text>
          </View>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={toggleSelectAll} style={styles.selectionButton}>
              <Ionicons name={selectedExpenses.length === expenses.length ? "checkbox" : "square-outline"} size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportCSV} style={styles.selectionButton}>
              <Ionicons name="download-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBulkDelete} style={styles.selectionButton}>
              <Ionicons name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: '#e5e7eb' }]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={18} color={textColor} />
            <Text style={[styles.actionButtonText, { color: textColor }]}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: '#e5e7eb' }]}
            onPress={handleExportCSV}
          >
            <Ionicons name="download-outline" size={18} color={textColor} />
            <Text style={[styles.actionButtonText, { color: textColor }]}>Export</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Filter Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterPillsContainer}
        contentContainerStyle={styles.filterPillsContent}
      >
        {DATE_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterPill,
              selectedDateFilter === filter.value && { backgroundColor: tintColor },
              selectedDateFilter !== filter.value && { borderColor: '#e5e7eb', borderWidth: 1 },
            ]}
            onPress={() => setSelectedDateFilter(filter.value)}
          >
            <Text style={[
              styles.filterPillText,
              selectedDateFilter === filter.value ? { color: '#fff' } : { color: textColor },
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { borderColor: '#e5e7eb' }]}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
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
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && !isLoading ? (
            <ActivityIndicator style={styles.loadingMore} color={tintColor} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No transactions yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: textColor, opacity: 0.6 }]}>
              Tap the + button to add your first transaction
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      {!isSelectionMode && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: tintColor }]}
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
        <View style={[styles.modalContainer, { backgroundColor }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Filters & Sorting</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Transaction Type Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: textColor }]}>Transaction Type</Text>
              <View style={styles.sortOptions}>
                {[
                  { label: 'All', value: '' },
                  { label: 'Expense', value: 'EXPENSE' },
                  { label: 'Income', value: 'INCOME' },
                  { label: 'Transfer', value: 'TRANSFER' }
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.sortOption,
                      selectedType === opt.value && { backgroundColor: tintColor },
                      selectedType !== opt.value && { borderColor: '#e5e7eb', borderWidth: 1 },
                    ]}
                    onPress={() => {
                      setSelectedType(opt.value);
                      setSelectedCategory(''); // Reset category filter since category types vary
                    }}
                  >
                    <Text style={[styles.sortOptionText, selectedType === opt.value ? { color: '#fff' } : { color: textColor }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Wallet Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: textColor }]}>Wallet / Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.categoryPill,
                    !selectedWallet && { backgroundColor: tintColor },
                    selectedWallet && { borderColor: '#e5e7eb', borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedWallet('')}
                >
                  <Text style={[styles.categoryPillText, !selectedWallet ? { color: '#fff' } : { color: textColor }]}>
                    All
                  </Text>
                </TouchableOpacity>
                {wallets.map(w => (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.categoryPill,
                      selectedWallet === w.id && { backgroundColor: tintColor },
                      selectedWallet !== w.id && { borderColor: '#e5e7eb', borderWidth: 1 },
                    ]}
                    onPress={() => setSelectedWallet(w.id)}
                  >
                    <Text style={styles.categoryPillIcon}>{w.icon || '💵'}</Text>
                    <Text style={[styles.categoryPillText, selectedWallet === w.id ? { color: '#fff' } : { color: textColor }]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Category Filter */}
            {selectedType !== 'TRANSFER' && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: textColor }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.categoryPill,
                      !selectedCategory && { backgroundColor: tintColor },
                      selectedCategory && { borderColor: '#e5e7eb', borderWidth: 1 },
                    ]}
                    onPress={() => setSelectedCategory('')}
                  >
                    <Text style={[styles.categoryPillText, !selectedCategory ? { color: '#fff' } : { color: textColor }]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {categories
                    .filter(cat => !selectedType || cat.type === selectedType)
                    .map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryPill,
                          selectedCategory === cat.id && { backgroundColor: tintColor },
                          selectedCategory !== cat.id && { borderColor: '#e5e7eb', borderWidth: 1 },
                        ]}
                        onPress={() => setSelectedCategory(cat.id)}
                      >
                        <Text style={styles.categoryPillIcon}>{cat.icon || '📦'}</Text>
                        <Text style={[styles.categoryPillText, selectedCategory === cat.id ? { color: '#fff' } : { color: textColor }]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: textColor }]}>Sort By</Text>
              <View style={styles.sortOptions}>
                {(['date', 'amount', 'category'] as SortOption[]).map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.sortOption,
                      sortBy === option && { backgroundColor: tintColor },
                      sortBy !== option && { borderColor: '#e5e7eb', borderWidth: 1 },
                    ]}
                    onPress={() => setSortBy(option)}
                  >
                    <Text style={[styles.sortOptionText, sortBy === option ? { color: '#fff' } : { color: textColor }]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Order */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: textColor }]}>Order</Text>
              <View style={styles.sortOptions}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOrder === 'desc' && { backgroundColor: tintColor },
                    sortOrder !== 'desc' && { borderColor: '#e5e7eb', borderWidth: 1 },
                  ]}
                  onPress={() => setSortOrder('desc')}
                >
                  <Ionicons name="arrow-down" size={16} color={sortOrder === 'desc' ? '#fff' : textColor} />
                  <Text style={[styles.sortOptionText, sortOrder === 'desc' ? { color: '#fff' } : { color: textColor }]}>
                    Descending
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOrder === 'asc' && { backgroundColor: tintColor },
                    sortOrder !== 'asc' && { borderColor: '#e5e7eb', borderWidth: 1 },
                  ]}
                  onPress={() => setSortOrder('asc')}
                >
                  <Ionicons name="arrow-up" size={16} color={sortOrder === 'asc' ? '#fff' : textColor} />
                  <Text style={[styles.sortOptionText, sortOrder === 'asc' ? { color: '#fff' } : { color: textColor }]}>
                    Ascending
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: '#e5e7eb' }]}
              onPress={() => {
                setSelectedCategory('');
                setSelectedType('');
                setSelectedWallet('');
                setSortBy('date');
                setSortOrder('desc');
                setSelectedDateFilter('all');
              }}
            >
              <Text style={[styles.resetButtonText, { color: textColor }]}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: tintColor }]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  selectionButton: {
    padding: 4,
  },
  filterPillsContainer: {
    maxHeight: 50,
  },
  filterPillsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9ca3af',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 13,
  },
  expenseDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingMore: {
    paddingVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryPillIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
