export type Theme = 'dark' | 'light';

// Brand colors — identical in both modes (see docs/README-ui-migration.md)
const BRAND = {
  spotify: '#1DB954',
  youtube: '#FF0000',
};

export const darkTheme = {
  background: '#0B0B0C',
  surface: '#151517',
  surfaceHigh: '#1D1D20',
  border: 'rgba(255,255,255,0.07)',
  accent: '#F2A900',
  accentSoft: 'rgba(242,169,0,0.14)',
  onAccent: '#1A1A1C',
  text: '#F5F5F4',
  textDim: '#9C9C9F',
  textFaint: '#6B6B6E',
  danger: '#FF6B6B',
  success: '#32D74B',
  warning: '#FFD60A',
  shadow: 'rgba(0, 0, 0, 0.3)',
  ...BRAND,
  // Legacy aliases — keep older screens on the same tokens
  surfaceSecondary: '#1D1D20',
  primary: '#F2A900',
  primaryDark: '#D99400',
  accentFeed: '#F2A900',
  accentPodcast: '#F2A900',
  textSecondary: '#9C9C9F',
  error: '#FF6B6B',
  card: '#151517',
};

export const lightTheme = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceHigh: '#F2F2F0',
  border: 'rgba(0,0,0,0.08)',
  accent: '#D99400',
  accentSoft: 'rgba(217,148,0,0.12)',
  onAccent: '#1A1A1C',
  text: '#1A1A1C',
  textDim: '#6E6E72',
  textFaint: '#9A9A9E',
  danger: '#D64545',
  success: '#34C759',
  warning: '#FFCC00',
  shadow: 'rgba(0, 0, 0, 0.06)',
  ...BRAND,
  // Legacy aliases — keep older screens on the same tokens
  surfaceSecondary: '#F2F2F0',
  primary: '#D99400',
  primaryDark: '#B37A00',
  accentFeed: '#D99400',
  accentPodcast: '#D99400',
  textSecondary: '#6E6E72',
  error: '#D64545',
  card: '#FFFFFF',
};

export const themes = {
  dark: darkTheme,
  light: lightTheme,
};

export type ThemeColors = typeof darkTheme;

// Shared shape values (single source of truth for the redesign)
export const RADII = {
  card: 18,
  control: 14,
  pill: 999,
};
