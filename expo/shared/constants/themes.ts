export type Theme = 'dark' | 'light';

export const darkTheme = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceSecondary: '#2C2C2E',
  primary: '#0A84FF',
  primaryDark: '#0066CC',
  accentFeed: '#40C8E0',
  accentPodcast: '#FF9F0A',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FFD60A',
  card: '#1C1C1E',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

export const lightTheme = {
  background: '#FFFFFF',
  surface: '#F2F2F7',
  surfaceSecondary: '#E5E5EA',
  primary: '#007AFF',
  primaryDark: '#0051D5',
  accentFeed: '#30B0C7',
  accentPodcast: '#FF9500',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FFCC00',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const themes = {
  dark: darkTheme,
  light: lightTheme,
};

export type ThemeColors = typeof darkTheme;
