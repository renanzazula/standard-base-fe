import {apiFetch} from './api';

export interface PermissionOverride {
  permission: string;
  granted: boolean;
}

export interface UserPermissionsResponse {
  userId: string;
  effectivePermissions: string[];
  roleDefaults: string[];
  overrides: PermissionOverride[];
}

export type AdminRole = 'STANDARD' | 'ADMIN' | 'GUEST';

export interface UserSummary {
  userId: string;
  email: string;
  displayName: string;
  username?: string;
  providers?: string[];
  role: AdminRole;
  status: 'ACTIVE' | 'DISABLED' | 'DEACTIVATED';
  createdAt?: string;
  lastLoginAt?: string;
}

export interface UserListResponse {
  users: UserSummary[];
  total: number;
}

export function listUsers(params?: {
  role?: string;
  status?: string;
  search?: string;
}): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString() ? `?${query}` : '';
  return apiFetch(`/api/admin/users${qs}`);
}

export function createUser(body: {
  email: string;
  displayName: string;
  temporaryPassword: string;
  role?: AdminRole;
}): Promise<UserSummary> {
  return apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(body) });
}

export function updateUser(
  userId: string,
  body: { role?: AdminRole; status?: 'ACTIVE' | 'DISABLED' },
): Promise<UserSummary> {
  return apiFetch(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteUser(userId: string): Promise<void> {
  return apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
}

export function getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
  return apiFetch(`/api/admin/users/${userId}/permissions`);
}

export function updateUserPermissions(
  userId: string,
  overrides: PermissionOverride[],
): Promise<UserPermissionsResponse> {
  return apiFetch(`/api/admin/users/${userId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ overrides }),
  });
}

export interface RolePermissionsResponse {
  role: string;
  permissions: string[];
}

export function getRolePermissions(): Promise<RolePermissionsResponse[]> {
  return apiFetch('/api/admin/permissions');
}

export function updateRolePermissions(
  role: string,
  permissions: string[],
): Promise<RolePermissionsResponse> {
  return apiFetch(`/api/admin/permissions/${role}`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
}
