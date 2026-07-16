const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
// Keycloak hosts login/registration/password-reset. The URL must match the
// backend's app.security.keycloak.issuer-uri host exactly (token iss claim) —
// on the Android emulator use `adb reverse tcp:8180 tcp:8180`.
const DEFAULT_KEYCLOAK_URL = 'http://localhost:8180';
const DEFAULT_KEYCLOAK_REALM = 'skateboard-podcast';
const DEFAULT_KEYCLOAK_CLIENT_ID = 'skateboard-podcast-fe';

export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL,
  TENANT_ID: process.env.EXPO_PUBLIC_TENANT_ID?.trim() || DEFAULT_TENANT_ID,
  HAS_BACKEND: !!process.env.EXPO_PUBLIC_API_URL?.trim(),
  KEYCLOAK_URL: process.env.EXPO_PUBLIC_KEYCLOAK_URL?.trim() || DEFAULT_KEYCLOAK_URL,
  KEYCLOAK_REALM: process.env.EXPO_PUBLIC_KEYCLOAK_REALM?.trim() || DEFAULT_KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID?.trim() || DEFAULT_KEYCLOAK_CLIENT_ID,
};
