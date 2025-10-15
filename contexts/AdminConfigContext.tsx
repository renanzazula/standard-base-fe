import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Language } from '@/constants/languages';

export type AuthMethod = 'google' | 'apple' | 'manual';
export type ServiceMode = 'mock' | 'real';

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
  serviceModes: {
    google: ServiceMode;
    apple: ServiceMode;
    manual: ServiceMode;
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
    google: true,
    apple: true,
    manual: true,
  },
  serviceModes: {
    google: 'mock',
    apple: 'mock',
    manual: 'mock',
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
      { id: 'settings', name: 'Settings', enabled: true, icon: 'settings', order: 3, isSystem: true },
    ],
  },
};

const STORAGE_KEY = '@admin_config';

export const [AdminConfigProvider, useAdminConfig] = createContextHook(() => {
  const [config, setConfig] = useState<AdminConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        const mergedConfig = {
          ...DEFAULT_CONFIG,
          ...parsedConfig,
          languageConfig: {
            ...DEFAULT_CONFIG.languageConfig,
            ...(parsedConfig.languageConfig || {}),
            availableLanguages: parsedConfig.languageConfig?.availableLanguages || DEFAULT_CONFIG.languageConfig.availableLanguages,
            defaultLanguage: parsedConfig.languageConfig?.defaultLanguage || DEFAULT_CONFIG.languageConfig.defaultLanguage,
          },
          navigationConfig: {
            ...DEFAULT_CONFIG.navigationConfig,
            ...(parsedConfig.navigationConfig || {}),
            tabs: parsedConfig.navigationConfig?.tabs || DEFAULT_CONFIG.navigationConfig.tabs,
          },
        };
        setConfig(mergedConfig);
      }
    } catch (error) {
      console.error('Failed to load admin config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: AdminConfig) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save admin config:', error);
    }
  };

  const toggleAuthMethod = (method: AuthMethod) => {
    const newConfig = {
      ...config,
      enabledAuthMethods: {
        ...config.enabledAuthMethods,
        [method]: !config.enabledAuthMethods[method],
      },
    };
    saveConfig(newConfig);
  };

  const setServiceMode = (method: AuthMethod, mode: ServiceMode) => {
    const newConfig = {
      ...config,
      serviceModes: {
        ...config.serviceModes,
        [method]: mode,
      },
    };
    saveConfig(newConfig);
  };

  const updateSessionConfig = (sessionConfig: Partial<AdminConfig['sessionConfig']>) => {
    const newConfig = {
      ...config,
      sessionConfig: {
        ...config.sessionConfig,
        ...sessionConfig,
      },
    };
    saveConfig(newConfig);
  };

  const toggleLanguageAvailability = (language: Language) => {
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

    const newConfig = {
      ...config,
      languageConfig: {
        ...config.languageConfig,
        availableLanguages: newLanguages,
      },
    };
    saveConfig(newConfig);
  };

  const setDefaultLanguage = (language: Language) => {
    if (!config.languageConfig.availableLanguages.includes(language)) {
      console.warn('Cannot set unavailable language as default');
      return;
    }
    const newConfig = {
      ...config,
      languageConfig: {
        ...config.languageConfig,
        defaultLanguage: language,
      },
    };
    saveConfig(newConfig);
  };

  const updateRegionalConfig = (regionalConfig: Partial<AdminConfig['regionalConfig']>) => {
    const newConfig = {
      ...config,
      regionalConfig: {
        ...config.regionalConfig,
        ...regionalConfig,
      },
    };
    saveConfig(newConfig);
  };

  const updateProfileConfig = (profileConfig: Partial<AdminConfig['profileConfig']>) => {
    const newConfig = {
      ...config,
      profileConfig: {
        ...config.profileConfig,
        ...profileConfig,
      },
    };
    saveConfig(newConfig);
  };

  const toggleTabEnabled = (tabId: string) => {
    const newTabs = config.navigationConfig.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, enabled: !tab.enabled } : tab
    );
    const newConfig = {
      ...config,
      navigationConfig: {
        ...config.navigationConfig,
        tabs: newTabs,
      },
    };
    saveConfig(newConfig);
  };

  const updateTabName = (tabId: string, name: string) => {
    const newTabs = config.navigationConfig.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, name } : tab
    );
    const newConfig = {
      ...config,
      navigationConfig: {
        ...config.navigationConfig,
        tabs: newTabs,
      },
    };
    saveConfig(newConfig);
  };

  const addCustomTab = (tab: Omit<NavigationTab, 'isSystem' | 'order'>) => {
    const maxOrder = Math.max(...config.navigationConfig.tabs.map((t) => t.order));
    const newTab: NavigationTab = {
      ...tab,
      isSystem: false,
      order: maxOrder + 1,
    };
    const newConfig = {
      ...config,
      navigationConfig: {
        ...config.navigationConfig,
        tabs: [...config.navigationConfig.tabs, newTab],
      },
    };
    saveConfig(newConfig);
  };

  const removeCustomTab = (tabId: string) => {
    const newTabs = config.navigationConfig.tabs.filter((tab) => tab.id !== tabId);
    const newConfig = {
      ...config,
      navigationConfig: {
        ...config.navigationConfig,
        tabs: newTabs,
      },
    };
    saveConfig(newConfig);
  };

  const updateTabOrder = (tabId: string, newOrder: number) => {
    const currentTab = config.navigationConfig.tabs.find((tab) => tab.id === tabId);
    if (!currentTab) return;

    const oldOrder = currentTab.order;
    const newTabs = config.navigationConfig.tabs.map((tab) => {
      if (tab.id === tabId) {
        return { ...tab, order: newOrder };
      }
      if (oldOrder < newOrder) {
        if (tab.order > oldOrder && tab.order <= newOrder) {
          return { ...tab, order: tab.order - 1 };
        }
      } else {
        if (tab.order >= newOrder && tab.order < oldOrder) {
          return { ...tab, order: tab.order + 1 };
        }
      }
      return tab;
    });

    const newConfig = {
      ...config,
      navigationConfig: {
        ...config.navigationConfig,
        tabs: newTabs,
      },
    };
    saveConfig(newConfig);
  };

  return {
    config,
    isLoading,
    toggleAuthMethod,
    setServiceMode,
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
