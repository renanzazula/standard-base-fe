import {
  DEFAULT_PROFILE_FIELDS_CONFIG,
  getVisibleProfileFields,
  mapProfileFieldVisibility,
  type ProfileFieldKey,
} from '../profileFieldVisibility';

const ALL_FIELDS: ProfileFieldKey[] = [
  'profilePicture',
  'username',
  'email',
  'role',
  'provider',
  'language',
];

const BACKEND_DEFAULT_MAP = {
  ADMIN: {
    PROFILE_PICTURE: true,
    USERNAME: true,
    EMAIL: true,
    ROLE: true,
    PROVIDER: true,
    LANGUAGE: true,
  },
  STANDARD: {
    PROFILE_PICTURE: true,
    USERNAME: true,
    EMAIL: true,
    ROLE: true,
    PROVIDER: true,
    LANGUAGE: true,
  },
  GUEST: {
    PROFILE_PICTURE: false,
    USERNAME: false,
    EMAIL: false,
    ROLE: false,
    PROVIDER: false,
    LANGUAGE: false,
  },
} as const;

describe('mapProfileFieldVisibility', () => {
  it('returns the defaults when the backend map is missing', () => {
    expect(mapProfileFieldVisibility(undefined)).toEqual(DEFAULT_PROFILE_FIELDS_CONFIG);
  });

  it('maps the backend default map onto camelCase keys', () => {
    expect(mapProfileFieldVisibility(BACKEND_DEFAULT_MAP)).toEqual(DEFAULT_PROFILE_FIELDS_CONFIG);
  });

  it('merges a partial backend map over the defaults', () => {
    const config = mapProfileFieldVisibility({ GUEST: { EMAIL: true } });

    expect(config.guest.email).toBe(true);
    expect(config.guest.username).toBe(false);
    expect(config.admin).toEqual(DEFAULT_PROFILE_FIELDS_CONFIG.admin);
    expect(config.standard).toEqual(DEFAULT_PROFILE_FIELDS_CONFIG.standard);
  });

  it('accepts dynamic roles and ignores unknown fields', () => {
    // Roles are defined in Keycloak — a type created there (e.g. GOLD) must
    // flow through with the all-visible baseline plus its overrides.
    const config = mapProfileFieldVisibility({
      GOLD: { EMAIL: false },
      GUEST: { NICKNAME: true, LANGUAGE: true },
    } as never);

    expect(config).toEqual({
      ...DEFAULT_PROFILE_FIELDS_CONFIG,
      gold: { ...DEFAULT_PROFILE_FIELDS_CONFIG.standard, email: false },
      guest: { ...DEFAULT_PROFILE_FIELDS_CONFIG.guest, language: true },
    });
  });
});

describe('getVisibleProfileFields', () => {
  it('shows all fields to admins with the default config', () => {
    const visible = getVisibleProfileFields(DEFAULT_PROFILE_FIELDS_CONFIG, 'admin');
    expect([...visible].sort()).toEqual([...ALL_FIELDS].sort());
  });

  it('shows all fields to standard users with the default config', () => {
    const visible = getVisibleProfileFields(DEFAULT_PROFILE_FIELDS_CONFIG, 'standard');
    expect([...visible].sort()).toEqual([...ALL_FIELDS].sort());
  });

  it('shows nothing to guests with the default config', () => {
    expect(getVisibleProfileFields(DEFAULT_PROFILE_FIELDS_CONFIG, 'guest').size).toBe(0);
  });

  it('treats a missing role as guest and an unknown role as unrestricted', () => {
    expect(getVisibleProfileFields(DEFAULT_PROFILE_FIELDS_CONFIG, undefined).size).toBe(0);
    // Mirrors the backend default: only guests are restricted by default, so
    // a type created later in Keycloak sees everything until configured.
    const unknownRole = getVisibleProfileFields(DEFAULT_PROFILE_FIELDS_CONFIG, 'gold');
    expect([...unknownRole].sort()).toEqual([...ALL_FIELDS].sort());
  });

  it('reflects per-field overrides', () => {
    const config = mapProfileFieldVisibility({
      STANDARD: { EMAIL: false },
      GUEST: { LANGUAGE: true },
    });

    const standard = getVisibleProfileFields(config, 'standard');
    expect(standard.has('email')).toBe(false);
    expect(standard.has('username')).toBe(true);

    const guest = getVisibleProfileFields(config, 'guest');
    expect([...guest]).toEqual(['language']);
  });
});
