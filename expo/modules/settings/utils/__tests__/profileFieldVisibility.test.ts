import {getVisibleProfileFields, type ProfileFieldKey,} from '../profileFieldVisibility';

const ALL_FIELDS: ProfileFieldKey[] = [
  'profilePicture',
  'username',
  'email',
  'role',
  'provider',
  'language',
];

const BACKEND_ALL_VISIBLE = {
  PROFILE_PICTURE: true,
  USERNAME: true,
  EMAIL: true,
  ROLE: true,
  PROVIDER: true,
  LANGUAGE: true,
};

describe('getVisibleProfileFields', () => {
  it('maps the backend field map onto camelCase keys', () => {
    const visible = getVisibleProfileFields(BACKEND_ALL_VISIBLE, 'standard');
    expect([...visible].sort()).toEqual([...ALL_FIELDS].sort());
  });

  it('only includes fields the backend marked visible', () => {
    const visible = getVisibleProfileFields(
      { ...BACKEND_ALL_VISIBLE, EMAIL: false, ROLE: false },
      'standard',
    );
    expect(visible.has('email')).toBe(false);
    expect(visible.has('role')).toBe(false);
    expect(visible.has('username')).toBe(true);
  });

  it('ignores unknown backend fields', () => {
    const visible = getVisibleProfileFields({ NICKNAME: true, EMAIL: true } as never, 'standard');
    expect([...visible]).toEqual(['email']);
  });

  it('falls back to role defaults when the map is missing (guest sees nothing)', () => {
    expect(getVisibleProfileFields(undefined, 'guest').size).toBe(0);
    expect(getVisibleProfileFields(undefined, undefined).size).toBe(0);
  });

  it('falls back to everything-visible for non-guest roles when the map is missing', () => {
    // Mirrors the backend default: only guests are restricted by default, so
    // a type created later in Keycloak sees everything until configured.
    const admin = getVisibleProfileFields(undefined, 'admin');
    expect([...admin].sort()).toEqual([...ALL_FIELDS].sort());
    const gold = getVisibleProfileFields(undefined, 'gold');
    expect([...gold].sort()).toEqual([...ALL_FIELDS].sort());
  });

  it('respects an explicit backend map for guests', () => {
    const visible = getVisibleProfileFields({ LANGUAGE: true }, 'guest');
    expect([...visible]).toEqual(['language']);
  });
});
