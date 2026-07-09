import type {ManagedUser} from '@core/contexts/UserManagementContext';
import {DEFAULT_STATUS_FILTER, filterUsers} from '../userFilters';

function makeUser(overrides: Partial<ManagedUser>): ManagedUser {
  return {
    id: 'id',
    email: 'user@example.com',
    name: 'User',
    role: 'standard',
    provider: 'manual',
    permissions: [],
    navigationTabs: [],
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as ManagedUser;
}

const admin = makeUser({ id: '1', name: 'Alice Admin', email: 'alice@example.com', role: 'admin' });
const standard = makeUser({ id: '2', name: 'Bob Standard', email: 'bob@example.com', username: 'bobby' });
const guest = makeUser({ id: '3', name: 'Gina Guest', email: 'gina@example.com', role: 'guest' });
const disabled = makeUser({ id: '4', name: 'Dan Disabled', email: 'dan@example.com', status: 'disabled' });

const users = [admin, standard, guest, disabled];

describe('userFilters', () => {
  it('defaults the status filter to active', () => {
    expect(DEFAULT_STATUS_FILTER).toBe('active');
  });

  it('filters out disabled users with the default status filter', () => {
    const result = filterUsers(users, { search: '', role: 'all', status: DEFAULT_STATUS_FILTER });
    expect(result).toEqual([admin, standard, guest]);
  });

  it('guest role filter matches only guests', () => {
    const result = filterUsers(users, { search: '', role: 'guest', status: 'all' });
    expect(result).toEqual([guest]);
  });

  it('combines status and role filters', () => {
    expect(filterUsers(users, { search: '', role: 'standard', status: 'disabled' })).toEqual([disabled]);
    expect(filterUsers(users, { search: '', role: 'standard', status: 'active' })).toEqual([standard]);
  });

  it('matches search against name, email, and username', () => {
    expect(filterUsers(users, { search: 'alice', role: 'all', status: 'all' })).toEqual([admin]);
    expect(filterUsers(users, { search: 'gina@', role: 'all', status: 'all' })).toEqual([guest]);
    expect(filterUsers(users, { search: 'BOBBY', role: 'all', status: 'all' })).toEqual([standard]);
  });

  it('combines search with role and status filters', () => {
    expect(filterUsers(users, { search: 'example.com', role: 'guest', status: 'active' })).toEqual([guest]);
    expect(filterUsers(users, { search: 'alice', role: 'standard', status: 'all' })).toEqual([]);
  });

  it("passes everything through with 'all' filters and empty search", () => {
    expect(filterUsers(users, { search: '', role: 'all', status: 'all' })).toEqual(users);
  });
});
