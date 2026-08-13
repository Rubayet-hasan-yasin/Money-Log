import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    LayoutAnimation,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === 'new';

  const queryClient = useQueryClient();

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#3b82f6');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({ light: '#f8fafc', dark: '#1e1e2e' }, 'background');

  const { data: categoryData, isLoading: isQueryLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const response = await api.getCategory(id);
      return response;
    },
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (categoryData?.category) {
      const cat = categoryData.category;
      setName(cat.name);
      setIcon(cat.icon || '📦');
      setColor(cat.color || '#3b82f6');
      setType(cat.type || 'EXPENSE');
    }
  }, [categoryData]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string; color: string; type: 'EXPENSE' | 'INCOME' }) => {
      return api.createCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      router.back();
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create category'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string; color: string; type: 'EXPENSE' | 'INCOME' }) => {
      return api.updateCategory(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      router.back();
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update category'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete category');
    },
  });

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Category name is required');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      icon,
      color,
      type,
    };

    if (isNew) {
      createMutation.mutate(payload);
    } else if (id) {
      updateMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? Expenses in this category will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate();
          },
        },
      ]
    );
  };

  const isLoading = isQueryLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor }}>
        <ActivityIndicator size="large" color={tintColor} />
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
        {/* Preview */}
        <View className="items-center mb-6 pt-2">
          <View className="w-20 h-20 rounded-[20px] justify-center items-center mb-4" style={{ backgroundColor: color }}>
            <Text className="text-4xl">{icon}</Text>
          </View>
          <Text className="text-xl font-semibold mb-2 text-center" style={{ color: textColor }}>
            {name || 'Category Name'}
          </Text>
          <View className="px-3 py-1 rounded-xl" style={{ backgroundColor: type === 'EXPENSE' ? '#ef444420' : '#22c55e20' }}>
            <Text className="text-xs font-bold" style={{ color: type === 'EXPENSE' ? '#ef4444' : '#22c55e' }}>
              {type}
            </Text>
          </View>
        </View>

        {/* Category Type Switcher */}
        <View className="mb-5">
          <Text className="text-sm font-semibold mb-2" style={{ color: textColor }}>Category Type *</Text>
          <View className="flex-row rounded-xl p-1" style={{ backgroundColor: cardBg }}>
            {(['EXPENSE', 'INCOME'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                className={`flex-1 py-3 items-center rounded-lg ${type === t ? (t === 'EXPENSE' ? 'bg-red-500' : 'bg-green-500') : ''}`}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setType(t);
                }}
              >
                <Text
                  className={`text-sm font-semibold ${type === t ? 'text-white' : ''}`}
                  style={type !== t ? { color: textColor } : {}}
                >
                  {t === 'EXPENSE' ? 'Expense' : 'Income'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Name */}
        <View className="mb-5">
          <Text className="text-sm font-semibold mb-2" style={{ color: textColor }}>Name *</Text>
          <TextInput
            className="border rounded-xl p-3.5 text-base"
            style={{ color: textColor, borderColor: '#e5e7eb' }}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Salary, Food, Utilities"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Icon */}
        <View className="mb-5">
          <Text className="text-sm font-semibold mb-2" style={{ color: textColor }}>Icon</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between border rounded-xl p-3.5"
            style={{ borderColor: '#e5e7eb' }}
            onPress={() => {
              setShowIconPicker(!showIconPicker);
              setShowColorPicker(false);
            }}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">{icon}</Text>
              <Text className="text-base" style={{ color: textColor }}>
                Select an icon
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Icon Picker */}
        {showIconPicker && (
          <View className="border rounded-xl p-3 mb-5" style={{ borderColor: '#e5e7eb', backgroundColor: cardBg }}>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_ICONS.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-12 h-12 rounded-xl justify-center items-center"
                  style={icon === emoji ? { backgroundColor: tintColor + '30' } : {}}
                  onPress={() => {
                    setIcon(emoji);
                    setShowIconPicker(false);
                  }}
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Color */}
        <View className="mb-5">
          <Text className="text-sm font-semibold mb-2" style={{ color: textColor }}>Color</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between border rounded-xl p-3.5"
            style={{ borderColor: '#e5e7eb' }}
            onPress={() => {
              setShowColorPicker(!showColorPicker);
              setShowIconPicker(false);
            }}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
              <Text className="text-base" style={{ color: textColor }}>
                {color}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Color Picker */}
        {showColorPicker && (
          <View className="border rounded-xl p-3 mb-5" style={{ borderColor: '#e5e7eb', backgroundColor: cardBg }}>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_COLORS.map((clr, index) => (
                <TouchableOpacity
                  key={index}
                  className={`w-11 h-11 rounded-[22px] justify-center items-center ${color === clr ? 'border-[3px] border-white shadow-md elevation-3' : ''}`}
                  style={[{ backgroundColor: clr }]}
                  onPress={() => {
                    setColor(clr);
                    setShowColorPicker(false);
                  }}
                >
                  {color === clr && (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          className="p-4 rounded-xl items-center mt-2"
          style={{ backgroundColor: type === 'EXPENSE' ? '#ef4444' : '#22c55e' }}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {isNew ? 'Create Category' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Delete Button */}
        {!isNew && (
          <TouchableOpacity
            className="flex-row items-center justify-center p-4 border rounded-xl mt-4 gap-2"
            style={{ borderColor: '#ef4444' }}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 text-base font-semibold">Delete Category</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
