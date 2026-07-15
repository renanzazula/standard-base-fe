export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  // The Keycloak OIDC redirect (skateboardpodcast://auth/callback?code=…) must reach
  // expo-auth-session untouched to complete the sign-in; everything else
  // keeps landing on the root.
  if (path.includes('auth/callback')) {
    return path;
  }
  return '/';
}
