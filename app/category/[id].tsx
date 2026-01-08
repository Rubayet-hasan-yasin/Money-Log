import { useThemeColor } from '@/hooks/use-theme-color';
import { api } from '@/services/api';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#3b82f6');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const fetchCategory = useCallback(async () => {
    if (isNew || !id) return;

    try {
      const response = await api.getCategory(id);
      if (response.category) {
        const cat = response.category;
        setName(cat.name);
        setIcon(cat.icon || '📦');
        setColor(cat.color || '#3b82f6');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      Alert.alert('Error', 'Failed to load category');
    } finally {
      setIsLoading(false);
    }
  }, [id, isNew]);

  useFocusEffect(
    useCallback(() => {
      fetchCategory();
    }, [fetchCategory])
  );

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Category name is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const categoryData = {
        name: name.trim(),
        icon,
        color,
      };

      if (isNew) {
        await api.createCategory(categoryData);
      } else if (id) {
        await api.updateCategory(id, categoryData);
      }

      router.back();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save category'
      );
    } finally {
      setIsSaving(false);
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
          onPress: async () => {
            try {
              if (id) {
                await api.deleteCategory(id);
                router.back();
              }
            } catch {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
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
      >
        {/* Preview */}
        <View style={styles.previewContainer}>
          <View style={[styles.previewIcon, { backgroundColor: color }]}>
            <Text style={styles.previewEmoji}>{icon}</Text>
          </View>
          <Text style={[styles.previewName, { color: textColor }]}>
            {name || 'Category Name'}
          </Text>
        </View>

        {/* Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: textColor }]}>Name *</Text>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: '#e5e7eb' }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Food & Dining"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Icon */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: textColor }]}>Icon</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor: '#e5e7eb' }]}
            onPress={() => {
              setShowIconPicker(!showIconPicker);
              setShowColorPicker(false);
            }}
          >
            <View style={styles.iconDisplay}>
              <Text style={styles.iconEmoji}>{icon}</Text>
              <Text style={[styles.pickerText, { color: textColor }]}>
                Select an icon
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Icon Picker */}
        {showIconPicker && (
          <View style={[styles.gridContainer, { borderColor: '#e5e7eb' }]}>
            <View style={styles.iconGrid}>
              {CATEGORY_ICONS.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconOption,
                    icon === emoji && { backgroundColor: tintColor + '30' },
                  ]}
                  onPress={() => {
                    setIcon(emoji);
                    setShowIconPicker(false);
                  }}
                >
                  <Text style={styles.iconOptionText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Color */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: textColor }]}>Color</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor: '#e5e7eb' }]}
            onPress={() => {
              setShowColorPicker(!showColorPicker);
              setShowIconPicker(false);
            }}
          >
            <View style={styles.colorDisplay}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <Text style={[styles.pickerText, { color: textColor }]}>
                {color}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Color Picker */}
        {showColorPicker && (
          <View style={[styles.gridContainer, { borderColor: '#e5e7eb' }]}>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((clr, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    { backgroundColor: clr },
                    color === clr && styles.colorOptionSelected,
                  ]}
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
          style={[styles.saveButton, { backgroundColor: tintColor }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isNew ? 'Create Category' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Delete Button */}
        {!isNew && (
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: '#ef4444' }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Delete Category</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewEmoji: {
    fontSize: 36,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '600',
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
  iconDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconEmoji: {
    fontSize: 24,
  },
  colorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  gridContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
});
