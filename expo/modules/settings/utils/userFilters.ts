import type {ManagedUser} from '@core/contexts/UserManagementContext';

export type RoleFilter = 'all' | 'admin' | 'standard' | 'guest';
export type StatusFilter = 'all' | 'active' | 'disabled' | 'deactivated';

export const DEFAULT_STATUS_FILTER: StatusFilter = 'active';

export interface UserFilterOptions {
  search: string;
  role: RoleFilter;
  status: StatusFilter;
}

export function filterUsers(users: ManagedUser[], options: UserFilterOptions): ManagedUser[] {
  let filtered = users;

  if (options.search) {
    const query = options.search.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query),
    );
  }

  if (options.role !== 'all') {
    filtered = filtered.filter((user) => user.role === options.role);
  }

  if (options.status !== 'all') {
    filtered = filtered.filter((user) => user.status === options.status);
  }

  return filtered;
}
