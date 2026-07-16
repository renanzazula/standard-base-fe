import type {BackendProfileField} from '@core/services/adminConfig';

export type ProfileFieldKey =
  | 'profilePicture'
  | 'username'
  | 'email'
  | 'role'
  | 'provider'
  | 'language';

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

/**
 * Resolves the visible profile fields from the flat field→visible map that
 * /api/auth/me returns (already sliced to the user's role by the backend).
 * When the map is absent — guest sessions get their profile from the guest
 * login response, and older backends omit the field — fall back to the role
 * defaults, mirroring the backend: guests see nothing, every other role
 * (including types created later in Keycloak) sees everything.
 */
export function getVisibleProfileFields(
  visibility: Record<string, boolean> | undefined,
  role: string | undefined,
): Set<ProfileFieldKey> {
  if (!visibility || Object.keys(visibility).length === 0) {
    const roleKey = role?.toLowerCase() ?? 'guest';
    const defaults = roleKey === 'guest' ? NONE_VISIBLE : ALL_VISIBLE;
    return new Set(
      (Object.keys(defaults) as ProfileFieldKey[]).filter((key) => defaults[key]),
    );
  }
  const result = new Set<ProfileFieldKey>();
  for (const [backendField, visible] of Object.entries(visibility)) {
    const field = FIELD_KEY_MAP[backendField as BackendProfileField];
    if (field && visible === true) {
      result.add(field);
    }
  }
  return result;
}
