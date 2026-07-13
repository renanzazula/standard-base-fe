import {AuthRequest, exchangeCodeAsync, makeRedirectUri, refreshAsync, ResponseType, type DiscoveryDocument, type TokenResponse} from 'expo-auth-session';
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

// Native: myapp://auth/callback (allowed by +native-intent.tsx).
// Web: <origin>/auth/callback — must be covered by the Keycloak client's
// redirectUris/webOrigins.
const redirectUri = makeRedirectUri({ scheme: 'myapp', path: 'auth/callback' });

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
 * Runs the OIDC Authorization Code + PKCE flow against the Keycloak hosted
 * login page (which also offers registration, password reset, and any
 * brokered social providers). Must be called from a user gesture — web popup
 * blockers kill promptAsync otherwise.
 *
 * @returns true when tokens were obtained and stored; false when the user
 *          cancelled/dismissed the browser sheet.
 */
export async function signIn(): Promise<boolean> {
  const request = new AuthRequest({
    clientId: ENV.KEYCLOAK_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);
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
