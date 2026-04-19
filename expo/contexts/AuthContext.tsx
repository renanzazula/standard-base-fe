import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useRef } from 'react';
import { useAdminConfig } from './AdminConfigContext';
import type { NavigationTab } from './AdminConfigContext';
import * as authApi from '@/services/auth';
import type { NavigationTabResponse } from '@/services/auth';
import * as userProfileApi from '@/services/userProfile';
import * as tokenStorage from '@/services/tokenStorage';
import { setOnAuthExpired } from '@/services/api';
import { DEFAULT_ROLE_PERMISSIONS, type Permission } from '@/constants/permissions';

export type UserRole = 'standard' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: 'google' | 'apple' | 'manual';
  username?: string;
  avatar?: string;
  permissions: Permission[];
  navigationTabs: NavigationTab[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
}

const USER_STORAGE_KEY = '@user_data';

function mapNavigationTab(t: NavigationTabResponse): NavigationTab {
  return {
    id: t.tabId,
    name: t.label,
    enabled: t.enabled,
    icon: t.iconName,
    order: t.sortOrder,
    isSystem: t.isSystem,
    permissionKey: t.permissionKey as Permission | undefined,
  };
}

function resolvePermissions(role: UserRole, apiPermissions?: string[]): Permission[] {
  if (apiPermissions && apiPermissions.length > 0) {
    return apiPermissions as Permission[];
  }
  console.warn('[Auth] No permissions returned from API — falling back to client-side defaults for role:', role);
  return DEFAULT_ROLE_PERMISSIONS[role] ?? DEFAULT_ROLE_PERMISSIONS.standard;
}

function mapAuthResponseToUser(
  response: authApi.AuthResponse,
  provider: 'google' | 'apple' | 'manual',
): User {
  const role = response.role.toLowerCase() as UserRole;
  return {
    id: response.userId,
    email: response.email,
    name: response.displayName,
    role,
    provider,
    permissions: resolvePermissions(role, response.permissions),
    navigationTabs: response.navigationTabs?.map(mapNavigationTab) ?? [],
  };
}

function mapProfileToUser(profile: authApi.UserProfileResponse): User {
  const providerMap: Record<string, 'google' | 'apple' | 'manual'> = {
    EMAIL: 'manual',
    GOOGLE: 'google',
    APPLE: 'apple',
  };
  const firstProvider = profile.providers[0] ?? 'EMAIL';
  const role = profile.role.toLowerCase() as UserRole;
  return {
    id: profile.userId,
    email: profile.email,
    name: profile.displayName,
    role,
    provider: providerMap[firstProvider] ?? 'manual',
    permissions: resolvePermissions(role, profile.permissions),
    navigationTabs: profile.navigationTabs?.map(mapNavigationTab) ?? [],
  };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    lastActivity: Date.now(),
  });
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { config } = useAdminConfig();

  useEffect(() => {
    setOnAuthExpired(() => {
      logout();
    });
    loadSession();
  }, []);

  useEffect(() => {
    if (authState.isAuthenticated) {
      startSessionTimeout();
    } else {
      clearSessionTimeout();
    }
    return () => clearSessionTimeout();
  }, [authState.isAuthenticated, authState.lastActivity, config.sessionConfig]);

  const loadSession = async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        const profile = await authApi.getCurrentUser();
        const user = mapProfileToUser(profile);
        await saveUserCache(user);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          lastActivity: Date.now(),
        });
        return;
      }
    } catch (error) {
      await tokenStorage.clearTokens();
    }
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now(),
    });
  };

  const saveUserCache = async (user: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to cache user data:', error);
    }
  };

  const startSessionTimeout = () => {
    clearSessionTimeout();
    sessionTimeoutRef.current = setTimeout(() => {
      console.log('Session timeout - logging out');
      logout();
    }, config.sessionConfig.idleTime);
  };

  const clearSessionTimeout = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };

  const updateActivity = () => {
    if (authState.isAuthenticated && config.sessionConfig.autoRefresh) {
      setAuthState((prev) => ({ ...prev, lastActivity: Date.now() }));
    }
  };

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    const response = await authApi.login(email, password);
    const user = mapAuthResponseToUser(response, 'manual');
    await saveUserCache(user);
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      lastActivity: Date.now(),
    });
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    // TODO: Real Google OAuth flow — requires expo-auth-session integration
    // 1. Use Google.useAuthRequest() to get authorization code
    // 2. Call authApi.oauthLogin('GOOGLE', authorizationCode)
    // 3. Map response to User and save session
    throw new Error('Google Sign In is not yet configured.');
  };

  const loginWithApple = async (): Promise<boolean> => {
    // TODO: Real Apple Sign In flow — requires expo-apple-authentication
    // 1. Use AppleAuthentication.signInAsync() to get authorization code
    // 2. Call authApi.oauthLogin('APPLE', authorizationCode)
    // 3. Map response to User and save session
    throw new Error('Apple Sign In is not yet configured.');
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    provider: 'google' | 'apple' | 'manual',
  ): Promise<boolean> => {
    const response = await authApi.register(email, password, name);
    const user = mapAuthResponseToUser(response, provider);
    await saveUserCache(user);
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      lastActivity: Date.now(),
    });
    return true;
  };

  const logout = async () => {
    await tokenStorage.clearTokens();
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    clearSessionTimeout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now(),
    });
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    await authApi.forgotPassword(email);
    return true;
  };

  const refreshProfile = async () => {
    try {
      const profile = await authApi.getCurrentUser();
      const updatedUser = mapProfileToUser(profile);
      await saveUserCache(updatedUser);
      setAuthState((prev) => ({ ...prev, user: updatedUser }));
    } catch (error) {
      console.error('[Auth] Failed to refresh profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'username' | 'avatar'>>) => {
    if (!authState.user) return;
    const response = await userProfileApi.updateProfile({
      username: updates.username,
      avatarUrl: updates.avatar,
    });
    const updatedUser: User = {
      ...authState.user,
      username: response.username ?? authState.user.username,
      avatar: response.avatarUrl ?? authState.user.avatar,
    };
    await saveUserCache(updatedUser);
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    loginWithCredentials,
    loginWithGoogle,
    loginWithApple,
    signUp,
    logout,
    resetPassword,
    updateActivity,
    updateProfile,
    refreshProfile,
  };
});
