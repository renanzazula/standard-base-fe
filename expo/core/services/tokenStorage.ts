import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStoreModule from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

function getStore() {
  if (Platform.OS === 'web') return null;
  return SecureStoreModule;
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
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
  } else {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }
}
