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

  const isAdminUser = user?.role === 'admin';

  const isTabVisible = (tabId: string) => {
    const tab = config.navigationConfig.tabs.find((t) => t.id === tabId);
    if (!tab) return false;
    if (isAdminUser && tabId === 'settings') return true;
    return tab.enabled;
  };

  const getTabConfig = (tabId: string) => {
    const tab = config.navigationConfig.tabs.find((t) => t.id === tabId);
    return tab;
  };

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
          href: isTabVisible('home') ? '/home' : null,
          title: getTabConfig('home')?.name || 'Home',
          tabBarIcon: ({ color }) => getIconForTab('home', color),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          href: isTabVisible('feed') ? '/feed' : null,
          title: getTabConfig('feed')?.name || 'Feed',
          tabBarIcon: ({ color }) => getIconForTab('rss', color),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: isTabVisible('settings') ? '/settings' : null,
          title: getTabConfig('settings')?.name || 'Settings',
          tabBarIcon: ({ color }) => getIconForTab('settings', color),
        }}
      />
    </Tabs>
  );
}
