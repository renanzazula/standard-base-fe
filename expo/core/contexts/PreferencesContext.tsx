import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useState} from 'react';
import {Theme, ThemeColors, themes} from '@shared/constants/themes';
import {DEFAULT_LANGUAGE, Language} from '@shared/constants/languages';
import {DateFormat} from './AdminConfigContext';
import * as userProfileApi from '@core/services/userProfile';

const THEME_STORAGE_KEY = '@user_theme';

export const [PreferencesProvider, usePreferences] = createContextHook(() => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [timezone, setTimezoneState] = useState<string>('UTC');
  const [dateFormat, setDateFormatState] = useState<DateFormat>('MM/DD/YYYY');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setThemeState(storedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
      await userProfileApi.updatePreferences({ theme: newTheme.toUpperCase() });
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
      await userProfileApi.updatePreferences({ language: newLanguage });
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const setTimezone = async (newTimezone: string) => {
    try {
      await userProfileApi.updatePreferences({ timezone: newTimezone });
      setTimezoneState(newTimezone);
    } catch (error) {
      console.error('Failed to save timezone:', error);
    }
  };

  const setDateFormat = async (newDateFormat: DateFormat) => {
    try {
      await userProfileApi.updatePreferences({ dateFormat: newDateFormat });
      setDateFormatState(newDateFormat);
    } catch (error) {
      console.error('Failed to save date format:', error);
    }
  };

  const applyUserPreferences = async (
    prefs: { language?: string; theme?: string; timezone?: string; dateFormat?: string; notificationsEnabled?: boolean } | undefined,
    defaultLanguage?: Language,
    defaultTimezone?: string,
    defaultDateFormat?: DateFormat,
  ) => {
    if (!prefs) return;
    setLanguageState((prefs.language as Language) || defaultLanguage || DEFAULT_LANGUAGE);
    setTimezoneState(prefs.timezone || defaultTimezone || 'UTC');
    setDateFormatState((prefs.dateFormat as DateFormat) || defaultDateFormat || 'MM/DD/YYYY');
    if (prefs.theme) {
      const normalised = prefs.theme.toLowerCase() as Theme;
      if (normalised === 'dark' || normalised === 'light') {
        setThemeState(normalised);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, normalised);
      }
    }
  };

  const clearUserPreferences = async () => {
    setLanguageState(DEFAULT_LANGUAGE);
    setTimezoneState('UTC');
    setDateFormatState('MM/DD/YYYY');
  };

  const colors: ThemeColors = themes[theme];

  return {
    theme,
    colors,
    setTheme,
    toggleTheme,
    language,
    setLanguage,
    timezone,
    setTimezone,
    dateFormat,
    setDateFormat,
    isLoading,
    applyUserPreferences,
    clearUserPreferences,
  };
});
