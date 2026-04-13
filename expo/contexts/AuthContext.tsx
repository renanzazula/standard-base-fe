import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useRef } from 'react';
import { useAdminConfig } from './AdminConfigContext';
import * as authApi from '@/services/auth';
import * as tokenStorage from '@/services/tokenStorage';
import { ApiError, AuthExpiredError, setOnAuthExpired } from '@/services/api';

export type UserRole = 'standard' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: 'google' | 'apple' | 'manual';
  username?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
}

const USER_STORAGE_KEY = '@user_data';
const SESSION_STORAGE_KEY = '@session_data';
const USERS_STORAGE_KEY = '@managed_users';

const mockUsers = {
  'user@example.com': {
    id: '1',
    email: 'user@example.com',
    name: 'Standard User',
    role: 'standard' as UserRole,
    password: 'password123',
  },
  'admin@example.com': {
    id: '2',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin' as UserRole,
    password: 'admin123',
  },
};

function mapAuthResponseToUser(
  response: authApi.AuthResponse,
  provider: 'google' | 'apple' | 'manual',
): User {
  return {
    id: response.userId,
    email: response.email,
    name: response.displayName,
    role: response.role.toLowerCase() as UserRole,
    provider,
  };
}

function mapProfileToUser(profile: authApi.UserProfileResponse): User {
  const providerMap: Record<string, 'google' | 'apple' | 'manual'> = {
    EMAIL: 'manual',
    GOOGLE: 'google',
    APPLE: 'apple',
  };
  const firstProvider = profile.providers[0] ?? 'EMAIL';
  return {
    id: profile.userId,
    email: profile.email,
    name: profile.displayName,
    role: profile.role.toLowerCase() as UserRole,
    provider: providerMap[firstProvider] ?? 'manual',
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
      // Try real-mode session restoration first (JWT tokens)
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        try {
          const profile = await authApi.getCurrentUser();
          const user = mapProfileToUser(profile);
          // Also save to AsyncStorage for offline access
          await saveSession(user);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: Date.now(),
          });
          return;
        } catch (error) {
          // Token expired or invalid — clear and fall through
          await tokenStorage.clearTokens();
        }
      }

      // Fall back to mock-mode session restoration (AsyncStorage)
      const [userData, sessionData] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(SESSION_STORAGE_KEY),
      ]);

      if (userData && sessionData) {
        const user = JSON.parse(userData);
        const session = JSON.parse(sessionData);
        const now = Date.now();

        if (now - session.lastActivity < config.sessionConfig.maxTime) {
          console.log('[Auth] Restoring session for user:', user.id);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: now,
          });
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now(),
    });
  };

  const saveSession = async (user: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ lastActivity: Date.now() })
      );
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.multiRemove([USER_STORAGE_KEY, SESSION_STORAGE_KEY]);
    } catch (error) {
      console.error('Failed to clear session:', error);
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

  const checkUserStatus = async (userId: string): Promise<boolean> => {
    try {
      const stored = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const managedUsers = JSON.parse(stored);
        const user = managedUsers.find((u: any) => u.id === userId);
        if (user && user.status === 'disabled') {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[Auth] Failed to check user status:', error);
      return false;
    }
  };

  const updateActivity = () => {
    if (authState.isAuthenticated && config.sessionConfig.autoRefresh) {
      const now = Date.now();
      setAuthState((prev) => ({ ...prev, lastActivity: now }));
      AsyncStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ lastActivity: now })
      );
    }
  };

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    console.log('Login attempt:', { email, mode: config.serviceModes.manual });

    if (config.serviceModes.manual === 'mock') {
      const mockUser = mockUsers[email as keyof typeof mockUsers];
      if (mockUser && mockUser.password === password) {
        const isDisabled = await checkUserStatus(mockUser.id);
        if (isDisabled) {
          console.log('[Auth] Login blocked - user is disabled:', mockUser.id);
          throw new Error('User account is disabled');
        }

        const user: User = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          provider: 'manual',
        };
        await saveSession(user);
        console.log('[Auth] Login successful for user:', user.id);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          lastActivity: Date.now(),
        });
        return true;
      }
      return false;
    }

    // Real mode — call backend API
    const response = await authApi.login(email, password);
    const user = mapAuthResponseToUser(response, 'manual');
    await saveSession(user);
    console.log('[Auth] Login successful for user:', user.id);
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      lastActivity: Date.now(),
    });
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    console.log('Google login attempt:', { mode: config.serviceModes.google });

    if (config.serviceModes.google === 'mock') {
      const userId = 'google-mock-1';
      const isDisabled = await checkUserStatus(userId);
      if (isDisabled) {
        console.log('[Auth] Login blocked - user is disabled:', userId);
        throw new Error('User account is disabled');
      }

      const user: User = {
        id: userId,
        email: 'google.user@example.com',
        name: 'Google User',
        role: 'standard',
        provider: 'google',
      };
      await saveSession(user);
      console.log('[Auth] Google login successful for user:', user.id);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        lastActivity: Date.now(),
      });
      return true;
    }

    // TODO: Real Google OAuth flow — requires expo-auth-session integration
    // 1. Use Google.useAuthRequest() to get authorization code
    // 2. Call authApi.oauthLogin('GOOGLE', authorizationCode)
    // 3. Map response to User and save session
    throw new Error('Real Google OAuth is not yet implemented. Switch to mock mode.');
  };

  const loginWithApple = async (): Promise<boolean> => {
    console.log('Apple login attempt:', { mode: config.serviceModes.apple });

    if (config.serviceModes.apple === 'mock') {
      const userId = 'apple-mock-1';
      const isDisabled = await checkUserStatus(userId);
      if (isDisabled) {
        console.log('[Auth] Login blocked - user is disabled:', userId);
        throw new Error('User account is disabled');
      }

      const user: User = {
        id: userId,
        email: 'apple.user@example.com',
        name: 'Apple User',
        role: 'standard',
        provider: 'apple',
      };
      await saveSession(user);
      console.log('[Auth] Apple login successful for user:', user.id);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        lastActivity: Date.now(),
      });
      return true;
    }

    // TODO: Real Apple Sign In flow — requires expo-apple-authentication
    // 1. Use AppleAuthentication.signInAsync() to get authorization code
    // 2. Call authApi.oauthLogin('APPLE', authorizationCode)
    // 3. Map response to User and save session
    throw new Error('Real Apple Sign In is not yet implemented. Switch to mock mode.');
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    provider: 'google' | 'apple' | 'manual'
  ): Promise<boolean> => {
    console.log('Sign up attempt:', { email, provider, mode: config.serviceModes[provider] });

    if (config.serviceModes[provider] === 'mock') {
      const user: User = {
        id: `${provider}-${Date.now()}`,
        email,
        name,
        role: 'standard',
        provider,
      };
      await saveSession(user);
      console.log('[Auth] Signup successful for user:', user.id);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        lastActivity: Date.now(),
      });
      return true;
    }

    // Real mode — call backend API
    const response = await authApi.register(email, password, name);
    const user = mapAuthResponseToUser(response, provider);
    await saveSession(user);
    console.log('[Auth] Signup successful for user:', user.id);
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      lastActivity: Date.now(),
    });
    return true;
  };

  const logout = async () => {
    console.log('[Auth] Logging out');
    await tokenStorage.clearTokens();
    await clearSession();
    clearSessionTimeout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now(),
    });
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    console.log('Password reset request:', { email });
    // Backend does not have a password reset endpoint yet
    return true;
  };

  const updateProfile = async (updates: Partial<Pick<User, 'username' | 'avatar'>>) => {
    if (!authState.user) return;

    console.log('[Auth] Updating profile:', updates);
    const updatedUser = { ...authState.user, ...updates };
    await saveSession(updatedUser);
    setAuthState((prev) => ({
      ...prev,
      user: updatedUser,
    }));
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
  };
});
