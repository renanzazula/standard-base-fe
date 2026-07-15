import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { UserManagementProvider, useUserManagement } from '../UserManagementContext';
import * as adminUsersApi from '@core/services/adminUsers';
import type { UserSummary } from '@core/services/adminUsers';

jest.mock('@core/services/adminUsers', () => ({
  listUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  listAssignableRoles: jest.fn(),
}));

const mockedApi = adminUsersApi as jest.Mocked<typeof adminUsersApi>;

const adminSummary: UserSummary = {
  userId: 'u1',
  email: 'admin@example.com',
  displayName: 'Admin',
  providers: ['email'],
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
};

const guestSummary: UserSummary = {
  userId: 'u2',
  email: 'guest@example.com',
  displayName: 'Guest',
  providers: ['email'],
  role: 'GUEST',
  status: 'ACTIVE',
  createdAt: '2026-01-02T00:00:00Z',
};

function setup() {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <UserManagementProvider>{children}</UserManagementProvider>
  );
  return renderHook(() => useUserManagement(), { wrapper });
}

describe('UserManagementContext', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedApi.listUsers.mockResolvedValue({ users: [adminSummary, guestSummary], total: 2 });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('maps a GUEST summary to the guest role', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.loadUsers();
    });

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[1].role).toBe('guest');
    expect(result.current.users[0].role).toBe('admin');
  });

  it('exposes the user-type roles defined in Keycloak', async () => {
    // A type created in the Keycloak console (GOLD) appears with no app changes.
    mockedApi.listAssignableRoles.mockResolvedValue({ roles: ['ADMIN', 'GOLD', 'GUEST', 'STANDARD'] });
    const { result } = setup();

    await act(async () => {
      await result.current.loadAvailableRoles();
    });

    expect(result.current.availableRoles).toEqual(['ADMIN', 'GOLD', 'GUEST', 'STANDARD']);
  });

  it('falls back to the built-in roles when the role list cannot be loaded', async () => {
    mockedApi.listAssignableRoles.mockRejectedValue(new Error('boom'));
    const { result } = setup();

    await act(async () => {
      await result.current.loadAvailableRoles();
    });

    expect(result.current.availableRoles).toEqual(['ADMIN', 'STANDARD', 'GUEST']);
  });

  it('removes the row when delete succeeds', async () => {
    mockedApi.deleteUser.mockResolvedValue(undefined);
    const { result } = setup();

    await act(async () => {
      await result.current.loadUsers();
    });
    await act(async () => {
      await result.current.deleteUser('u2');
    });

    expect(result.current.users.map((u) => u.id)).toEqual(['u1']);
  });

  it('rethrows when delete fails and leaves the list unchanged', async () => {
    mockedApi.deleteUser.mockRejectedValue(new Error('boom'));
    const { result } = setup();

    await act(async () => {
      await result.current.loadUsers();
    });

    let thrown: unknown;
    await act(async () => {
      thrown = await result.current.deleteUser('u2').then(
        () => undefined,
        (error) => error,
      );
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(result.current.users.map((u) => u.id)).toEqual(['u1', 'u2']);
  });
});
