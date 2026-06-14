import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface DashboardHeaderProps {
  userName?: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.header}>
      <Text style={[styles.greeting, { color: textColor, opacity: 0.7 }]}>
        Welcome back,
      </Text>
      <Text style={[styles.userName, { color: textColor }]}>
        {userName || 'User'} 👋
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
