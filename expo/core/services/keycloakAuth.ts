import {
    AuthRequest,
    type DiscoveryDocument,
    exchangeCodeAsync,
    makeRedirectUri,
    refreshAsync,
    ResponseType,
    type TokenResponse
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {ENV} from '@core/config/env';
import * as tokenStorage from './tokenStorage';

// Required on web: completes the popup-based auth session when the
// redirect page loads back into the app bundle.
WebBrowser.maybeCompleteAuthSession();

const REALM_URL = `${ENV.KEYCLOAK_URL}/realms/${ENV.KEYCLOAK_REALM}`;
const OIDC_BASE = `${REALM_URL}/protocol/openid-connect`;

// Static discovery (instead of a network fetch of .well-known) so sign-in,
// refresh and logout work imperatively outside React hooks.
const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${OIDC_BASE}/auth`,
  tokenEndpoint: `${OIDC_BASE}/token`,
  endSessionEndpoint: `${OIDC_BASE}/logout`,
  revocationEndpoint: `${OIDC_BASE}/revoke`,
  userInfoEndpoint: `${OIDC_BASE}/userinfo`,
};

// Native: skateboardpodcast://auth/callback (allowed by +native-intent.tsx;
// scheme must match app.json). Web: <origin>/auth/callback — must be covered
// by the Keycloak client's redirectUris/webOrigins.
const redirectUri = makeRedirectUri({ scheme: 'skateboardpodcast', path: 'auth/callback' });

const SCOPES = ['openid', 'profile', 'email'];

/**
 * Error returned by Keycloak's token endpoint (e.g. invalid_grant for wrong
 * credentials, a disabled account, or an account with pending required
 * actions). `error` is the OAuth error code, `description` Keycloak's
 * error_description.
 */
export class KeycloakAuthError extends Error {
  error: string;
  description?: string;

  constructor(error: string, description?: string) {
    super(description ?? error);
    this.name = 'KeycloakAuthError';
    this.error = error;
    this.description = description;
  }
}

/** True when the account exists but has required actions pending (verify email, update password, …) — Direct Grant cannot complete those. */
export function isAccountNotSetUp(e: unknown): boolean {
  return e instanceof KeycloakAuthError &&
    e.error === 'invalid_grant' &&
    /not fully set up/i.test(e.description ?? '');
}

/**
 * True when Keycloak rejected the credentials themselves. Deliberately only
 * invalid_grant: other codes (unauthorized_client when Direct Access Grants
 * is disabled, invalid_request, …) are configuration problems and must
 * surface with their real message instead of "invalid email or password".
 */
export function isInvalidCredentials(e: unknown): boolean {
  return e instanceof KeycloakAuthError &&
    e.error === 'invalid_grant' &&
    !isAccountNotSetUp(e);
}

async function persistTokenResponse(response: TokenResponse): Promise<void> {
  const expiresAtMs = response.expiresIn
    ? (response.issuedAt + response.expiresIn) * 1000
    : null;
  await tokenStorage.saveKeycloakSession({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? null,
    idToken: response.idToken ?? null,
    expiresAtMs,
  });
}

/**
 * Signs in with credentials collected by the app's own login form, via
 * Keycloak's Direct Access Grant (resource-owner password) at the token
 * endpoint — no browser involved. The Keycloak client must have
 * "Direct access grants" enabled.
 *
 * Limitations inherent to this grant: accounts with pending required actions
 * (verify email, forced password update) or OTP cannot complete here — they
 * throw a KeycloakAuthError (see isAccountNotSetUp) and must finish setup on
 * the hosted page.
 *
 * @throws KeycloakAuthError when Keycloak rejects the request.
 */
export async function signInWithPassword(usernameOrEmail: string, password: string): Promise<void> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: ENV.KEYCLOAK_CLIENT_ID,
    username: usernameOrEmail,
    password,
    scope: SCOPES.join(' '),
  });
  const response = await fetch(`${OIDC_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new KeycloakAuthError(
      typeof data.error === 'string' ? data.error : `http_${response.status}`,
      typeof data.error_description === 'string' ? data.error_description : undefined,
    );
  }
  await tokenStorage.saveKeycloakSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    idToken: data.id_token ?? null,
    expiresAtMs: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
  });
}

