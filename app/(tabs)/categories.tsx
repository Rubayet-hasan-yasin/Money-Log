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
      className="flex-row justify-between items-center p-4 border rounded-xl mb-3"
      style={{ borderColor: '#e5e7eb' }}
      onPress={() => router.push(`/category/${item.id}` as any)}
      onLongPress={() => handleDelete(item)}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-12 h-12 rounded-xl justify-center items-center mr-3"
          style={{ backgroundColor: item.color || '#6b7280' }}
        >
          <Text className="text-[22px]">{item.icon || '📦'}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold mb-1" style={{ color: textColor }}>
            {item.name}
          </Text>
          <View className="flex-row items-center">
            {item._count?.expenses !== undefined && (
              <Text className="text-[13px] font-medium" style={{ color: activeTab === 'EXPENSE' ? '#ef4444' : '#22c55e' }}>
                {item._count.expenses} transaction{item._count.expenses !== 1 ? 's' : ''}
              </Text>
            )}
            <Text className="text-[13px]" style={{ color: textColor, opacity: 0.5 }}>
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
      <View className="flex-1 justify-center items-center" style={{ backgroundColor }}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      {/* Category Type Tabs */}
      <View className="flex-row rounded-xl p-1 m-4 mb-2" style={{ backgroundColor: cardBg }}>
        {(['EXPENSE', 'INCOME'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            className={`flex-1 py-3 items-center rounded-lg ${activeTab === t ? (t === 'EXPENSE' ? 'bg-red-500' : 'bg-green-500') : ''}`}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab(t);
            }}
          >
            <Text
              className={`text-sm font-semibold ${activeTab === t ? 'text-white' : ''}`}
              style={activeTab !== t ? { color: textColor } : {}}
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
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center pt-[60px] px-10">
            <Ionicons name="folder-open-outline" size={64} color="#9ca3af" />
            <Text className="text-xl font-semibold mt-4" style={{ color: textColor }}>
              No {activeTab.toLowerCase()} categories yet
            </Text>
            <Text className="text-sm text-center mt-2" style={{ color: textColor, opacity: 0.6 }}>
              Create categories to organize your transactions
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full justify-center items-center shadow-md elevation-5"
        style={{ backgroundColor: activeTab === 'EXPENSE' ? '#ef4444' : '#22c55e' }}
        onPress={() => router.push({ pathname: '/category/new', params: { type: activeTab } } as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
