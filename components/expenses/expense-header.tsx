import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ExpenseHeaderProps {
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  tintColor: string;
  textColor: string;
  onCloseSelection: () => void;
  onToggleSelectAll: () => void;
  onExport: () => void;
  onBulkDelete: () => void;
  onShowFilters: () => void;
}

export function ExpenseHeader({
  isSelectionMode,
  selectedCount,
  totalCount,
  tintColor,
  textColor,
  onCloseSelection,
  onToggleSelectAll,
  onExport,
  onBulkDelete,
  onShowFilters,
}: ExpenseHeaderProps) {
  if (isSelectionMode) {
    return (
      <View
        className="flex-row items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: tintColor }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={onCloseSelection}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-white">
            {selectedCount} selected
          </Text>
        </View>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={onToggleSelectAll} className="p-1">
            <Ionicons
              name={selectedCount === totalCount ? 'checkbox' : 'square-outline'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onExport} className="p-1">
            <Ionicons name="download-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onBulkDelete} className="p-1">
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row justify-end px-4 pt-3 gap-3 shrink-0">
      <TouchableOpacity
        className="flex-row items-center px-3 py-2 rounded-lg border gap-1.5"
        style={{ borderColor: '#e5e7eb' }}
        onPress={onShowFilters}
      >
        <Ionicons name="filter" size={18} color={textColor} />
        <Text className="text-sm font-medium" style={{ color: textColor }}>
          Filters
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-row items-center px-3 py-2 rounded-lg border gap-1.5"
        style={{ borderColor: '#e5e7eb' }}
        onPress={onExport}
      >
        <Ionicons name="download-outline" size={18} color={textColor} />
        <Text className="text-sm font-medium" style={{ color: textColor }}>
          Export
        </Text>
      </TouchableOpacity>
    </View>
  );
}
