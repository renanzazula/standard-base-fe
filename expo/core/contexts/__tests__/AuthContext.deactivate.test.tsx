import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react-native';
import {AuthProvider, useAuth} from '../AuthContext';
import * as userProfileApi from '@core/services/userProfile';
import * as keycloakAuth from '@core/services/keycloakAuth';
import * as tokenStorage from '@core/services/tokenStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@core/contexts/AdminConfigContext', () => ({
  useAdminConfig: () => ({
    config: {},
    reloadTabConfig: jest.fn(),
  }),
}));

jest.mock('@core/services/auth', () => ({
  guestLogin: jest.fn(),
  getCurrentUser: jest.fn(),
}));

jest.mock('@core/services/keycloakAuth', () => ({
  signIn: jest.fn(),
  refresh: jest.fn(),
  signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('@core/services/userProfile', () => ({
  deactivateAccount: jest.fn(),
  updateProfile: jest.fn(),
  uploadAvatar: jest.fn(),
}));

jest.mock('@core/services/tokenStorage', () => ({
  saveTokens: jest.fn(),
  saveAccessToken: jest.fn(),
  saveKeycloakSession: jest.fn(),
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  getIdToken: jest.fn(),
  getTokenExpiry: jest.fn(),
  clearTokens: jest.fn(),
}));

jest.mock('@core/services/api', () => ({
  setOnAuthExpired: jest.fn(),
}));

jest.mock('@core/services/imageCache', () => ({
  clearImageCacheScope: jest.fn(() => Promise.resolve()),
  userScope: (id: string) => `u:test:${id}`,
}));

const mockedProfileApi = userProfileApi as jest.Mocked<typeof userProfileApi>;
const mockedKeycloakAuth = keycloakAuth as jest.Mocked<typeof keycloakAuth>;
const mockedTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

function setup() {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
  return renderHook(() => useAuth(), { wrapper });
}

describe('AuthContext.deactivateAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTokenStorage.getAccessToken.mockResolvedValue(null);
    mockedTokenStorage.clearTokens.mockResolvedValue(undefined);
    mockedKeycloakAuth.signOut.mockResolvedValue(undefined);
  });

  it('calls the service and tears down the local session on success', async () => {
    mockedProfileApi.deactivateAccount.mockResolvedValue({ success: true, message: 'ok' });
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deactivateAccount();
    });

    expect(mockedProfileApi.deactivateAccount).toHaveBeenCalled();
    // Logout also ends the Keycloak SSO session (which clears local tokens).
    expect(mockedKeycloakAuth.signOut).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('rethrows on failure and does not touch the session', async () => {
    mockedProfileApi.deactivateAccount.mockRejectedValue(new Error('Request failed'));
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let thrown: unknown;
    await act(async () => {
      thrown = await result.current.deactivateAccount().then(
        () => undefined,
        (error) => error,
      );
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(mockedKeycloakAuth.signOut).not.toHaveBeenCalled();
    expect(mockedTokenStorage.clearTokens).not.toHaveBeenCalled();
  });
});
