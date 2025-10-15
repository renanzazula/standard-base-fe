import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Theme, themes, ThemeColors } from '@/constants/themes';
import { Language, DEFAULT_LANGUAGE } from '@/constants/languages';

const THEME_STORAGE_KEY = '@user_theme';
const LANGUAGE_STORAGE_KEY = '@user_language';

export const [PreferencesProvider, usePreferences] = createContextHook(() => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [storedTheme, storedLanguage] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
      ]);

      if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light')) {
        setThemeState(storedTheme);
      }

      if (storedLanguage) {
        setLanguageState(storedLanguage as Language);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const setLanguage = async (newLanguage: Language) => {
    try {
      console.log('[Preferences] Setting language:', newLanguage);
      console.log('[Preferences] Previous language:', language);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguageState(newLanguage);
      console.log('[Preferences] Language updated successfully to:', newLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const colors: ThemeColors = themes[theme];

  return {
    theme,
    colors,
    setTheme,
    toggleTheme,
    language,
    setLanguage,
    isLoading,
  };
});
