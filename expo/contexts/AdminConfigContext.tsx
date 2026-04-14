import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { Language } from '@/constants/languages';
import * as adminConfigApi from '@/services/adminConfig';
import type { AppConfigResponse } from '@/services/adminConfig';

export type AuthMethod = 'google' | 'apple' | 'manual';

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export interface NavigationTab {
  id: string;
  name: string;
  enabled: boolean;
  icon: string;
  order: number;
  isSystem: boolean;
}

export interface AdminConfig {
  enabledAuthMethods: {
    google: boolean;
    apple: boolean;
    manual: boolean;
  };
  sessionConfig: {
    maxTime: number;
    idleTime: number;
    autoRefresh: boolean;
  };
  languageConfig: {
    availableLanguages: Language[];
    defaultLanguage: Language;
  };
  regionalConfig: {
    defaultTimezone: string;
    defaultDateFormat: DateFormat;
  };
  profileConfig: {
    usernameMinLength: number;
    usernameMaxLength: number;
    avatarMaxSizeMB: number;
    allowedAvatarFormats: string[];
  };
  navigationConfig: {
    tabs: NavigationTab[];
  };
}

const DEFAULT_CONFIG: AdminConfig = {
  enabledAuthMethods: {
    google: false,
    apple: false,
    manual: true,
  },
  sessionConfig: {
    maxTime: 30 * 60 * 1000,
    idleTime: 15 * 60 * 1000,
    autoRefresh: true,
  },
  languageConfig: {
    availableLanguages: ['en'],
    defaultLanguage: 'en' as Language,
  },
  regionalConfig: {
    defaultTimezone: 'UTC',
    defaultDateFormat: 'MM/DD/YYYY',
  },
  profileConfig: {
    usernameMinLength: 3,
    usernameMaxLength: 30,
    avatarMaxSizeMB: 5,
    allowedAvatarFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
  },
  navigationConfig: {
    tabs: [
      { id: 'home', name: 'Home', enabled: false, icon: 'home', order: 1, isSystem: true },
      { id: 'feed', name: 'Feed', enabled: false, icon: 'rss', order: 2, isSystem: true },
      { id: 'skate-square', name: 'Skate Square', enabled: false, icon: 'droplet', order: 3, isSystem: true },
      { id: 'podcast', name: 'Podcast', enabled: false, icon: 'mic', order: 4, isSystem: true },
      { id: 'settings', name: 'Settings', enabled: true, icon: 'settings', order: 5, isSystem: true },
    ],
  },
};

function mapConfigResponse(response: AppConfigResponse): AdminConfig {
  return {
    enabledAuthMethods: {
      google: response.googleAuthEnabled,
      apple: response.appleAuthEnabled,
      manual: response.emailAuthEnabled,
    },
    sessionConfig: {
      maxTime: response.sessionDurationSeconds * 1000,
      idleTime: response.refreshTokenDurationSeconds * 1000,
      autoRefresh: true,
    },
    languageConfig: {
      availableLanguages: response.availableLanguages as Language[],
      defaultLanguage: response.defaultLanguage as Language,
    },
    regionalConfig: {
      defaultTimezone: response.defaultTimezone,
      defaultDateFormat: response.defaultDateFormat as DateFormat,
    },
    profileConfig: {
      usernameMinLength: response.usernameMinLength,
      usernameMaxLength: response.usernameMaxLength,
      avatarMaxSizeMB: response.avatarUploadEnabled ? 5 : 0,
      allowedAvatarFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
    },
    navigationConfig: {
      tabs: response.navigationTabs.map((t) => ({
        id: t.tabId,
        name: t.label,
        enabled: t.enabled,
        icon: t.iconName,
        order: t.sortOrder,
        isSystem: t.isSystem,
      })),
    },
  };
}

