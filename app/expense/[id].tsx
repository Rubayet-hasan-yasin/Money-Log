import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { Category, CURRENCIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const QUICK_DATES = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: '2 days ago', days: 2 },
  { label: 'Last week', days: 7 },
];

const getDateString = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const formatDisplayDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const queryClient = useQueryClient();

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories', 1, 100],
    queryFn: () => api.getCategories(1, 100),
  });

  const { data: walletsRes } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => api.getWallets(),
  });

  const { data: expenseRes, isLoading: isExpenseLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => api.getExpense(id),
    enabled: !isNew && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create transaction');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update transaction');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to delete transaction');
    },
  });

  const categories = categoriesRes?.categories || [];
  const wallets = walletsRes?.wallets || [];

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showToWalletPicker, setShowToWalletPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAnim] = useState(new Animated.Value(0));

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [walletId, setWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  // Auto-select Cash wallet for new expenses when wallets data arrives
  useEffect(() => {
    if (isNew && wallets.length > 0 && !walletId) {
      const cash = wallets.find(w => w.name === 'Cash');
      if (cash) {
        setWalletId(cash.id);
      } else {
        setWalletId(wallets[0].id);
      }
    }
  }, [isNew, wallets, walletId]);

  // Populate form for editing existing expenses
  useEffect(() => {
    if (!isNew && expenseRes?.expense) {
      const exp = expenseRes.expense;
      setTitle(exp.title);
      setAmount(exp.amount.toString());
      setCurrency(exp.currency || 'BDT');
      setType(exp.type || 'EXPENSE');
      setCategoryId(exp.categoryId || undefined);
      setWalletId(exp.walletId || '');
      setToWalletId(exp.toWalletId || '');
      setDescription(exp.description || '');
      setDate(exp.date.split('T')[0]);
    }
  }, [expenseRes, isNew]);

  const isLoading = isExpenseLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const validate = () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Title', 'Please enter a title');
      return false;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return false;
    }
    if (!walletId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Wallet', 'Please select a wallet');
      return false;
    }
    if (type === 'TRANSFER') {
      if (!toWalletId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Missing Destination', 'Please select a destination wallet');
        return false;
      }
      if (walletId === toWalletId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Invalid Transfer', 'Source and destination wallets must be different');
        return false;
      }
    }
    if (!date) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Date', 'Please select a date');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    const expenseData = {
      title: title.trim(),
      amount: parseFloat(amount),
      currency,
      type,
      walletId,
      toWalletId: type === 'TRANSFER' ? toWalletId : undefined,
      categoryId: type === 'TRANSFER' ? undefined : categoryId,
      description: description.trim() || undefined,
      date,
    };

    if (isNew) {
      createMutation.mutate(expenseData);
    } else if (id) {
      updateMutation.mutate(expenseData);
    }
  };

  const handleDeletePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDeleteConfirm(true);
    Animated.spring(deleteAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handleCancelDelete = () => {
    Animated.timing(deleteAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowDeleteConfirm(false));
  };

  const handleConfirmDelete = () => {
    if (id) {
      deleteMutation.mutate();
    }
  };

  const handleClearForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTitle('');
    setAmount('');
    setCurrency('BDT');
    setType('EXPENSE');
    setCategoryId(undefined);
    const cash = wallets.find(w => w.name === 'Cash');
    setWalletId(cash ? cash.id : (wallets[0]?.id || ''));
    setToWalletId('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedWallet = wallets.find(w => w.id === walletId);
  const selectedToWallet = wallets.find(w => w.id === toWalletId);
  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const displayAmount = amount ? parseFloat(amount) : 0;

  // Filter categories shown in selection modal
  const filteredCategories = categories.filter(c => c.type === type);

  const getHeaderColor = () => {
    if (type === 'INCOME') return '#22c55e';
    if (type === 'TRANSFER') return '#64748b';
    return '#ef4444'; // EXPENSE
  };

  const getAmountSymbol = () => {
    if (type === 'INCOME') return '+';
    if (type === 'TRANSFER') return '⇄';
    return '-'; // EXPENSE
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center gap-3" style={{ backgroundColor }}>
        <ActivityIndicator size="large" color={tintColor} />
        <Text className="text-sm" style={{ color: textColor }}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction Type Segment Control */}
        <View className="flex-row rounded-xl p-1 mb-5" style={{ backgroundColor: cardBg }}>
          {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              className={`flex-1 py-3 items-center rounded-lg ${type === t ? (t === 'EXPENSE' ? 'bg-red-500' : t === 'INCOME' ? 'bg-green-500' : 'bg-slate-500') : ''}`}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                Haptics.selectionAsync();
                setType(t);
                if (t === 'TRANSFER') {
                  setCategoryId(undefined);
                  if (walletId && walletId === toWalletId) {
                    setToWalletId('');
                  }
                } else {
                  setToWalletId('');
                }
              }}
            >
              <Text
                className={`text-sm font-semibold ${type === t ? 'text-white' : ''}`}
                style={type !== t ? { color: textColor } : {}}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount Preview Card */}
        <View className="rounded-[20px] p-6 items-center mb-6 shadow-md elevation-4" style={{ backgroundColor: getHeaderColor() }}>
          <Text className="text-sm font-medium mb-2 opacity-70" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {isNew ? `New ${type.toLowerCase()}` : `Edit ${type.toLowerCase()}`}
          </Text>
          <View className="flex-row items-start">
            <Text className="text-3xl font-semibold mt-1 text-white">
              {getAmountSymbol()} {selectedCurrency?.symbol || '৳'}
            </Text>
            <Text className="text-5xl font-bold text-white">
              {displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          {type !== 'TRANSFER' && selectedCategory && (
            <View className="flex-row items-center px-4 py-2 rounded-[20px] mt-4 gap-2" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text className="text-lg">{selectedCategory.icon || '📦'}</Text>
              <Text className="text-sm font-semibold text-white">{selectedCategory.name}</Text>
            </View>
          )}
          {type === 'TRANSFER' && selectedWallet && selectedToWallet && (
            <View className="flex-row items-center px-4 py-2 rounded-[20px] mt-4 gap-2" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text className="text-sm font-semibold text-white">
                {selectedWallet.name} ➔ {selectedToWallet.name}
              </Text>
            </View>
          )}
        </View>

        {/* Form Section */}
        <View className="rounded-2xl p-1 mb-4" style={{ backgroundColor: cardBg }}>
          {/* Title Input */}
          <View className="flex-row items-center p-4">
            <View className="w-10 h-10 rounded-xl justify-center items-center mr-3" style={{ backgroundColor: tintColor + '20' }}>
              <Ionicons name="text" size={20} color={tintColor} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium mb-1 opacity-60 text-gray-500">Title</Text>
              <TextInput
                className="text-base font-medium p-0"
                style={{ color: textColor }}
                value={title}
                onChangeText={setTitle}
                placeholder={type === 'TRANSFER' ? "e.g., Transfer to pocket money" : "What is this transaction for?"}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View className="h-[1px] ml-[68px] bg-gray-200" />

          {/* Amount Input */}
          <View className="flex-row items-center p-4">
            <View className="w-10 h-10 rounded-xl justify-center items-center mr-3 bg-green-500/20">
              <Ionicons name="cash" size={20} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium mb-1 opacity-60 text-gray-500">Amount</Text>
              <TextInput
                className="text-lg font-semibold p-0"
                style={{ color: textColor }}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity
              className="px-3 py-1.5 rounded-lg border border-gray-200 flex-row items-center gap-1"
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text className="text-sm font-semibold" style={{ color: textColor }}>
                {selectedCurrency?.symbol} {currency}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="h-[1px] ml-[68px] bg-gray-200" />

          {/* Source Wallet Selector */}
          <Pressable
            className="flex-row items-center p-4"
            onPress={() => setShowWalletPicker(true)}
          >
            <View className="w-10 h-10 rounded-xl justify-center items-center mr-3 bg-indigo-500/20">
              <Ionicons name="wallet" size={20} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium mb-1 opacity-60 text-gray-500">
                {type === 'TRANSFER' ? 'From Wallet (Source)' : 'Account / Wallet'}
              </Text>
              {selectedWallet ? (
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">{selectedWallet.icon || '💵'}</Text>
                  <Text className="text-base font-medium p-0" style={{ color: textColor }}>
                    {selectedWallet.name} (৳{selectedWallet.balance.toFixed(2)})
                  </Text>
                </View>
              ) : (
                <Text className="text-base font-medium p-0 text-gray-400">
                  Select a wallet
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          {type === 'TRANSFER' && (
            <>
              <View className="h-[1px] ml-[68px] bg-gray-200" />
              {/* Destination Wallet Selector */}
              <Pressable
                className="flex-row items-center p-4"
                onPress={() => setShowToWalletPicker(true)}
              >
                <View className="w-10 h-10 rounded-xl justify-center items-center mr-3 bg-purple-500/20">
                  <Ionicons name="arrow-forward-circle" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-medium mb-1 opacity-60 text-gray-500">To Wallet (Destination)</Text>
                  {selectedToWallet ? (
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xl">{selectedToWallet.icon || '💵'}</Text>
                      <Text className="text-base font-medium p-0" style={{ color: textColor }}>
                        {selectedToWallet.name} (৳{selectedToWallet.balance.toFixed(2)})
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-base font-medium p-0 text-gray-400">
                      Select destination wallet
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            </>
          )}

          {type !== 'TRANSFER' && (
            <>
              <View className="h-[1px] ml-[68px] bg-gray-200" />
              {/* Category Selector */}
              <Pressable
                className="flex-row items-center p-4"
                onPress={() => setShowCategoryPicker(true)}
              >
                <View className="w-10 h-10 rounded-xl justify-center items-center mr-3 bg-purple-500/20">
                  <Ionicons name="folder" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-medium mb-1 opacity-60 text-gray-500">Category</Text>
                  {selectedCategory ? (
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xl">{selectedCategory.icon || '📦'}</Text>
                      <Text className="text-base font-medium p-0" style={{ color: textColor }}>
                        {selectedCategory.name}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-base font-medium p-0 text-gray-400">
                      Select a category
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            </>
          )}

          <View className="h-[1px] ml-[68px] bg-gray-200" />

          {/* Date Selector */}
          <Pressable
            className="flex-row items-center p-4"
            onPress={() => setShowDatePicker(true)}
          >
            <View className="w-10 h-10 rounded-xl justify-center items-center mr-3 bg-amber-500/20">
              <Ionicons name="calendar" size={20} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium mb-1 opacity-60 text-gray-500">Date</Text>
              <Text className="text-base font-medium p-0" style={{ color: textColor }}>
                {formatDisplayDate(date)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <View className="h-[1px] ml-[68px] bg-gray-200" />

          {/* Description Input */}
          <View className="flex-row items-start p-4">
            <View className="w-10 h-10 rounded-xl justify-center items-center mr-3 bg-cyan-500/20 mt-1">
              <Ionicons name="document-text" size={20} color="#06b6d4" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium mb-1 opacity-60 text-gray-500">Note (optional)</Text>
              <TextInput
                className="text-[15px] min-h-[60px] p-0 font-medium"
                style={{ color: textColor, textAlignVertical: 'top' }}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a note..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-2 gap-3">
          <TouchableOpacity
            className={`p-4 rounded-xl items-center mt-2 ${isSaving ? 'opacity-60' : ''}`}
            style={{ backgroundColor: getHeaderColor() }}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons name={isNew ? "add-circle" : "checkmark-circle"} size={22} color="#fff" />
                <Text className="text-white text-base font-semibold">
                  {isNew ? `Add ${type.charAt(0) + type.slice(1).toLowerCase()}` : 'Save Changes'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {isNew ? (
            <TouchableOpacity
              className="flex-row items-center justify-center p-4 border border-gray-300 rounded-[14px] bg-gray-50 gap-2"
              onPress={handleClearForm}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={20} color="#6b7280" />
              <Text className="text-gray-500 text-base font-medium">Clear Form</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-row items-center justify-center p-4 border-2 border-red-500 rounded-[14px] gap-2"
              onPress={handleDeletePress}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text className="text-red-500 text-base font-semibold">Delete Transaction</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <Pressable className="flex-1 bg-black/60 justify-center items-center p-6" onPress={handleCancelDelete}>
          <Animated.View
            className="w-full rounded-[24px] p-6 items-center shadow-lg elevation-8"
            style={[
              {
                backgroundColor,
                transform: [{ scale: deleteAnim }],
                opacity: deleteAnim,
              }
            ]}
          >
            <View className="w-[72px] h-[72px] rounded-full bg-red-500/10 justify-center items-center mb-4">
              <Ionicons name="warning" size={48} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold mb-2" style={{ color: textColor }}>
              Delete Transaction?
            </Text>
            <Text className="text-[15px] text-center opacity-70 mb-6 leading-snug text-gray-500">
              This action cannot be undone. The transaction &quot;{title}&quot; will be permanently removed.
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                className="flex-1 p-4 rounded-[14px] items-center border border-gray-200"
                onPress={handleCancelDelete}
              >
                <Text className="text-base font-semibold" style={{ color: textColor }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 p-4 rounded-[14px] items-center bg-red-500"
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white text-base font-semibold">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDatePicker(false);
          setShowCalendar(false);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-[20px] max-h-[70%] pb-[34px]" style={{ backgroundColor }}>
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold" style={{ color: textColor }}>Select Date</Text>
              <TouchableOpacity
                className="p-2"
                onPress={() => {
                  setShowDatePicker(false);
                  setShowCalendar(false);
                }}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Quick Date Buttons */}
            <View className="flex-row flex-wrap p-4 gap-2.5">
              {QUICK_DATES.map((item) => {
                const dateValue = getDateString(item.days);
                const isSelected = date === dateValue;
                return (
                  <TouchableOpacity
                    key={item.label}
                    className="px-4 py-3 rounded-xl border"
                    style={[
                      { borderColor: isSelected ? tintColor : '#e5e7eb' },
                      isSelected && { backgroundColor: tintColor + '15' },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setDate(dateValue);
                      setShowDatePicker(false);
                      setShowCalendar(false);
                    }}
                  >
                    <Text className="text-sm font-medium" style={{ color: isSelected ? tintColor : textColor }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pick from Calendar Button */}
            <View className="px-4 pb-2">
              <TouchableOpacity
                className="flex-row items-center justify-center p-3.5 rounded-xl border gap-2"
                style={[
                  { borderColor: showCalendar ? tintColor : '#e5e7eb' },
                  showCalendar && { backgroundColor: tintColor + '10' },
                ]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  Haptics.selectionAsync();
                  setShowCalendar(!showCalendar);
                }}
              >
                <Ionicons
                  name="calendar"
                  size={20}
                  color={showCalendar ? tintColor : '#6b7280'}
                />
                <Text className="text-[15px] font-medium" style={{ color: showCalendar ? tintColor : textColor }}>
                  Pick from calendar
                </Text>
                <Ionicons
                  name={showCalendar ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={showCalendar ? tintColor : '#9ca3af'}
                />
              </TouchableOpacity>

              {/* Calendar Picker - Only show when toggled */}
              {showCalendar && (
                <View className="items-center justify-center mt-3 pt-3 border-t border-gray-200 bg-indigo-500/5 rounded-xl p-3 overflow-hidden">
                  {/* Selected Date Header */}
                  <View className="flex-row items-center gap-2 mb-2 pb-2 border-b border-gray-200 w-full justify-center">
                    <Ionicons name="calendar" size={18} color={tintColor} />
                    <Text className="text-[15px] font-semibold" style={{ color: textColor }}>
                      Selected: {formatDisplayDate(date)}
                    </Text>
                  </View>

                  <DateTimePicker
                    value={new Date(date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                      if (Platform.OS === 'android') {
                        // Android picker auto-closes, so close our modal too
                        if (event.type === 'set' && selectedDate) {
                          Haptics.selectionAsync();
                          setDate(selectedDate.toISOString().split('T')[0]);
                          setShowDatePicker(false);
                          setShowCalendar(false);
                        } else if (event.type === 'dismissed') {
                          setShowCalendar(false);
                        }
                      } else if (selectedDate) {
                        Haptics.selectionAsync();
                        setDate(selectedDate.toISOString().split('T')[0]);
                      }
                    }}
                    maximumDate={new Date()}
                    themeVariant="light"
                    className="w-full h-[150px]"
                  />

                  {Platform.OS === 'ios' && (
                    <Text className="text-xs text-gray-400 mt-2 italic">
                      Scroll to select date
                    </Text>
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity
              className="m-4 p-4 rounded-xl items-center"
              style={{ backgroundColor: tintColor }}
              onPress={() => {
                setShowDatePicker(false);
                setShowCalendar(false);
              }}
            >
              <Text className="text-white text-base font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-[20px] max-h-[70%] pb-[34px]" style={{ backgroundColor }}>
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold" style={{ color: textColor }}>Select Currency</Text>
              <TouchableOpacity
                className="p-2"
                onPress={() => setShowCurrencyPicker(false)}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: curr }) => (
                <TouchableOpacity
                  className="flex-row items-center justify-between p-4 border-b border-gray-200"
                  style={currency === curr.code ? { backgroundColor: tintColor + '15' } : {}}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCurrency(curr.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-11 h-11 rounded-xl justify-center items-center" style={{ backgroundColor: tintColor + '20' }}>
                      <Text className="text-2xl w-10 text-center" style={{ color: tintColor }}>{curr.symbol}</Text>
                    </View>
                    <View>
                      <Text className="text-base font-semibold" style={{ color: textColor }}>{curr.code}</Text>
                      <Text className="text-[13px] text-gray-500">{curr.name}</Text>
                    </View>
                  </View>
                  {currency === curr.code && (
                    <Ionicons name="checkmark-circle" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Wallet Picker Modal */}
      <Modal
        visible={showWalletPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWalletPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-[20px] max-h-[70%] pb-[34px]" style={{ backgroundColor }}>
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold" style={{ color: textColor }}>Select Wallet</Text>
              <TouchableOpacity
                className="p-2"
                onPress={() => setShowWalletPicker(false)}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={wallets}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: w }) => {
                const isSelected = walletId === w.id;
                return (
                  <TouchableOpacity
                    className="flex-row items-center justify-between p-4 border-b border-gray-200"
                    style={isSelected ? { backgroundColor: tintColor + '15' } : {}}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setWalletId(w.id);
                      setShowWalletPicker(false);
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 rounded-xl justify-center items-center" style={{ backgroundColor: (w.color || tintColor) + '20' }}>
                        <Text className="text-lg">{w.icon || '💵'}</Text>
                      </View>
                      <View>
                        <Text className="text-base font-semibold" style={{ color: textColor }}>{w.name}</Text>
                        <Text className="text-[13px] text-gray-500">৳{w.balance.toFixed(2)}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={tintColor} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Destination Wallet Picker Modal */}
      <Modal
        visible={showToWalletPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowToWalletPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-[20px] max-h-[70%] pb-[34px]" style={{ backgroundColor }}>
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold" style={{ color: textColor }}>Select Destination Wallet</Text>
              <TouchableOpacity
                className="p-2"
                onPress={() => setShowToWalletPicker(false)}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={wallets}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: w }) => {
                const isSelected = toWalletId === w.id;
                return (
                  <TouchableOpacity
                    className="flex-row items-center justify-between p-4 border-b border-gray-200"
                    style={isSelected ? { backgroundColor: tintColor + '15' } : {}}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setToWalletId(w.id);
                      setShowToWalletPicker(false);
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 rounded-xl justify-center items-center" style={{ backgroundColor: (w.color || tintColor) + '20' }}>
                        <Text className="text-lg">{w.icon || '💵'}</Text>
                      </View>
                      <View>
                        <Text className="text-base font-semibold" style={{ color: textColor }}>{w.name}</Text>
                        <Text className="text-[13px] text-gray-500">৳{w.balance.toFixed(2)}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={tintColor} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-[20px] max-h-[70%] pb-[34px]" style={{ backgroundColor }}>
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold" style={{ color: textColor }}>Select Category</Text>
              <TouchableOpacity
                className="p-2"
                onPress={() => setShowCategoryPicker(false)}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: '', name: 'No Category', icon: '📦', color: '#6b7280', userId: '', createdAt: '', updatedAt: '' } as Category, ...filteredCategories]}
              keyExtractor={(item) => item.id || 'none'}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 }}
              renderItem={({ item: cat }) => {
                const isSelected = cat.id === '' ? !categoryId : categoryId === cat.id;
                return (
                  <TouchableOpacity
                    className={`w-[47%] p-4 rounded-2xl items-center border-2 ${isSelected ? 'border-solid' : 'border-transparent'}`}
                    style={[
                      { backgroundColor: cardBg },
                      isSelected && { borderColor: getHeaderColor() },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategoryId(cat.id === '' ? undefined : cat.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text className="text-4xl mb-2">{cat.icon || '📦'}</Text>
                    <Text
                      className="text-sm font-medium text-center"
                      style={{ color: textColor }}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                    {isSelected && (
                      <View className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full justify-center items-center" style={{ backgroundColor: getHeaderColor() }}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Ionicons name="folder-open-outline" size={48} color="#9ca3af" />
                  <Text className="text-sm text-center mb-3 text-gray-500">
                    No categories of type {type.toLowerCase()} yet
                  </Text>
                  <TouchableOpacity
                    className="flex-row items-center justify-center p-4 m-3 rounded-xl border-2 border-dashed gap-2"
                    style={{ borderColor: tintColor }}
                    onPress={() => {
                      setShowCategoryPicker(false);
                      router.push('/category/new');
                    }}
                  >
                    <Text className="text-[15px] font-semibold" style={{ color: tintColor }}>Create Category</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
