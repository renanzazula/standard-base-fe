import React from 'react';
import { render } from '@testing-library/react-native';
import { ProfileInfoCard } from '../ProfileInfoCard';
import {
  DEFAULT_PROFILE_FIELDS_CONFIG,
  getVisibleProfileFields,
  mapProfileFieldVisibility,
} from '../../utils/profileFieldVisibility';
import type { User } from '@core/contexts/AuthContext';

jest.mock('@core/contexts/PreferencesContext', () => ({
  usePreferences: () => ({
    colors: {
      card: '#fff',
      border: '#ddd',
      primary: '#007aff',
      text: '#000',
      textSecondary: '#666',
      surface: '#f5f5f5',
      onAccent: '#fff',
    },
  }),
}));

jest.mock('@shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@shared/components/CachedImage', () => ({
  CachedImage: () => null,
}));

jest.mock('@core/services/imageCache', () => ({
  userScope: (id: string) => `u:test:${id}`,
}));

const FIELD_TEST_IDS = [
  'profile-field-username',
  'profile-field-email',
  'profile-field-role',
  'profile-field-provider',
  'profile-field-language',
];

function makeUser(role: User['role']): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    role,
    provider: role === 'guest' ? 'guest' : 'manual',
    username: 'testuser',
    permissions: [],
    navigationTabs: [],
  };
}

function renderCard(role: User['role'], config = DEFAULT_PROFILE_FIELDS_CONFIG) {
  const user = makeUser(role);
  return render(
    <ProfileInfoCard
      user={user}
      visibleFields={getVisibleProfileFields(config, role)}
      isGuest={role === 'guest'}
      language="en"
      onAvatarPress={jest.fn()}
      onEditUsername={jest.fn()}
      onLanguagePress={jest.fn()}
    />,
  );
}

describe('ProfileInfoCard', () => {
  it('shows every profile field to admins by default', () => {
    const { getByTestId } = renderCard('admin');

    FIELD_TEST_IDS.forEach((testID) => expect(getByTestId(testID)).toBeTruthy());
    expect(getByTestId('profile-avatar-button')).toBeTruthy();
    expect(getByTestId('edit-username-button')).toBeTruthy();
  });

  it('shows every profile field to standard users by default', () => {
    const { getByTestId } = renderCard('standard');

    FIELD_TEST_IDS.forEach((testID) => expect(getByTestId(testID)).toBeTruthy());
    expect(getByTestId('edit-username-button')).toBeTruthy();
  });

  it('renders nothing for guests by default', () => {
    const { queryByTestId } = renderCard('guest');

    expect(queryByTestId('profile-info-card')).toBeNull();
    FIELD_TEST_IDS.forEach((testID) => expect(queryByTestId(testID)).toBeNull());
  });

  it('renders only the fields enabled by the config', () => {
    const config = mapProfileFieldVisibility({
      STANDARD: {
        PROFILE_PICTURE: false,
        USERNAME: false,
        ROLE: false,
        PROVIDER: false,
        LANGUAGE: false,
        EMAIL: true,
      },
    });

    const { queryByTestId, getByTestId } = renderCard('standard', config);

    expect(getByTestId('profile-field-email')).toBeTruthy();
    expect(queryByTestId('profile-field-username')).toBeNull();
    expect(queryByTestId('profile-field-role')).toBeNull();
    expect(queryByTestId('profile-field-provider')).toBeNull();
    expect(queryByTestId('profile-field-language')).toBeNull();
  });

  it('never shows edit affordances to guests even when fields are visible', () => {
    const config = mapProfileFieldVisibility({
      GUEST: { USERNAME: true, PROFILE_PICTURE: true },
    });

    const { getByTestId, queryByTestId } = renderCard('guest', config);

    expect(getByTestId('profile-field-username')).toBeTruthy();
    expect(queryByTestId('edit-username-button')).toBeNull();
    expect(getByTestId('profile-avatar-button').props.accessibilityState?.disabled).toBe(true);
  });
});
