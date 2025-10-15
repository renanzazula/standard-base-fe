import { usePreferences } from '@/contexts/PreferencesContext';
import { useAdminConfig } from '@/contexts/AdminConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs } from 'expo-router';
import { Home, Settings, Rss } from 'lucide-react-native';
import React from 'react';

export default function TabLayout() {
  const { colors } = usePreferences();
  const { config } = useAdminConfig();
  const { user } = useAuth();

  const getIconForTab = (iconName: string, color: string) => {
    switch (iconName) {
      case 'home':
        return <Home size={24} color={color} />;
      case 'rss':
        return <Rss size={24} color={color} />;
      case 'settings':
        return <Settings size={24} color={color} />;
      default:
        return <Home size={24} color={color} />;
    }
  };

  const visibleTabs = config.navigationConfig.tabs
    .filter((tab) => {
      if (!tab.enabled) return false;
      if (tab.id === 'settings' && user?.role !== 'admin') return false;
      return true;
    })
    .sort((a, b) => a.order - b.order);

  const isAdminUser = user?.role === 'admin';

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
      {visibleTabs.map((tab) => (
        <Tabs.Screen
          key={tab.id}
          name={tab.id}
          options={{
            title: tab.name,
            tabBarIcon: ({ color }) => getIconForTab(tab.icon, color),
            href: tab.enabled || (tab.id === 'settings' && isAdminUser) ? undefined : null,
          }}
        />
      ))}
      {isAdminUser && !visibleTabs.find((tab) => tab.id === 'settings') && (
        <Tabs.Screen
          name="settings"
          options={{
            title: config.navigationConfig.tabs.find((t) => t.id === 'settings')?.name || 'Settings',
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
      )}
    </Tabs>
  );
}
