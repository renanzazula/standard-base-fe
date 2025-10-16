import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { User } from './AuthContext';

export type UserStatus = 'active' | 'disabled';

export interface ManagedUser extends User {
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
}

const USERS_STORAGE_KEY = '@managed_users';

const mockManagedUsers: ManagedUser[] = [
  {
    id: '1',
    email: 'user@example.com',
    name: 'Standard User',
    username: 'standarduser',
    role: 'standard',
    provider: 'manual',
    status: 'active',
    createdAt: '2025-01-15T10:30:00Z',
    lastLogin: '2025-10-16T08:45:00Z',
  },
  {
    id: '2',
    email: 'admin@example.com',
    name: 'Admin User',
    username: 'adminuser',
    role: 'admin',
    provider: 'manual',
    status: 'active',
    createdAt: '2025-01-10T09:00:00Z',
    lastLogin: '2025-10-16T09:15:00Z',
  },
  {
    id: 'google-mock-1',
    email: 'google.user@example.com',
    name: 'Google User',
    username: 'googleuser',
    role: 'standard',
    provider: 'google',
    status: 'active',
    createdAt: '2025-02-01T14:20:00Z',
    lastLogin: '2025-10-15T16:30:00Z',
  },
  {
    id: 'apple-mock-1',
    email: 'apple.user@example.com',
    name: 'Apple User',
    username: 'appleuser',
    role: 'standard',
    provider: 'apple',
    status: 'disabled',
    createdAt: '2025-03-10T11:00:00Z',
    lastLogin: '2025-10-10T10:00:00Z',
  },
  {
    id: '5',
    email: 'john.doe@example.com',
    name: 'John Doe',
    username: 'johndoe',
    role: 'standard',
    provider: 'manual',
    status: 'active',
    createdAt: '2025-04-05T13:15:00Z',
    lastLogin: '2025-10-14T12:00:00Z',
  },
];

export const [UserManagementProvider, useUserManagement] = createContextHook(() => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const stored = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsedUsers = JSON.parse(stored);
        console.log('[UserManagement] Loaded users from storage:', parsedUsers.length);
        setUsers(parsedUsers);
      } else {
        console.log('[UserManagement] No stored users, using mock data');
        setUsers(mockManagedUsers);
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockManagedUsers));
      }
    } catch (error) {
      console.error('[UserManagement] Failed to load users:', error);
      setUsers(mockManagedUsers);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUsers = async (updatedUsers: ManagedUser[]) => {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      console.log('[UserManagement] Users saved successfully');
    } catch (error) {
      console.error('[UserManagement] Failed to save users:', error);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const updatedUsers = users.map((user) =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'disabled' as UserStatus : 'active' as UserStatus }
        : user
    );
    await saveUsers(updatedUsers);
  };

  const deleteUser = async (userId: string) => {
    const updatedUsers = users.filter((user) => user.id !== userId);
    await saveUsers(updatedUsers);
  };

  const updateUser = async (userId: string, updates: Partial<ManagedUser>) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, ...updates } : user
    );
    await saveUsers(updatedUsers);
  };

  const addUser = async (userData: Omit<ManagedUser, 'id' | 'createdAt'>) => {
    const newUser: ManagedUser = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
  };

  const getUserById = (userId: string): ManagedUser | undefined => {
    return users.find((user) => user.id === userId);
  };

  const getUsersByRole = (role: 'standard' | 'admin'): ManagedUser[] => {
    return users.filter((user) => user.role === role);
  };

  const getUsersByStatus = (status: UserStatus): ManagedUser[] => {
    return users.filter((user) => user.status === status);
  };

  const searchUsers = (query: string): ManagedUser[] => {
    const lowerQuery = query.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery) ||
        user.username?.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    users,
    isLoading,
    toggleUserStatus,
    deleteUser,
    updateUser,
    addUser,
    getUserById,
    getUsersByRole,
    getUsersByStatus,
    searchUsers,
  };
});
