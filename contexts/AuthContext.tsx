import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useRef } from 'react';
import { useAdminConfig } from './AdminConfigContext';

export type UserRole = 'standard' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: 'google' | 'apple' | 'manual';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
}

const USER_STORAGE_KEY = '@user_data';
const SESSION_STORAGE_KEY = '@session_data';

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

    return false;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    console.log('Google login attempt:', { mode: config.serviceModes.google });

    if (config.serviceModes.google === 'mock') {
      const user: User = {
        id: 'google-mock-1',
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

    return false;
  };

  const loginWithApple = async (): Promise<boolean> => {
    console.log('Apple login attempt:', { mode: config.serviceModes.apple });

    if (config.serviceModes.apple === 'mock') {
      const user: User = {
        id: 'apple-mock-1',
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

    return false;
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

    return false;
  };

  const logout = async () => {
    console.log('[Auth] Logging out');
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
    return true;
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
  };
});
