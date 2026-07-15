import createContextHook from '@nkzw/create-context-hook';
import {useState} from 'react';
import {User, UserRole} from './AuthContext';
import type {UserSummary} from '@core/services/adminUsers';
import * as adminUsersApi from '@core/services/adminUsers';

export type UserStatus = 'active' | 'disabled' | 'deactivated';

export interface ManagedUser extends User {
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
}

function mapToManagedUser(s: UserSummary): ManagedUser {
  return {
    id: s.userId,
    email: s.email,
    name: s.displayName,
    username: s.username,
    role: s.role.toLowerCase() as UserRole,
    provider: (s.providers?.[0]?.toLowerCase() ?? 'manual') as User['provider'],
    // The admin list summary carries no permission/tab detail — permissions
    // are managed in Keycloak (composite realm roles).
    permissions: [],
    navigationTabs: [],
    status: s.status.toLowerCase() as UserStatus,
    createdAt: s.createdAt ?? new Date().toISOString(),
    lastLogin: s.lastLoginAt,
  };
}

export const [UserManagementProvider, useUserManagement] = createContextHook(() => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // User-type roles defined in Keycloak — new types appear here without app changes.
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  const loadUsers = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await adminUsersApi.listUsers();
      setUsers((result?.users ?? []).map(mapToManagedUser));
    } catch (error) {
      console.error('[UserManagement] Failed to load users:', error);
      setLoadError('Could not reach the backend. Check that the server is running.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableRoles = async () => {
    try {
      const result = await adminUsersApi.listAssignableRoles();
      setAvailableRoles(result?.roles ?? []);
    } catch (error) {
      console.error('[UserManagement] Failed to load roles:', error);
      setAvailableRoles(['ADMIN', 'STANDARD', 'GUEST']);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'DISABLED' : 'ACTIVE';
    try {
      const updated = await adminUsersApi.updateUser(userId, { status: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? mapToManagedUser(updated) : u)));
    } catch (error) {
      console.error('[UserManagement] Failed to toggle user status:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await adminUsersApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('[UserManagement] Failed to delete user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<ManagedUser>) => {
    const body: { role?: string; status?: 'ACTIVE' | 'DISABLED' } = {};
    if (updates.role) body.role = updates.role.toUpperCase();
    if (updates.status) body.status = updates.status.toUpperCase() as 'ACTIVE' | 'DISABLED';
    try {
      const updated = await adminUsersApi.updateUser(userId, body);
      setUsers((prev) => prev.map((u) => (u.id === userId ? mapToManagedUser(updated) : u)));
    } catch (error) {
      console.error('[UserManagement] Failed to update user:', error);
      throw error;
    }
  };

  const addUser = async (userData: { email: string; displayName: string; temporaryPassword: string; role?: string }) => {
    const created = await adminUsersApi.createUser({
      email: userData.email,
      displayName: userData.displayName,
      temporaryPassword: userData.temporaryPassword,
      role: userData.role ?? 'STANDARD',
    });
    setUsers((prev) => [...prev, mapToManagedUser(created)]);
  };

  const getUserById = (userId: string): ManagedUser | undefined => {
    return users.find((user) => user.id === userId);
  };

  const getUsersByRole = (role: UserRole): ManagedUser[] => {
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
        user.username?.toLowerCase().includes(lowerQuery),
    );
  };

  return {
    users,
    isLoading,
    loadError,
    availableRoles,
    loadUsers,
    loadAvailableRoles,
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
