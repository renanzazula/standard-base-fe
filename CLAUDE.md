# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Rork-generated cross-platform mobile app (iOS, Android, Web) built with Expo Router + React Native. All application code lives in the `expo/` subdirectory.

## Commands

All commands run from inside the `expo/` directory:

```bash
bun i                     # Install dependencies
bun run start-web         # Dev server for web
bun run start-web-dev     # Dev server with Expo debug mode
bun run start             # Metro bundler (press i/a for iOS/Android)
bun run build:web         # Export static web build
bun run lint              # ESLint via expo lint
```

Tests (placeholder integration tests, no test runner configured yet):
```bash
# Tests are in expo/__tests__/integration/ — all currently placeholder assertions
```

## Architecture

### Directory Layout

```
expo/
├── app/               # Expo Router file-based routes
│   ├── (tabs)/        # Tab group screens + tab _layout.tsx
│   └── _layout.tsx    # Root layout — context providers + route guards
├── core/
│   ├── config/env.ts  # API_BASE_URL, TENANT_ID, HAS_BACKEND flags
│   ├── contexts/      # React contexts (Auth, AdminConfig, Posts, Preferences, UserManagement)
│   └── services/      # API service modules (api.ts, auth.ts, adminConfig.ts, etc.)
├── modules/           # Feature modules — each has screens/ and optional components/
│   ├── auth/
│   ├── feed/
│   ├── home/
│   ├── podcast/
│   ├── settings/
│   └── skate-square/
└── shared/
    ├── constants/     # permissions.ts, themes.ts, colors.ts, languages.ts
    ├── hooks/         # usePermissions.ts, useTranslation.ts
    ├── locales/       # en.ts, es.ts translation strings
    └── types/posts.ts # Post / Block discriminated union types
```

### Path Aliases

Defined in `tsconfig.json` and `babel.config.js`:

| Alias | Resolves to |
|---|---|
| `@core/*` | `expo/core/*` |
| `@modules/*` | `expo/modules/*` |
| `@shared/*` | `expo/shared/*` |
| `@/*` | `expo/*` |

### Context Pattern

All contexts use `@nkzw/create-context-hook`, which returns a `[Provider, useHook]` tuple. Provider ordering in `app/_layout.tsx` matters:

```
QueryClientProvider → AdminConfigProvider → PreferencesProvider
  → AuthProvider → UserManagementProvider → PostsProvider
```

`AuthContext` depends on `AdminConfigContext` (reads session config), so `AdminConfigProvider` must wrap `AuthProvider`.

### API Layer

`core/services/api.ts` → `apiFetch<T>(path, options)`:
- Automatically attaches `Authorization: Bearer <token>` and `X-Tenant-ID` headers
- On 401, attempts token refresh via `/api/auth/refresh` before retrying
- Throws `ApiError` (with `.status` and `.error`) on non-ok responses
- Throws `AuthExpiredError` and calls the registered `onAuthExpired` callback when refresh fails (triggers logout)

### Environment / Backend Mode

`core/config/env.ts` reads:
- `EXPO_PUBLIC_API_URL` — backend base URL (set in `.env`)
- `EXPO_PUBLIC_TENANT_ID` — multi-tenant identifier
- `ENV.HAS_BACKEND` — `true` only when `EXPO_PUBLIC_API_URL` is set

When `HAS_BACKEND` is false, `AdminConfigContext` skips the API call and uses hardcoded `DEFAULT_CONFIG`. The app runs fully offline/mock in this mode.

Production backend: `https://standard-base-production.up.railway.app`
Local default (no `.env`): `http://localhost:8080`

### Permission System

Permissions are FUNC_* string constants defined in `shared/constants/permissions.ts`.

- **Route-level guard**: `ROUTE_PERMISSION_MAP` in `app/_layout.tsx` maps route segments to required permissions. The root `useEffect` redirects to `/(tabs)/home` if the user lacks the required permission.
- **UI-level guard**: `usePermissions()` hook from `shared/hooks/usePermissions.ts` exposes `hasPermission(key)` and `hasAnyPermission(keys[])`.
- Permissions come from the backend on login/profile-refresh. If the API returns none, `resolvePermissions()` falls back to `DEFAULT_ROLE_PERMISSIONS[role]` in permissions.ts.

### Tab Navigation

Tabs are statically defined in `SYSTEM_TABS` in `app/(tabs)/_layout.tsx`. Visibility is controlled by:
1. **Admin catalog** (`AdminConfig.navigationConfig.tabs`): if the backend returns a non-empty tab list, tabs are shown/hidden based on `tab.enabled` and `tab.permissionKey` against the user's permissions.
2. **User's own navigationTabs**: used when the admin catalog is empty.

### Feed / Posts Module

Posts are stored in `AsyncStorage` (no dedicated backend endpoint). The content model uses a `Block` discriminated union (`text | image | video | quote | embed | spotify | gallery | link`) defined in `shared/types/posts.ts`. `BlockRenderer.tsx` renders each block type, with web-only iframe embeds for video/Spotify.

Post feed pagination (`postsPerPage`) is configurable per-user via the module config API (`FEED` module key, `postsPerPage` setting), falling back to `DEFAULT_POSTS_PER_PAGE = 10`.

### Module Config

`core/services/moduleConfig.ts` provides `getModuleConfig(module)` / `getUserModuleConfig(module)` / `updateModuleConfig(module, settings)` for per-module tenant and user-level settings. Currently used by the FEED module for `postsPerPage`.
