import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Theme, themes, ThemeColors } from '@/constants/themes';
import { Language, DEFAULT_LANGUAGE } from '@/constants/languages';
import { DateFormat } from './AdminConfigContext';

const THEME_STORAGE_KEY = '@user_theme';
const getUserLanguageKey = (userId: string | null) => `@user_language_${userId || 'guest'}`;
const getUserTimezoneKey = (userId: string | null) => `@user_timezone_${userId || 'guest'}`;
const getUserDateFormatKey = (userId: string | null) => `@user_dateformat_${userId || 'guest'}`;

export const [PreferencesProvider, usePreferences] = createContextHook(() => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [timezone, setTimezoneState] = useState<string>('UTC');
  const [dateFormat, setDateFormatState] = useState<DateFormat>('MM/DD/YYYY');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async (userId?: string) => {
    try {
      const userIdToLoad = userId || currentUserId;
      const [storedTheme, storedLanguage, storedTimezone, storedDateFormat] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(getUserLanguageKey(userIdToLoad)),
        AsyncStorage.getItem(getUserTimezoneKey(userIdToLoad)),
        AsyncStorage.getItem(getUserDateFormatKey(userIdToLoad)),
      ]);

      console.log('[Preferences] Loading preferences for user:', userIdToLoad);
      console.log('[Preferences] Stored language:', storedLanguage);
      console.log('[Preferences] Stored timezone:', storedTimezone);
      console.log('[Preferences] Stored date format:', storedDateFormat);

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

      if (storedTimezone) {
        setTimezoneState(storedTimezone);
      }

      if (storedDateFormat) {
        setDateFormatState(storedDateFormat as DateFormat);
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

  const setTimezone = async (newTimezone: string) => {
    try {
      console.log('[Preferences] Setting timezone:', newTimezone);
      await AsyncStorage.setItem(getUserTimezoneKey(currentUserId), newTimezone);
      setTimezoneState(newTimezone);
      console.log('[Preferences] Timezone updated successfully to:', newTimezone);
    } catch (error) {
      console.error('Failed to save timezone:', error);
    }
  };

  const setDateFormat = async (newDateFormat: DateFormat) => {
    try {
      console.log('[Preferences] Setting date format:', newDateFormat);
      await AsyncStorage.setItem(getUserDateFormatKey(currentUserId), newDateFormat);
      setDateFormatState(newDateFormat);
      console.log('[Preferences] Date format updated successfully to:', newDateFormat);
    } catch (error) {
      console.error('Failed to save date format:', error);
    }
  };

  const loadUserPreferences = async (
    userId: string, 
    defaultLanguage?: Language,
    defaultTimezone?: string,
    defaultDateFormat?: DateFormat
  ) => {
    console.log('[Preferences] Loading user preferences for:', userId);
    setCurrentUserId(userId);
    const [storedLanguage, storedTimezone, storedDateFormat] = await Promise.all([
      AsyncStorage.getItem(getUserLanguageKey(userId)),
      AsyncStorage.getItem(getUserTimezoneKey(userId)),
      AsyncStorage.getItem(getUserDateFormatKey(userId)),
    ]);
    
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

    if (storedTimezone) {
      console.log('[Preferences] Found stored timezone for user:', storedTimezone);
      setTimezoneState(storedTimezone);
    } else if (defaultTimezone) {
      console.log('[Preferences] No stored timezone, using system default:', defaultTimezone);
      setTimezoneState(defaultTimezone);
    }

    if (storedDateFormat) {
      console.log('[Preferences] Found stored date format for user:', storedDateFormat);
      setDateFormatState(storedDateFormat as DateFormat);
    } else if (defaultDateFormat) {
      console.log('[Preferences] No stored date format, using system default:', defaultDateFormat);
      setDateFormatState(defaultDateFormat);
    }
  };

  const clearUserPreferences = async () => {
    console.log('[Preferences] Clearing user preferences on logout');
    setCurrentUserId(null);
    const storedLanguage = await AsyncStorage.getItem(getUserLanguageKey(null));
    if (storedLanguage) {
      console.log('[Preferences] Restoring guest language after logout:', storedLanguage);
      setLanguageState(storedLanguage as Language);
    } else {
      console.log('[Preferences] No guest language, using default:', DEFAULT_LANGUAGE);
      setLanguageState(DEFAULT_LANGUAGE);
    }
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
