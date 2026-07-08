import type { BackendProfileField, BackendRole, ProfileFieldVisibilityMap } from '@core/services/adminConfig';

export type ProfileFieldKey =
  | 'profilePicture'
  | 'username'
  | 'email'
  | 'role'
  | 'provider'
  | 'language';

export type ProfileRole = 'admin' | 'standard' | 'guest';

export type ProfileFieldsConfig = Record<ProfileRole, Record<ProfileFieldKey, boolean>>;

const FIELD_KEY_MAP: Record<BackendProfileField, ProfileFieldKey> = {
  PROFILE_PICTURE: 'profilePicture',
  USERNAME: 'username',
  EMAIL: 'email',
  ROLE: 'role',
  PROVIDER: 'provider',
  LANGUAGE: 'language',
};

const ROLE_KEY_MAP: Record<BackendRole, ProfileRole> = {
  ADMIN: 'admin',
  STANDARD: 'standard',
  GUEST: 'guest',
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

/** Mirrors the backend defaults: ADMIN/STANDARD see everything, GUEST sees nothing. */
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
    const role = ROLE_KEY_MAP[backendRole as BackendRole];
    if (!role || !fields) continue;
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
  // Unknown/missing roles get the most restrictive treatment (guest).
  const roleKey: ProfileRole =
    role === 'admin' || role === 'standard' || role === 'guest' ? role : 'guest';
  const fields = config[roleKey] ?? DEFAULT_PROFILE_FIELDS_CONFIG[roleKey];
  return new Set(
    (Object.keys(fields) as ProfileFieldKey[]).filter((key) => fields[key]),
  );
}
