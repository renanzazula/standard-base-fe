import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useState} from 'react';
import type {NavigationTab} from './AdminConfigContext';
import {useAdminConfig} from './AdminConfigContext';
import type {NavigationTabResponse} from '@core/services/auth';
import * as authApi from '@core/services/auth';
import * as keycloakAuth from '@core/services/keycloakAuth';
import * as userProfileApi from '@core/services/userProfile';
import * as tokenStorage from '@core/services/tokenStorage';
import {setOnAuthExpired} from '@core/services/api';
import {clearImageCacheScope, userScope} from '@core/services/imageCache';
import {canAccessAdminConfig, type Permission} from '@shared/constants/permissions';

/**
 * Lowercased name of the user's Keycloak user-type role. Not a union type:
 * roles are dynamic (composite realm roles defined in Keycloak), so new types
 * like 'gold' arrive without app changes. 'guest' keeps special meaning.
 */
export type UserRole = string;

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
  /** Profile field (e.g. EMAIL) -> visible, from /api/auth/me for this user's role. */
  profileFieldVisibility?: Record<string, boolean>;
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
  // Permissions come exclusively from the backend (which reads them from the
  // Keycloak token / GUEST composite role) — there is no client-side fallback,
  // since the role list itself is dynamic.
  if (!apiPermissions || apiPermissions.length === 0) {
    console.warn('[Auth] No permissions returned from API for role:', role);
    return [];
  }
  return apiPermissions as Permission[];
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
    profileFieldVisibility: profile.profileFieldVisibility,
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
  });
  const { reloadTabConfig, loadUserConfig } = useAdminConfig();

  useEffect(() => {
    setOnAuthExpired(() => {
      // Tokens are already invalid — skip the Keycloak end-session redirect.
      logout(false);
    });
    loadSession();
  }, []);

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
        });
        // /api/admin/config requires an admin-settings permission; everyone
        // else gets the slim signed-in slice (regional + profile policy),
        // which the admin response already contains.
        if (canAccessAdminConfig(user.permissions)) reloadTabConfig();
        else loadUserConfig();
        return;
      }
    } catch (error) {
      await tokenStorage.clearTokens();
    }
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const saveUserCache = async (user: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to cache user data:', error);
    }
  };

  /**
   * Keycloak tokens are stored — load the profile + DB permissions from the
   * backend (which JIT-provisions/links the local user on first sign-in) and
   * activate the session.
   */
  const completeKeycloakSignIn = async (): Promise<void> => {
    const profile = await authApi.getCurrentUser();
    const user = mapProfileToUser(profile);
    await saveUserCache(user);
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    if (canAccessAdminConfig(user.permissions)) reloadTabConfig();
    else loadUserConfig();
  };

  /**
   * In-app credential login via Keycloak's Direct Access Grant — no browser.
   * Throws KeycloakAuthError (see keycloakAuth.isInvalidCredentials /
   * isAccountNotSetUp) when Keycloak rejects the credentials.
   */
  const signInWithCredentials = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    await keycloakAuth.signInWithPassword(usernameOrEmail, password);
    await completeKeycloakSignIn();
    return true;
  };

  /**
   * Keycloak hosted login (Authorization Code + PKCE in a browser sheet).
   * Pass an idpHint (Keycloak IdP alias, e.g. 'google') to land directly on a
   * brokered provider; without one it shows the full hosted login page.
   *
   * @returns false when the user dismissed the browser sheet.
   */
  const signIn = async (options?: { idpHint?: string }): Promise<boolean> => {
    const completed = await keycloakAuth.signIn(options);
    if (!completed) return false;
    await completeKeycloakSignIn();
    return true;
  };

  /**
   * Keycloak hosted registration in a browser sheet; the new user is signed
   * in automatically on completion.
   *
   * @returns false when the user dismissed the browser sheet.
   */
  const register = async (): Promise<boolean> => {
    const completed = await keycloakAuth.register();
    if (!completed) return false;
    await completeKeycloakSignIn();
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
    });
    loadUserConfig();
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
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
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
    signInWithCredentials,
    register,
    loginAsGuest,
    logout,
    deactivateAccount,
    updateProfile,
    updateAvatar,
    refreshProfile,
  };
});
