import type { BackendProfileField, ProfileFieldVisibilityMap } from '@core/services/adminConfig';

export type ProfileFieldKey =
  | 'profilePicture'
  | 'username'
  | 'email'
  | 'role'
  | 'provider'
  | 'language';

/**
 * Keyed by lowercased role name. Roles are dynamic (Keycloak composite realm
 * roles), so this is an open map — known defaults exist for admin/standard/
 * guest, and unknown roles fall back to everything-visible (mirroring the
 * backend: only guests are restricted by default).
 */
export type ProfileFieldsConfig = Record<string, Record<ProfileFieldKey, boolean>>;

const FIELD_KEY_MAP: Record<BackendProfileField, ProfileFieldKey> = {
  PROFILE_PICTURE: 'profilePicture',
  USERNAME: 'username',
  EMAIL: 'email',
  ROLE: 'role',
  PROVIDER: 'provider',
  LANGUAGE: 'language',
};

const ALL_VISIBLE: Record<ProfileFieldKey, boolean> = {
  profilePicture: true,
  username: true,
  email: true,
  role: true,
  provider: true,
  language: true,
};

const NONE_VISIBLE: Record<ProfileFieldKey, boolean> = {
  profilePicture: false,
  username: false,
  email: false,
  role: false,
  provider: false,
  language: false,
};

/** Mirrors the backend defaults: GUEST sees nothing, every other role sees everything. */
export const DEFAULT_PROFILE_FIELDS_CONFIG: ProfileFieldsConfig = {
  admin: { ...ALL_VISIBLE },
  standard: { ...ALL_VISIBLE },
  guest: { ...NONE_VISIBLE },
};

export function mapProfileFieldVisibility(
  raw: ProfileFieldVisibilityMap | undefined,
): ProfileFieldsConfig {
  const config: ProfileFieldsConfig = {
    admin: { ...DEFAULT_PROFILE_FIELDS_CONFIG.admin },
    standard: { ...DEFAULT_PROFILE_FIELDS_CONFIG.standard },
    guest: { ...DEFAULT_PROFILE_FIELDS_CONFIG.guest },
  };
  if (!raw) {
    return config;
  }
  for (const [backendRole, fields] of Object.entries(raw)) {
    if (!backendRole || !fields) continue;
    const role = backendRole.toLowerCase();
    config[role] = config[role]
      ?? { ...(role === 'guest' ? NONE_VISIBLE : ALL_VISIBLE) };
    for (const [backendField, visible] of Object.entries(fields)) {
      const field = FIELD_KEY_MAP[backendField as BackendProfileField];
      if (field && typeof visible === 'boolean') {
        config[role][field] = visible;
      }
    }
  }
  return config;
}

export function getVisibleProfileFields(
  config: ProfileFieldsConfig,
  role: string | undefined,
): Set<ProfileFieldKey> {
  const roleKey = role?.toLowerCase() ?? 'guest';
  // Unknown roles (types created later in Keycloak) mirror the backend
  // default: everything visible; only guests are restricted by default.
  const fields = config[roleKey]
    ?? (roleKey === 'guest' ? NONE_VISIBLE : ALL_VISIBLE);
  return new Set(
    (Object.keys(fields) as ProfileFieldKey[]).filter((key) => fields[key]),
  );
}