/**
 * Runs the OIDC Authorization Code + PKCE flow in a browser sheet against the
 * given authorization endpoint. Must be called from a user gesture — web
 * popup blockers kill promptAsync otherwise.
 */
async function runAuthCodeFlow(
  authorizationEndpoint: string,
  extraParams?: Record<string, string>,
): Promise<boolean> {
  const request = new AuthRequest({
    clientId: ENV.KEYCLOAK_CLIENT_ID,
    redirectUri,
    scopes: SCOPES,
    responseType: ResponseType.Code,
    usePKCE: true,
    extraParams,
  });

  const result = await request.promptAsync({ ...discovery, authorizationEndpoint });
  if (result.type !== 'success' || !result.params.code) {
    if (result.type === 'error') {
      throw new Error(result.error?.message ?? 'Keycloak sign-in failed');
    }
    return false;
  }

  const tokens = await exchangeCodeAsync(
    {
      clientId: ENV.KEYCLOAK_CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    discovery,
  );
  await persistTokenResponse(tokens);
  return true;
}

/**
 * Browser-sheet sign-in against the Keycloak hosted login page. Used as the
 * engine for brokered identity providers: pass `idpHint` (the Keycloak IdP
 * alias, e.g. 'google') to skip the Keycloak page and land directly on the
 * provider. Without a hint it shows the full hosted login (fallback when the
 * in-app form is disabled).
 *
 * @returns true when tokens were obtained and stored; false when the user
 *          cancelled/dismissed the browser sheet.
 */
export async function signIn(options?: { idpHint?: string }): Promise<boolean> {
  const extraParams = options?.idpHint ? { kc_idp_hint: options.idpHint } : undefined;
  return runAuthCodeFlow(discovery.authorizationEndpoint!, extraParams);
}

/**
 * Opens Keycloak's hosted registration page (the OIDC `registrations`
 * endpoint) in a browser sheet; on completion the code exchange signs the
 * new user in. Requires "User registration" enabled on the realm.
 *
 * @returns true when the account was created and tokens stored; false when
 *          the user dismissed the sheet.
 */
export async function register(): Promise<boolean> {
  return runAuthCodeFlow(`${OIDC_BASE}/registrations`);
}

/**
 * Opens Keycloak's hosted "forgot password" page. Fire-and-forget: the reset
 * happens entirely on Keycloak (email link), the user comes back and signs in
 * with the new password.
 */
export async function openPasswordReset(): Promise<void> {
  await WebBrowser.openBrowserAsync(
    `${REALM_URL}/login-actions/reset-credentials?client_id=${encodeURIComponent(ENV.KEYCLOAK_CLIENT_ID)}`,
  );
}

/**
 * Exchanges the stored refresh token for a new token set directly against
 * Keycloak's token endpoint. Returns false when there is no refresh token
 * (guest sessions) or Keycloak rejects it (SSO session expired/revoked).
 */
export async function refresh(): Promise<boolean> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const tokens = await refreshAsync(
      { clientId: ENV.KEYCLOAK_CLIENT_ID, refreshToken },
      discovery,
    );
    await persistTokenResponse(tokens);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ends the Keycloak SSO session (so the next sign-in prompts for credentials)
 * and clears all locally stored tokens. The browser step is best-effort:
 * guest sessions have no id token and skip it entirely, and a blocked popup
 * must never prevent the local logout.
 */
export async function signOut(): Promise<void> {
  try {
    const idToken = await tokenStorage.getIdToken();
    if (idToken && discovery.endSessionEndpoint) {
      const url = `${discovery.endSessionEndpoint}` +
        `?id_token_hint=${encodeURIComponent(idToken)}` +
        `&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_id=${encodeURIComponent(ENV.KEYCLOAK_CLIENT_ID)}`;
      await WebBrowser.openAuthSessionAsync(url, redirectUri);
    }
  } catch (error) {
    console.warn('[KeycloakAuth] end-session redirect failed (continuing local logout):', error);
  } finally {
    await tokenStorage.clearTokens();
  }
}
