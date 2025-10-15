import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Language } from '@/constants/languages';

export type AuthMethod = 'google' | 'apple' | 'manual';
export type ServiceMode = 'mock' | 'real';

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

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
  };
});
