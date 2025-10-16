import { usePreferences } from '@/contexts/PreferencesContext';
import { useAdminConfig } from '@/contexts/AdminConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs } from 'expo-router';
import { Home, Settings, Rss, Droplets, Mic } from 'lucide-react-native';
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
      case 'droplet':
        return <Droplets size={24} color={color} />;
      case 'mic':
        return <Mic size={24} color={color} />;
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

  const sortedTabs = [...config.navigationConfig.tabs].sort((a, b) => a.order - b.order);

  console.log('[TabLayout] Rendering tabs in order:', sortedTabs.map(t => `${t.id}(${t.order})`).join(', '));

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
      {sortedTabs.map((tab) => {
        const isVisible = isTabVisible(tab.id);
        console.log(`[TabLayout] Tab ${tab.id}: visible=${isVisible}, order=${tab.order}`);
        return (
          <Tabs.Screen
            key={tab.id}
            name={tab.id}
            options={{
              href: isVisible ? (`/${tab.id}` as any) : null,
              title: tab.name,
              tabBarIcon: ({ color }) => getIconForTab(tab.icon, color),
            }}
          />
        );
      })}
    </Tabs>
  );
}
