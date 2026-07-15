import {apiFetch} from './api';

// Role → permission mapping is managed in Keycloak (composite realm roles),
// so roles are plain strings here: new user types (e.g. GOLD) created in the
// Keycloak admin console work without app changes.

export interface UserSummary {
  userId: string;
  email: string;
  displayName: string;
  username?: string;
  providers?: string[];
  role: string;
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
  role?: string;
}): Promise<UserSummary> {
  return apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(body) });
}

export function updateUser(
  userId: string,
  body: { role?: string; status?: 'ACTIVE' | 'DISABLED' },
): Promise<UserSummary> {
  return apiFetch(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteUser(userId: string): Promise<void> {
  return apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
}

/** User-type roles defined in Keycloak (composite realm roles). */
export function listAssignableRoles(): Promise<{roles: string[]}> {
  return apiFetch('/api/admin/roles');
}
