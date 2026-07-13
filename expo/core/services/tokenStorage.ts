import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStoreModule from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const ID_TOKEN_KEY = 'auth_id_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

function getStore() {
  if (Platform.OS === 'web') return null;
  return SecureStoreModule;
}

async function setItem(key: string, value: string): Promise<void> {
  const store = getStore();
  if (store) await store.setItemAsync(key, value);
  else await AsyncStorage.setItem(key, value);
}

async function getItem(key: string): Promise<string | null> {
  const store = getStore();
  if (store) return store.getItemAsync(key);
  return AsyncStorage.getItem(key);
}

async function removeItem(key: string): Promise<void> {
  const store = getStore();
  if (store) await store.deleteItemAsync(key);
  else await AsyncStorage.removeItem(key);
}

/**
 * Persists a Keycloak token response. refreshToken/idToken are only
 * overwritten when present so a refresh response that omits them keeps the
 * previous values.
 */
export async function saveKeycloakSession(session: {
  accessToken: string;
  refreshToken?: string | null;
  idToken?: string | null;
  expiresAtMs?: number | null;
}): Promise<void> {
  await setItem(ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) await setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  if (session.idToken) await setItem(ID_TOKEN_KEY, session.idToken);
  if (session.expiresAtMs) await setItem(TOKEN_EXPIRY_KEY, String(session.expiresAtMs));
}

export async function getIdToken(): Promise<string | null> {
  return getItem(ID_TOKEN_KEY);
}

/** Epoch millis when the stored access token expires, if known. */
export async function getTokenExpiry(): Promise<number | null> {
  const raw = await getItem(TOKEN_EXPIRY_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export async function saveTokens(accessToken: string, refreshToken: string | null): Promise<void> {
  if (refreshToken == null) {
    // No refresh token in the response (e.g. guest sessions) — never keep a stale one.
    await saveAccessToken(accessToken);
    return;
  }
  const store = getStore();
  if (store) {
    await store.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await store.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]);
  }
}

export async function saveAccessToken(accessToken: string): Promise<void> {
  const store = getStore();
  if (store) {
    await store.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await store.deleteItemAsync(REFRESH_TOKEN_KEY);
  } else {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  // Guest sessions replace any previous Keycloak session entirely.
  await removeItem(ID_TOKEN_KEY);
  await removeItem(TOKEN_EXPIRY_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  const store = getStore();
  if (store) {
    return store.getItemAsync(ACCESS_TOKEN_KEY);
  }
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  const store = getStore();
  if (store) {
    return store.getItemAsync(REFRESH_TOKEN_KEY);
  }
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  const store = getStore();
  if (store) {
    await store.deleteItemAsync(ACCESS_TOKEN_KEY);
    await store.deleteItemAsync(REFRESH_TOKEN_KEY);
    await store.deleteItemAsync(ID_TOKEN_KEY);
    await store.deleteItemAsync(TOKEN_EXPIRY_KEY);
  } else {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      ID_TOKEN_KEY,
      TOKEN_EXPIRY_KEY,
    ]);
  }
}
