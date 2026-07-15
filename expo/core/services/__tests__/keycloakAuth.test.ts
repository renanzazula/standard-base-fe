import * as tokenStorage from '@core/services/tokenStorage';
import * as WebBrowser from 'expo-web-browser';
import {
    isAccountNotSetUp,
    isInvalidCredentials,
    KeycloakAuthError,
    openPasswordReset,
    register,
    signInWithPassword,
} from '../keycloakAuth';

jest.mock('expo-auth-session', () => {
  const promptAsync = jest.fn();
  return {
    __mockPromptAsync: promptAsync,
    makeRedirectUri: jest.fn(() => 'skateboardpodcast://auth/callback'),
    exchangeCodeAsync: jest.fn(),
    refreshAsync: jest.fn(),
    ResponseType: { Code: 'code' },
    AuthRequest: jest.fn().mockImplementation(() => ({
      promptAsync,
      codeVerifier: 'test-verifier',
    })),
  };
});

const { __mockPromptAsync: mockPromptAsync } = jest.requireMock('expo-auth-session') as {
  __mockPromptAsync: jest.Mock;
};

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'opened' })),
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'dismiss' })),
}));

jest.mock('@core/services/tokenStorage', () => ({
  saveKeycloakSession: jest.fn(() => Promise.resolve()),
  getRefreshToken: jest.fn(),
  getIdToken: jest.fn(),
  clearTokens: jest.fn(() => Promise.resolve()),
}));

const mockedTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;
const mockedWebBrowser = WebBrowser as jest.Mocked<typeof WebBrowser>;

function mockTokenEndpoint(status: number, body: Record<string, unknown>) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
  global.fetch = jest.fn(() => Promise.resolve(response)) as unknown as typeof fetch;
  return global.fetch as jest.Mock;
}

describe('signInWithPassword (Direct Access Grant)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts a password grant to the token endpoint and persists the session', async () => {
    const fetchMock = mockTokenEndpoint(200, {
      access_token: 'at',
      refresh_token: 'rt',
      id_token: 'idt',
      expires_in: 300,
    });
    const before = Date.now();

    await signInWithPassword('user@example.com', 'password123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/realms/skateboard-podcast/protocol/openid-connect/token');
    const body = new URLSearchParams(init.body as string);
    expect(body.get('grant_type')).toBe('password');
    expect(body.get('username')).toBe('user@example.com');
    expect(body.get('password')).toBe('password123');
    expect(body.get('scope')).toBe('openid profile email');

    expect(mockedTokenStorage.saveKeycloakSession).toHaveBeenCalledTimes(1);
    const saved = mockedTokenStorage.saveKeycloakSession.mock.calls[0][0];
    expect(saved.accessToken).toBe('at');
    expect(saved.refreshToken).toBe('rt');
    expect(saved.idToken).toBe('idt');
    expect(saved.expiresAtMs).toBeGreaterThanOrEqual(before + 300_000);
  });

  it('throws a classified KeycloakAuthError for wrong credentials', async () => {
    mockTokenEndpoint(401, {
      error: 'invalid_grant',
      error_description: 'Invalid user credentials',
    });

    const thrown = await signInWithPassword('user@example.com', 'nope').then(
      () => undefined,
      (error) => error,
    );

    expect(thrown).toBeInstanceOf(KeycloakAuthError);
    expect(isInvalidCredentials(thrown)).toBe(true);
    expect(isAccountNotSetUp(thrown)).toBe(false);
    expect(mockedTokenStorage.saveKeycloakSession).not.toHaveBeenCalled();
  });

  it('does not report config errors as invalid credentials (direct grants disabled)', async () => {
    mockTokenEndpoint(400, {
      error: 'unauthorized_client',
      error_description: 'Client not allowed for direct access grants',
    });

    const thrown = await signInWithPassword('user@example.com', 'password123').then(
      () => undefined,
      (error) => error,
    );

    expect(thrown).toBeInstanceOf(KeycloakAuthError);
    expect(isInvalidCredentials(thrown)).toBe(false);
    expect((thrown as KeycloakAuthError).message).toBe('Client not allowed for direct access grants');
  });

  it('classifies accounts with pending required actions separately', async () => {
    mockTokenEndpoint(400, {
      error: 'invalid_grant',
      error_description: 'Account is not fully set up',
    });

    const thrown = await signInWithPassword('user@example.com', 'password123').then(
      () => undefined,
      (error) => error,
    );

    expect(isAccountNotSetUp(thrown)).toBe(true);
    expect(isInvalidCredentials(thrown)).toBe(false);
  });
});

describe('register (hosted registration page)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('runs the code flow against the registrations endpoint and returns false on dismiss', async () => {
    mockPromptAsync.mockResolvedValue({ type: 'dismiss' });

    await expect(register()).resolves.toBe(false);

    const discovery = mockPromptAsync.mock.calls[0][0];
    expect(discovery.authorizationEndpoint).toContain('/protocol/openid-connect/registrations');
  });
});

describe('openPasswordReset', () => {
  it('opens the hosted reset-credentials page for this client', async () => {
    await openPasswordReset();

    expect(mockedWebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      expect.stringContaining('/login-actions/reset-credentials?client_id=skateboard-podcast-fe'),
    );
  });
});
