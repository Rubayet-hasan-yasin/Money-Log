import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { Category } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    LayoutAnimation,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories(1, 100);
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchCategories();
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This won't delete expenses in this category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCategory(category.id);
              setCategories(prev => prev.filter(c => c.id !== category.id));
            } catch {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { borderColor: '#e5e7eb' }]}
      onPress={() => router.push(`/category/${item.id}` as any)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.categoryLeft}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: item.color || '#6b7280' },
          ]}
        >
          <Text style={styles.categoryEmoji}>{item.icon || '📦'}</Text>
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: textColor }]}>
            {item.name}
          </Text>
          <View style={styles.categoryMeta}>
            {item._count?.expenses !== undefined && (
              <Text style={[styles.categoryExpenseCount, { color: activeTab === 'EXPENSE' ? '#ef4444' : '#22c55e' }]}>
                {item._count.expenses} transaction{item._count.expenses !== 1 ? 's' : ''}
              </Text>
            )}
            <Text style={[styles.categoryDate, { color: textColor, opacity: 0.5 }]}>
              {item._count?.expenses !== undefined ? ' • ' : ''}Created {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  const filteredCategories = categories.filter(c => (c.type || 'EXPENSE') === activeTab);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Category Type Tabs */}
      <View style={[styles.segmentContainer, { backgroundColor: cardBg }]}>
        {(['EXPENSE', 'INCOME'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.segmentButton,
              activeTab === t && {
                backgroundColor: t === 'EXPENSE' ? '#ef4444' : '#22c55e',
              },
            ]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab(t);
            }}
          >
            <Text
              style={[
                styles.segmentButtonText,
                { color: textColor },
                activeTab === t && { color: '#fff', fontWeight: '700' },
              ]}
            >
              {t === 'EXPENSE' ? 'Expense Categories' : 'Income Categories'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#9ca3af" />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No {activeTab.toLowerCase()} categories yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: textColor, opacity: 0.6 }]}>
              Create categories to organize your transactions
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: activeTab === 'EXPENSE' ? '#ef4444' : '#22c55e' }]}
        onPress={() => router.push({ pathname: '/category/new', params: { type: activeTab } } as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    margin: 16,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryExpenseCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryDate: {
    fontSize: 13,
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
});
