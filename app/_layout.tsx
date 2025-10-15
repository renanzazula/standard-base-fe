import { AdminConfigProvider, useAdminConfig } from '@/contexts/AdminConfigContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PreferencesProvider, usePreferences } from '@/contexts/PreferencesContext';
import { FeedProvider } from '@/contexts/FeedContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { isLoading: prefsLoading, loadUserPreferences, clearUserPreferences } = usePreferences();
  const { isLoading: configLoading, config } = useAdminConfig();
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
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === undefined;

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="admin-config" options={{ headerShown: true }} />
      <Stack.Screen name="post/[id]" options={{ headerShown: true, title: 'Post' }} />
      <Stack.Screen name="post/create" options={{ headerShown: true, title: 'Create Post' }} />
      <Stack.Screen name="post/edit/[id]" options={{ headerShown: true, title: 'Edit Post' }} />
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
              <FeedProvider>
                <RootLayoutNav />
              </FeedProvider>
            </AuthProvider>
          </PreferencesProvider>
        </AdminConfigProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
