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

  const loadUserPreferences = async (
    userId: string,
    _defaultLanguage?: Language,
    _defaultTimezone?: string,
    _defaultDateFormat?: DateFormat,
  ) => {
    try {
      const prefs = await userProfileApi.getPreferences();
      if (!prefs) return;
      setLanguageState((prefs.language as Language) || DEFAULT_LANGUAGE);
      setTimezoneState(prefs.timezone || 'UTC');
      setDateFormatState((prefs.dateFormat as DateFormat) || 'MM/DD/YYYY');
      if (prefs.theme) {
        const normalised = prefs.theme.toLowerCase() as Theme;
        if (normalised === 'dark' || normalised === 'light') {
          setThemeState(normalised);
          await AsyncStorage.setItem(THEME_STORAGE_KEY, normalised);
        }
      }
    } catch (error) {
      console.error('[Preferences] Failed to load preferences for user:', userId, error);
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
    loadUserPreferences,
    clearUserPreferences,
  };
});
