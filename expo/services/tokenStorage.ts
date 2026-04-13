import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@auth_access_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';

let SecureStore: typeof import('expo-secure-store') | null = null;

async function getStore() {
  if (Platform.OS === 'web') return null;
  if (!SecureStore) {
    SecureStore = await import('expo-secure-store');
  }
  return SecureStore;
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  const store = await getStore();
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

export async function getAccessToken(): Promise<string | null> {
  const store = await getStore();
  if (store) {
    return store.getItemAsync(ACCESS_TOKEN_KEY);
  }
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await getStore();
  if (store) {
    return store.getItemAsync(REFRESH_TOKEN_KEY);
  }
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  const store = await getStore();
  if (store) {
    await store.deleteItemAsync(ACCESS_TOKEN_KEY);
    await store.deleteItemAsync(REFRESH_TOKEN_KEY);
  } else {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }
}
