import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { Category, CURRENCIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAnim] = useState(new Animated.Value(0));

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  const fetchData = useCallback(async () => {
    try {
      const categoriesRes = await api.getCategories();
      if (categoriesRes.categories) {
        setCategories(categoriesRes.categories);
      }

      if (!isNew && id) {
        const expenseRes = await api.getExpense(id);
        if (expenseRes.expense) {
          const exp = expenseRes.expense;
          setTitle(exp.title);
          setAmount(exp.amount.toString());
          setCurrency(exp.currency || 'USD');
          setCategoryId(exp.categoryId);
          setDescription(exp.description || '');
          setDate(exp.date.split('T')[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load expense');
    } finally {
      setIsLoading(false);
    }
  }, [id, isNew]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const validate = () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Title', 'Please enter a title for your expense');
      return false;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return false;
    }
    if (!date) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Date', 'Please select a date');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const expenseData = {
        title: title.trim(),
        amount: parseFloat(amount),
        currency,
        categoryId,
        description: description.trim() || undefined,
        date,
      };

      if (isNew) {
        await api.createExpense(expenseData);
      } else if (id) {
        await api.updateExpense(id, expenseData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save expense'
      );
    } finally {
      setIsSaving(false);
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

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (id) {
        await api.deleteExpense(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to delete expense');
      setIsDeleting(false);
      handleCancelDelete();
    }
  };

  const handleClearForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTitle('');
    setAmount('');
    setCurrency('BDT');
    setCategoryId(undefined);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const displayAmount = amount ? parseFloat(amount) : 0;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>Loading expense...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Preview Card */}
        <View style={[styles.amountCard, { backgroundColor: '#6366f1' }]}>
          <Text style={[styles.amountLabel, { color: 'rgba(255,255,255,0.8)' }]}>
            {isNew ? 'New Expense' : 'Edit Expense'}
          </Text>
          <View style={styles.amountDisplay}>
            <Text style={[styles.amountSymbol, { color: '#fff' }]}>{selectedCurrency?.symbol || '৳'}</Text>
            <Text style={[styles.amountValue, { color: '#fff' }]}>
              {displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          {selectedCategory && (
            <View style={[styles.categoryBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.categoryBadgeIcon}>{selectedCategory.icon || '📦'}</Text>
              <Text style={[styles.categoryBadgeText, { color: '#fff' }]}>{selectedCategory.name}</Text>
            </View>
          )}
        </View>

        {/* Form Section */}
        <View style={[styles.formSection, { backgroundColor: cardBg }]}>
          {/* Title Input */}
          <View style={styles.inputRow}>
            <View style={[styles.inputIcon, { backgroundColor: tintColor + '20' }]}>
              <Ionicons name="text" size={20} color={tintColor} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: '#6b7280' }]}>Title</Text>
              <TextInput
                style={[styles.inputField, { color: textColor }]}
                value={title}
                onChangeText={setTitle}
                placeholder="What did you spend on?"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Amount Input */}
          <View style={styles.inputRow}>
            <View style={[styles.inputIcon, { backgroundColor: '#22c55e20' }]}>
              <Ionicons name="cash" size={20} color="#22c55e" />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: '#6b7280' }]}>Amount</Text>
              <TextInput
                style={[styles.inputField, styles.amountInput, { color: textColor }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.currencyButton, { borderColor: '#e5e7eb' }]}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text style={[styles.currencyButtonText, { color: textColor }]}>
                {selectedCurrency?.symbol} {currency}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Category Selector */}
          <Pressable 
            style={styles.inputRow}
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={[styles.inputIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="folder" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: '#6b7280' }]}>Category</Text>
              {selectedCategory ? (
                <View style={styles.selectedCategoryRow}>
                  <Text style={styles.selectedCategoryIcon}>{selectedCategory.icon || '📦'}</Text>
                  <Text style={[styles.inputField, { color: textColor }]}>
                    {selectedCategory.name}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.inputField, { color: '#9ca3af' }]}>
                  Select a category
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <View style={styles.divider} />

          {/* Date Selector */}
          <Pressable 
            style={styles.inputRow}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={[styles.inputIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="calendar" size={20} color="#f59e0b" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: '#6b7280' }]}>Date</Text>
              <Text style={[styles.inputField, { color: textColor }]}>
                {formatDisplayDate(date)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <View style={styles.divider} />

          {/* Description Input */}
          <View style={[styles.inputRow, { alignItems: 'flex-start' }]}>
            <View style={[styles.inputIcon, { backgroundColor: '#06b6d420', marginTop: 4 }]}>
              <Ionicons name="document-text" size={20} color="#06b6d4" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: '#6b7280' }]}>Note (optional)</Text>
              <TextInput
                style={[styles.inputField, styles.noteInput, { color: textColor }]}
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
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: '#22c55e' }, isSaving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.saveButtonContent}>
                <Ionicons name={isNew ? "add-circle" : "checkmark-circle"} size={22} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {isNew ? 'Add Expense' : 'Save Changes'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {isNew ? (
            <TouchableOpacity
              style={styles.clearFormButton}
              onPress={handleClearForm}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={20} color="#6b7280" />
              <Text style={styles.clearFormButtonText}>Clear Form</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.deleteButtonOutline}
              onPress={handleDeletePress}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.deleteButtonOutlineText}>Delete Expense</Text>
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
        <Pressable style={styles.deleteOverlay} onPress={handleCancelDelete}>
          <Animated.View 
            style={[
              styles.deleteModal,
              { 
                backgroundColor,
                transform: [{ scale: deleteAnim }],
                opacity: deleteAnim,
              }
            ]}
          >
            <View style={styles.deleteIconContainer}>
              <Ionicons name="warning" size={48} color="#ef4444" />
            </View>
            <Text style={[styles.deleteModalTitle, { color: textColor }]}>
              Delete Expense?
            </Text>
            <Text style={[styles.deleteModalMessage, { color: '#6b7280' }]}>
              This action cannot be undone. The expense &quot;{title}&quot; will be permanently removed.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={handleCancelDelete}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor, maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Select Date</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowDatePicker(false);
                  setShowCalendar(false);
                }}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            {/* Quick Date Buttons */}
            <View style={styles.quickDatesContainer}>
              {QUICK_DATES.map((item) => {
                const dateValue = getDateString(item.days);
                const isSelected = date === dateValue;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.quickDateButton,
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
                    <Text style={[
                      styles.quickDateText, 
                      { color: isSelected ? tintColor : textColor }
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pick from Calendar Button */}
            <View style={styles.calendarContainer}>
              <TouchableOpacity
                style={[
                  styles.pickCalendarButton,
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
                <Text style={[
                  styles.pickCalendarText,
                  { color: showCalendar ? tintColor : textColor }
                ]}>
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
                <View style={styles.datePickerWrapper}>
                  {/* Selected Date Header */}
                  <View style={styles.selectedDateHeader}>
                    <Ionicons name="calendar" size={18} color={tintColor} />
                    <Text style={[styles.selectedDateText, { color: textColor }]}>
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
                    style={styles.datePicker}
                  />
                  
                  {Platform.OS === 'ios' && (
                    <Text style={styles.calendarHint}>
                      Scroll to select date
                    </Text>
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.dateConfirmButton, { backgroundColor: tintColor }]}
              onPress={() => {
                setShowDatePicker(false);
                setShowCalendar(false);
              }}
            >
              <Text style={styles.dateConfirmButtonText}>Done</Text>
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Select Currency</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
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
                  style={[
                    styles.modalOptionItem,
                    currency === curr.code && { backgroundColor: tintColor + '15' },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCurrency(curr.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <View style={styles.modalOptionLeft}>
                    <View style={[styles.currencySymbolBadge, { backgroundColor: tintColor + '20' }]}>
                      <Text style={[styles.currencySymbol, { color: tintColor }]}>{curr.symbol}</Text>
                    </View>
                    <View>
                      <Text style={[styles.currencyCode, { color: textColor }]}>{curr.code}</Text>
                      <Text style={[styles.currencyName, { color: '#6b7280' }]}>{curr.name}</Text>
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

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Select Category</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryPicker(false)}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: '', name: 'No Category', icon: '📦', color: '#6b7280', userId: '', createdAt: '', updatedAt: '' } as Category, ...categories]}
              keyExtractor={(item) => item.id || 'none'}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={styles.categoryGrid}
              renderItem={({ item: cat }) => {
                const isSelected = cat.id === '' ? !categoryId : categoryId === cat.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryGridItem,
                      { backgroundColor: cardBg },
                      isSelected && { borderColor: tintColor, borderWidth: 2 },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategoryId(cat.id === '' ? undefined : cat.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={styles.categoryGridIcon}>{cat.icon || '📦'}</Text>
                    <Text 
                      style={[styles.categoryGridName, { color: textColor }]} 
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                    {isSelected && (
                      <View style={[styles.categoryCheckmark, { backgroundColor: tintColor }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyCategories}>
                  <Ionicons name="folder-open-outline" size={48} color="#9ca3af" />
                  <Text style={[styles.emptyCategoriesText, { color: '#6b7280' }]}>
                    No categories yet
                  </Text>
                  <TouchableOpacity
                    style={[styles.createCategoryButton, { backgroundColor: tintColor }]}
                    onPress={() => {
                      setShowCategoryPicker(false);
                      router.push('/category/new');
                    }}
                  >
                    <Text style={styles.createCategoryButtonText}>Create Category</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  pickerText: {
    fontSize: 16,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  optionsList: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    maxHeight: 200,
  },
  optionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  optionText: {
    fontSize: 14,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34,
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
    fontSize: 18,
    fontWeight: '600',
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbol: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyName: {
    fontSize: 13,
  },
  categoryModalIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  categoryModalName: {
    fontSize: 16,
  },
  emptyCategories: {
    padding: 32,
    alignItems: 'center',
  },
  emptyCategoriesText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Amount Card styles
  amountCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  amountSymbol: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: 4,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  categoryBadgeIcon: {
    fontSize: 18,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Form Section styles
  formSection: {
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.6,
  },
  inputField: {
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  amountInput: {
    fontSize: 18,
    fontWeight: '600',
  },
  noteInput: {
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    marginLeft: 68,
    backgroundColor: '#e5e7eb',
  },
  currencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCategoryIcon: {
    fontSize: 20,
  },
  // Action Section styles
  actionSection: {
    marginTop: 8,
    gap: 12,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  clearFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  clearFormButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 14,
    gap: 8,
  },
  deleteButtonOutlineText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  // Delete Modal styles
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModal: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  deleteIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#ef4444',
  },
  confirmDeleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Close Button
  modalCloseButton: {
    padding: 8,
  },
  // Currency Symbol Badge
  currencySymbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Category Grid styles
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  categoryGridItem: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryGridIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryGridName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  createCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  createCategoryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Date Picker styles
  quickDatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 10,
  },
  quickDateButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pickCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  pickCalendarText: {
    fontSize: 15,
    fontWeight: '500',
  },
  datePickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    width: '100%',
    justifyContent: 'center',
  },
  selectedDateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  calendarHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
  datePicker: {
    width: '100%',
    height: 150,
  },
  dateConfirmButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
