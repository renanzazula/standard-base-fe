import {AdminConfigProvider, useAdminConfig} from '@core/contexts/AdminConfigContext';
import {AuthProvider, useAuth} from '@core/contexts/AuthContext';
import {PostsProvider} from '@core/contexts/PostsContext';
import {PreferencesProvider, usePreferences} from '@core/contexts/PreferencesContext';
import {UserManagementProvider} from '@core/contexts/UserManagementContext';
import {usePermissions} from '@shared/hooks/usePermissions';
import {PERMISSIONS} from '@shared/constants/permissions';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Stack, useRouter, useSegments} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, {useEffect} from 'react';
import {AppState} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const ROUTE_PERMISSION_MAP: Record<string, (typeof PERMISSIONS)[keyof typeof PERMISSIONS]> = {
  'user-management': PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS,
  'user-permissions': PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS_UPDATE,
  'profile-permissions': PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS_UPDATE,
  'configure-authentication': PERMISSIONS.FUNC_TAB_SETTINGS_CONFIGURE_AUTH,
  'session-configuration': PERMISSIONS.FUNC_TAB_SETTINGS_SESSION_CONFIG,
  'language-settings': PERMISSIONS.FUNC_TAB_SETTINGS_LANGUAGE_SETTINGS,
  'profile-restrictions': PERMISSIONS.FUNC_TAB_SETTINGS_PROFILE_RESTRICTIONS,
  'navigation-management': PERMISSIONS.FUNC_TAB_SETTINGS_NAVIGATION_MANAGEMENT,
  'admin-config': PERMISSIONS.FUNC_TAB_SETTINGS_MANAGE_USERS,
  'create-post': PERMISSIONS.FUNC_FEED_CREATE_POST,
  'edit-post': PERMISSIONS.FUNC_FEED_EDIT_POST,
};

// Routes accessible to any authenticated user (no special permission required)
const AUTHENTICATED_ROUTES = new Set(['post']);

function RootLayoutNav() {
  const { isAuthenticated, isLoading: authLoading, user, refreshProfile } = useAuth();
  const { isLoading: prefsLoading, loadUserPreferences, clearUserPreferences } = usePreferences();
  const { isLoading: configLoading, config, reloadTabConfig } = useAdminConfig();
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
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!configLoading && isAuthenticated) {
      if (user?.role === 'admin') {
        reloadTabConfig();
      }
    }
  }, [configLoading, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (user?.role === 'admin') {
          reloadTabConfig();
        } else {
          refreshProfile();
        }
      }
    });
    return () => subscription.remove();
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === undefined;
    const currentSegment = segments[0] as string | undefined;
    const requiredPermission = currentSegment ? ROUTE_PERMISSION_MAP[currentSegment] : undefined;
    const inPermissionRoute = requiredPermission !== undefined;
    const inAuthenticatedRoute = currentSegment ? AUTHENTICATED_ROUTES.has(currentSegment) : false;

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup && !inPermissionRoute && !inAuthenticatedRoute) {
      router.replace('/(tabs)/home');
    } else if (isAuthenticated && inPermissionRoute && requiredPermission && !hasPermission(requiredPermission)) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, segments, router, hasPermission]);

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="admin-config" options={{ headerShown: true }} />
      <Stack.Screen name="navigation-management" options={{ headerShown: true }} />
      <Stack.Screen name="user-management" options={{ headerShown: true, title: 'User Management' }} />
      <Stack.Screen name="user-permissions" options={{ headerShown: true, title: 'User Permissions' }} />
      <Stack.Screen name="profile-permissions" options={{ headerShown: true, title: 'Profile Permissions' }} />
      <Stack.Screen name="profile-restrictions" options={{ headerShown: true }} />
      <Stack.Screen name="configure-authentication" options={{ headerShown: true }} />
      <Stack.Screen name="session-configuration" options={{ headerShown: true }} />
      <Stack.Screen name="language-settings" options={{ headerShown: true }} />
      <Stack.Screen name="create-post" options={{ headerShown: true, title: 'Create Post', presentation: 'modal' }} />
      <Stack.Screen name="edit-post/[id]" options={{ headerShown: true, title: 'Edit Post', presentation: 'modal' }} />
      <Stack.Screen name="post/[slug]" options={{ headerShown: true, title: '' }} />
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
                <PostsProvider>
                  <RootLayoutNav />
                </PostsProvider>
              </UserManagementProvider>
            </AuthProvider>
          </PreferencesProvider>
        </AdminConfigProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
