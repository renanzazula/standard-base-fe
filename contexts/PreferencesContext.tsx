import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Theme, themes, ThemeColors } from '@/constants/themes';
import { Language, DEFAULT_LANGUAGE } from '@/constants/languages';

const THEME_STORAGE_KEY = '@user_theme';
const getUserLanguageKey = (userId: string | null) => `@user_language_${userId || 'guest'}`;

export const [PreferencesProvider, usePreferences] = createContextHook(() => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async (userId?: string) => {
    try {
      const userIdToLoad = userId || currentUserId;
      const [storedTheme, storedLanguage] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(getUserLanguageKey(userIdToLoad)),
      ]);

      console.log('[Preferences] Loading preferences for user:', userIdToLoad);
      console.log('[Preferences] Stored language:', storedLanguage);

      if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light')) {
        setThemeState(storedTheme);
      }

      if (storedLanguage) {
        console.log('[Preferences] Setting language from storage:', storedLanguage);
        setLanguageState(storedLanguage as Language);
      } else {
        console.log('[Preferences] No stored language, using default:', DEFAULT_LANGUAGE);
        setLanguageState(DEFAULT_LANGUAGE);
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
      console.log('[Preferences] Current user ID:', currentUserId);
      console.log('[Preferences] Previous language:', language);
      await AsyncStorage.setItem(getUserLanguageKey(currentUserId), newLanguage);
      setLanguageState(newLanguage);
      console.log('[Preferences] Language updated successfully to:', newLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const loadUserPreferences = async (userId: string, defaultLanguage?: Language) => {
    console.log('[Preferences] Loading user preferences for:', userId);
    setCurrentUserId(userId);
    const storedLanguage = await AsyncStorage.getItem(getUserLanguageKey(userId));
    
    if (storedLanguage) {
      console.log('[Preferences] Found stored language for user:', storedLanguage);
      setLanguageState(storedLanguage as Language);
    } else if (defaultLanguage) {
      console.log('[Preferences] No stored language, using system default:', defaultLanguage);
      setLanguageState(defaultLanguage);
    } else {
      console.log('[Preferences] No stored language, using app default:', DEFAULT_LANGUAGE);
      setLanguageState(DEFAULT_LANGUAGE);
    }
  };

  const clearUserPreferences = async () => {
    console.log('[Preferences] Clearing user preferences on logout');
    setCurrentUserId(null);
    setLanguageState(DEFAULT_LANGUAGE);
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
    loadUserPreferences,
    clearUserPreferences,
  };
});
