import { useAuth } from '@/contexts/AuthContext';
import type { Permission } from '@/constants/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const permissions: Permission[] = user?.permissions ?? [];

  const hasPermission = (key: Permission): boolean => permissions.includes(key);

  const hasAnyPermission = (keys: Permission[]): boolean =>
    keys.some((k) => permissions.includes(k));

  return { hasPermission, hasAnyPermission, permissions };
}
