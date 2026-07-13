import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useRef, useState} from 'react';
import type {NavigationTab} from './AdminConfigContext';
import {useAdminConfig} from './AdminConfigContext';
import type {NavigationTabResponse} from '@core/services/auth';
import * as authApi from '@core/services/auth';
import * as keycloakAuth from '@core/services/keycloakAuth';
import * as userProfileApi from '@core/services/userProfile';
import * as tokenStorage from '@core/services/tokenStorage';
import {setOnAuthExpired} from '@core/services/api';
import {clearImageCacheScope, userScope} from '@core/services/imageCache';
import {DEFAULT_ROLE_PERMISSIONS, type Permission} from '@shared/constants/permissions';

export type UserRole = 'standard' | 'admin' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: 'google' | 'apple' | 'manual' | 'guest';
  username?: string;
  avatar?: string;
  avatarVersion?: number;
  permissions: Permission[];
  navigationTabs: NavigationTab[];
  preferences?: {
    language: string;
    theme: string;
    timezone: string;
    dateFormat: string;
    notificationsEnabled: boolean;
  };
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
    configs: t.configs,
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
  provider: 'google' | 'apple' | 'manual' | 'guest',
): User {
  const role = response.role.toLowerCase() as UserRole;
  return {
    id: response.userId,
    email: response.email,
    name: response.displayName,
    username: response.username,
    avatar: response.avatarUrl,
    avatarVersion: response.avatarVersion,
    role,
    provider,
    permissions: resolvePermissions(role, response.permissions),
    navigationTabs: response.navigationTabs?.map(mapNavigationTab) ?? [],
    preferences: response.preferences
      ? {
          language: response.preferences.language ?? 'en',
          theme: response.preferences.theme ?? 'DARK',
          timezone: response.preferences.timezone ?? 'UTC',
          dateFormat: response.preferences.dateFormat ?? 'MM/DD/YYYY',
          notificationsEnabled: response.preferences.notificationsEnabled ?? true,
        }
      : undefined,
  };
}

function mapProfileToUser(profile: authApi.UserProfileResponse): User {
  const providerMap: Record<string, 'google' | 'apple' | 'manual'> = {
    EMAIL: 'manual',
    GOOGLE: 'google',
    APPLE: 'apple',
    // Keycloak-federated accounts present as regular (manual) sign-ins.
    KEYCLOAK: 'manual',
  };
  const firstProvider = profile.providers[0] ?? 'EMAIL';
  const role = profile.role.toLowerCase() as UserRole;
  return {
    id: profile.userId,
    email: profile.email,
    name: profile.displayName,
    username: profile.username,
    avatar: profile.avatarUrl,
    avatarVersion: profile.avatarVersion,
    role,
    provider: role === 'guest' ? 'guest' : providerMap[firstProvider] ?? 'manual',
    permissions: resolvePermissions(role, profile.permissions),
    navigationTabs: profile.navigationTabs?.map(mapNavigationTab) ?? [],
    preferences: profile.preferences
      ? {
          language: profile.preferences.language ?? 'en',
          theme: profile.preferences.theme ?? 'DARK',
          timezone: profile.preferences.timezone ?? 'UTC',
          dateFormat: profile.preferences.dateFormat ?? 'MM/DD/YYYY',
          notificationsEnabled: profile.preferences.notificationsEnabled ?? true,
        }
      : undefined,
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
  const { config, reloadTabConfig } = useAdminConfig();

  useEffect(() => {
    setOnAuthExpired(() => {
      // Tokens are already invalid — skip the Keycloak end-session redirect.
      logout(false);
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
        // /api/admin/config is ADMIN-only — skip the call for other roles.
        if (user.role === 'admin') reloadTabConfig();
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

  /**
   * Keycloak hosted login (Authorization Code + PKCE in a browser sheet).
   * Keycloak handles credentials, registration, password reset and any
   * brokered social providers; on success the backend JIT-provisions/links
   * the local user and /api/auth/me returns the profile + DB permissions.
   *
   * @returns false when the user dismissed the browser sheet.
   */
  const signIn = async (): Promise<boolean> => {
    const completed = await keycloakAuth.signIn();
    if (!completed) return false;

    const profile = await authApi.getCurrentUser();
    const user = mapProfileToUser(profile);
    await saveUserCache(user);
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      lastActivity: Date.now(),
    });
    if (user.role === 'admin') reloadTabConfig();
    return true;
  };

  const loginAsGuest = async (): Promise<boolean> => {
    const response = await authApi.guestLogin();
    const user = mapAuthResponseToUser(response, 'guest');
    await saveUserCache(user);
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      lastActivity: Date.now(),
    });
    return true;
  };

  /**
   * @param endKeycloakSession user-initiated logout also ends the Keycloak SSO
   *        session (next sign-in prompts for credentials). Pass false when the
   *        session already died server-side (expiry, deactivation).
   */
  const logout = async (endKeycloakSession: boolean = true) => {
    const userId = authState.user?.id;
    if (endKeycloakSession) {
      // Also clears local tokens; guests (no id token) skip the browser step.
      await keycloakAuth.signOut();
    } else {
      await tokenStorage.clearTokens();
    }
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    if (userId) {
      // Best-effort: covers account switching too, since the next user gets a different scope.
      clearImageCacheScope(userScope(userId)).catch(() => {});
    }
    clearSessionTimeout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now(),
    });
  };

  const deactivateAccount = async () => {
    // The backend invalidates every token the moment this succeeds, so the
    // local session must be torn down immediately as well. Failures rethrow
    // and leave the session untouched.
    await userProfileApi.deactivateAccount();
    await logout();
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

  const applyProfilePatch = async (response: { username?: string; avatarUrl?: string; avatarVersion?: number }) => {
    if (!authState.user) return;
    const updatedUser: User = {
      ...authState.user,
      username: response.username ?? authState.user.username,
      avatar: response.avatarUrl ?? authState.user.avatar,
      avatarVersion: response.avatarVersion ?? authState.user.avatarVersion,
    };
    await saveUserCache(updatedUser);
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  const updateProfile = async (updates: Partial<Pick<User, 'username' | 'avatar'>>) => {
    if (!authState.user) return;
    const response = await userProfileApi.updateProfile({
      username: updates.username,
      avatarUrl: updates.avatar,
    });
    await applyProfilePatch(response);
  };

  const updateAvatar = async (uri: string, mimeType?: string, webFile?: File) => {
    if (!authState.user) return;
    const response = await userProfileApi.uploadAvatar(uri, mimeType, webFile);
    await applyProfilePatch(response);
  };

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    signIn,
    loginAsGuest,
    logout,
    deactivateAccount,
    updateActivity,
    updateProfile,
    updateAvatar,
    refreshProfile,
  };
});
