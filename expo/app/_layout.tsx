import { AdminConfigProvider, useAdminConfig } from '@/contexts/AdminConfigContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PreferencesProvider, usePreferences } from '@/contexts/PreferencesContext';
import { UserManagementProvider } from '@/contexts/UserManagementContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const ROUTE_PERMISSION_MAP: Record<string, (typeof PERMISSIONS)[keyof typeof PERMISSIONS]> = {
  'user-management': PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS,
  'configure-authentication': PERMISSIONS.FUNC_TAB_SETTINGS_CONFIGURE_AUTH,
  'session-configuration': PERMISSIONS.FUNC_TAB_SETTINGS_SESSION_CONFIG,
  'language-settings': PERMISSIONS.FUNC_TAB_SETTINGS_LANGUAGE_SETTINGS,
  'profile-restrictions': PERMISSIONS.FUNC_TAB_SETTINGS_PROFILE_RESTRICTIONS,
  'navigation-management': PERMISSIONS.FUNC_TAB_SETTINGS_NAVIGATION_MANAGEMENT,
  'admin-config': PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS,
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { isLoading: prefsLoading, loadUserPreferences, clearUserPreferences } = usePreferences();
  const { isLoading: configLoading, config } = useAdminConfig();
  const { hasPermission } = usePermissions();
  const segments = useSegments();
  const router = useRouter();

  const isLoading = authLoading || prefsLoading || configLoading;

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[RootLayout] User authenticated, loading preferences for:', user.id);
      loadUserPreferences(
        user.id, 
        config.languageConfig.defaultLanguage,
        config.regionalConfig.defaultTimezone,
        config.regionalConfig.defaultDateFormat
      );
    } else if (!isAuthenticated) {
      console.log('[RootLayout] User logged out, clearing preferences');
      clearUserPreferences();
    }
  }, [isAuthenticated, user?.id, user, loadUserPreferences, clearUserPreferences, config.languageConfig.defaultLanguage, config.regionalConfig.defaultTimezone, config.regionalConfig.defaultDateFormat]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === undefined;
    const currentSegment = segments[0] as string | undefined;
    const requiredPermission = currentSegment ? ROUTE_PERMISSION_MAP[currentSegment] : undefined;
    const inProtectedRoute = requiredPermission !== undefined;

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup && !inProtectedRoute) {
      router.replace('/(tabs)/home');
    } else if (isAuthenticated && inProtectedRoute && requiredPermission && !hasPermission(requiredPermission)) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, segments, router, hasPermission]);

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="admin-config" options={{ headerShown: true }} />
      <Stack.Screen name="navigation-management" options={{ headerShown: true }} />
      <Stack.Screen name="user-management" options={{ headerShown: true, title: 'User Management' }} />
      <Stack.Screen name="profile-restrictions" options={{ headerShown: true }} />
      <Stack.Screen name="language-management" options={{ headerShown: true }} />
      <Stack.Screen name="configure-authentication" options={{ headerShown: true }} />
      <Stack.Screen name="session-configuration" options={{ headerShown: true }} />
      <Stack.Screen name="language-settings" options={{ headerShown: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AdminConfigProvider>
          <PreferencesProvider>
            <AuthProvider>
              <UserManagementProvider>
                <RootLayoutNav />
              </UserManagementProvider>
            </AuthProvider>
          </PreferencesProvider>
        </AdminConfigProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
