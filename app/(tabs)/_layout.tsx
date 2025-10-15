import { usePreferences } from '@/contexts/PreferencesContext';
import { Tabs } from 'expo-router';
import { Home, Settings } from 'lucide-react-native';
import React from 'react';

export default function TabLayout() {
  const { colors } = usePreferences();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
