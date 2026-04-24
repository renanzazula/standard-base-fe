import { usePreferences } from '@core/contexts/PreferencesContext';
import { useAdminConfig } from '@core/contexts/AdminConfigContext';
import { useAuth } from '@core/contexts/AuthContext';
import { Tabs } from 'expo-router';
import { Home, Settings, Rss, Droplets, Mic } from 'lucide-react-native';
import React from 'react';

const SYSTEM_TABS = [
  { id: 'home', icon: 'home', defaultName: 'Home' },
  { id: 'feed', icon: 'rss', defaultName: 'Feed' },
  { id: 'skate-square', icon: 'droplet', defaultName: 'Skate Square' },
  { id: 'podcast', icon: 'mic', defaultName: 'Podcast' },
  { id: 'settings', icon: 'settings', defaultName: 'Settings' },
] as const;

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

  const userPermissions = new Set(user?.permissions ?? []);
  const hasCatalog = config.navigationConfig.tabs.length > 0;

  const visibleTabIds = new Set(
    hasCatalog
      ? config.navigationConfig.tabs
          .filter((tab) => tab.enabled && (!tab.permissionKey || userPermissions.has(tab.permissionKey)))
          .map((tab) => tab.id)
      : (user?.navigationTabs ?? []).map((tab) => tab.id)
  );

  const getTabConfig = (tabId: string) =>
    config.navigationConfig.tabs.find((t) => t.id === tabId);

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
      {SYSTEM_TABS.map((staticTab) => {
        const catalogTab = getTabConfig(staticTab.id);
        const isVisible = visibleTabIds.has(staticTab.id);
        return (
          <Tabs.Screen
            key={staticTab.id}
            name={staticTab.id}
            options={{
              href: isVisible ? (`/${staticTab.id}` as any) : null,
              title: catalogTab?.name ?? staticTab.defaultName,
              tabBarIcon: ({ color }) => getIconForTab(catalogTab?.icon ?? staticTab.icon, color),
            }}
          />
        );
      })}
    </Tabs>
  );
}