export const [AdminConfigProvider, useAdminConfig] = createContextHook(() => {
  const [config, setConfig] = useState<AdminConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await adminConfigApi.getAppConfig();
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to load config from backend, using defaults:', error);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMethod = async (method: AuthMethod) => {
    try {
      const response = await adminConfigApi.updateAuthMethods({
        emailAuthEnabled: method === 'manual' ? !config.enabledAuthMethods.manual : config.enabledAuthMethods.manual,
        googleAuthEnabled: method === 'google' ? !config.enabledAuthMethods.google : config.enabledAuthMethods.google,
        appleAuthEnabled: method === 'apple' ? !config.enabledAuthMethods.apple : config.enabledAuthMethods.apple,
      });
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to toggle auth method:', error);
    }
  };

  const updateSessionConfig = async (sessionConfig: Partial<AdminConfig['sessionConfig']>) => {
    try {
      const merged = { ...config.sessionConfig, ...sessionConfig };
      const response = await adminConfigApi.updateSessionPolicy({
        sessionDurationSeconds: Math.round(merged.maxTime / 1000),
        refreshTokenDurationSeconds: Math.round(merged.idleTime / 1000),
      });
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to update session config:', error);
    }
  };

  const toggleLanguageAvailability = async (language: Language) => {
    const currentLanguages = config.languageConfig.availableLanguages;
    const isAvailable = currentLanguages.includes(language);

    let newLanguages: Language[];
    if (isAvailable) {
      if (currentLanguages.length === 1) {
        console.warn('Cannot remove the last available language');
        return;
      }
      if (language === config.languageConfig.defaultLanguage) {
        console.warn('Cannot remove the default language');
        return;
      }
      newLanguages = currentLanguages.filter((lang) => lang !== language);
    } else {
      newLanguages = [...currentLanguages, language];
    }

    try {
      const response = await adminConfigApi.updateLanguagePolicy({ availableLanguages: newLanguages });
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to toggle language availability:', error);
    }
  };

  const setDefaultLanguage = async (language: Language) => {
    if (!config.languageConfig.availableLanguages.includes(language)) {
      console.warn('Cannot set unavailable language as default');
      return;
    }
    try {
      const response = await adminConfigApi.updateLanguagePolicy({ defaultLanguage: language });
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to set default language:', error);
    }
  };

  const updateRegionalConfig = async (regionalConfig: Partial<AdminConfig['regionalConfig']>) => {
    try {
      const response = await adminConfigApi.updateRegionalPolicy(regionalConfig);
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to update regional config:', error);
    }
  };

  const updateProfileConfig = async (profileConfig: Partial<AdminConfig['profileConfig']>) => {
    try {
      const response = await adminConfigApi.updateProfilePolicy({
        usernameMinLength: profileConfig.usernameMinLength,
        usernameMaxLength: profileConfig.usernameMaxLength,
        avatarUploadEnabled:
          profileConfig.avatarMaxSizeMB !== undefined ? profileConfig.avatarMaxSizeMB > 0 : undefined,
      });
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to update profile config:', error);
    }
  };

  const toggleTabEnabled = async (tabId: string) => {
    const tab = config.navigationConfig.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    try {
      const response = await adminConfigApi.updateNavigationTabs({
        tabs: [{ tabId, enabled: !tab.enabled }],
      });
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to toggle tab enabled:', error);
    }
  };

  const updateTabName = async (tabId: string, name: string) => {
    try {
      const response = await adminConfigApi.updateNavigationTabs({
        tabs: [{ tabId, label: name }],
      });
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to update tab name:', error);
    }
  };

  const addCustomTab = async (tab: Omit<NavigationTab, 'isSystem' | 'order'>) => {
    try {
      const response = await adminConfigApi.addNavigationTab({
        key: tab.id,
        label: tab.name,
        iconName: tab.icon,
      });
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to add custom tab:', error);
    }
  };

  const removeCustomTab = async (tabId: string) => {
    try {
      const response = await adminConfigApi.removeNavigationTab(tabId);
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to remove custom tab:', error);
    }
  };

  const updateTabOrder = async (tabId: string, newOrder: number) => {
    const currentTab = config.navigationConfig.tabs.find((tab) => tab.id === tabId);
    if (!currentTab) return;

    const oldOrder = currentTab.order;
    const reorderedTabs = config.navigationConfig.tabs.map((tab) => {
      if (tab.id === tabId) return { ...tab, order: newOrder };
      if (oldOrder < newOrder) {
        if (tab.order > oldOrder && tab.order <= newOrder) return { ...tab, order: tab.order - 1 };
      } else {
        if (tab.order >= newOrder && tab.order < oldOrder) return { ...tab, order: tab.order + 1 };
      }
      return tab;
    });

    try {
      const response = await adminConfigApi.updateNavigationTabs({
        tabs: reorderedTabs.map((t) => ({ tabId: t.id, sortOrder: t.order })),
      });
      setConfig(mapConfigResponse(response));
    } catch (error) {
      console.error('[AdminConfig] Failed to update tab order:', error);
    }
  };

  return {
    config,
    isLoading,
    toggleAuthMethod,
    updateSessionConfig,
    toggleLanguageAvailability,
    setDefaultLanguage,
    updateRegionalConfig,
    updateProfileConfig,
    toggleTabEnabled,
    updateTabName,
    addCustomTab,
    removeCustomTab,
    updateTabOrder,
  };
});
