# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native / Expo 54 mobile app (iOS, Android, Web) built with TypeScript. Uses file-based routing via Expo Router and context-based state management with AsyncStorage persistence. Currently frontend-only — all authentication is mocked, no real backend integration. Generated via the Rork AI platform.

## Commands

All commands must be run from the `expo/` directory. Package manager is **Bun**.

```bash
# Start the app (Expo tunnel mode)
bun run start

# Start web version
bun run start-web

# Start web with debug logging
bun run start-web-dev

# Lint
bun run lint
```

## Architecture

### Provider hierarchy (`app/_layout.tsx`)

Providers are nested in this exact order — new providers must be inserted at the correct level:

```
QueryClientProvider → GestureHandlerRootView → AdminConfigProvider → PreferencesProvider → AuthProvider → UserManagementProvider
```

### File-based routing (`app/`)

Expo Router maps files to routes. The `(tabs)/` group defines the tab navigator. Protected routes (admin screens) are guarded in `RootLayoutNav` inside `app/_layout.tsx`.

### Key directories (all under `expo/`)

| Directory | Purpose |
|---|---|
| `app/` | Screens and layouts (file-based routing) |
| `app/(tabs)/` | Tab screens — rendered dynamically from admin config |
| `contexts/` | React context providers (global state) |
| `hooks/` | Custom React hooks (`useTranslation`) |
| `constants/` | Theme colors, languages, timezones |
| `locales/` | i18n translation files (en, es) |
| `__tests__/integration/` | Integration test stubs (Jest) |

## State Management

Four context providers, each with dedicated AsyncStorage keys:

| Context | Responsibility | Storage keys |
|---|---|---|
| `AuthContext` | User auth, session management, profile | `@user_data`, `@session_data` |
| `AdminConfigContext` | System-wide config (auth methods, tabs, session timeouts) | `@admin_config` |
| `PreferencesContext` | Per-user theme, language, timezone, date format | `@user_theme`, `@user_language_{userId}`, `@user_timezone_{userId}`, `@user_dateformat_{userId}` |
| `UserManagementContext` | Admin user management (view/disable users) | `@managed_users` |

Access context values via the exported hooks: `useAuth()`, `useAdminConfig()`, `usePreferences()`, `useUserManagement()`.

## Authentication

**Currently mocked** — no real backend. Mock mode validates against hardcoded users.

### Test credentials

| Email | Password | Role |
|---|---|---|
| `user@example.com` | `password123` | standard |
| `admin@example.com` | `admin123` | admin |

### Auth methods

Three providers supported: `manual` (email/password), `google`, `apple`. Each can be toggled on/off and switched between `mock`/`real` service mode via `AdminConfigContext`.

### Session management

- `maxTime`: total session duration (default 30 min)
- `idleTime`: inactivity timeout (default 15 min)
- `autoRefresh`: activity resets idle timer (default true)
- Expired sessions auto-logout the user
- Disabled users (via UserManagement) are blocked at login

## Admin Configuration

`AdminConfigContext` controls system-wide settings. Admin screens are under `app/admin-config.tsx` and related files. Config structure:

- **Auth methods**: enable/disable Google, Apple, manual login; set mock/real mode
- **Session**: max time, idle time, auto-refresh toggle
- **Navigation**: tab visibility, ordering, renaming, custom tabs
- **Language**: available languages, default language
- **Regional**: default timezone, date format
- **Profile**: username min/max length, avatar max size, allowed formats

## Internationalization (i18n)

```typescript
const { t, language } = useTranslation();
t('auth.loginFailed'); // dot-notation keys
```

- Translation files in `locales/` (`en.ts`, `es.ts`)
- 8 supported language codes: `en`, `es`, `fr`, `de`, `pt`, `it`, `ja`, `zh`
- Missing translations fall back to the key string (with console warning)
- Language preference is per-user, stored in AsyncStorage
- Add new translations: add keys to `locales/en.ts` (source of truth), then to other locale files

## Theme System

Dark and light themes defined in `constants/themes.ts`. Access via:

```typescript
const { colors, theme, toggleTheme } = usePreferences();
// colors.primary, colors.background, colors.text, etc.
```

`ThemeColors` interface provides: `background`, `surface`, `surfaceSecondary`, `primary`, `primaryDark`, `text`, `textSecondary`, `border`, `error`, `success`, `warning`, `card`, `shadow`.

## Adding a new screen

1. Create a `.tsx` file in `app/` (or `app/(tabs)/` for a tab)
2. If it's a tab: add tab config to the `DEFAULT_CONFIG.navigationConfig.tabs` array in `AdminConfigContext.tsx` and add the icon mapping in `app/(tabs)/_layout.tsx`
3. If it needs admin protection: add the route name to the protected routes list in `app/_layout.tsx`
4. Add translation keys to `locales/en.ts` (and other locales)

## Adding a new context provider

1. Create the context file in `contexts/` following the pattern of existing contexts (use `@nkzw/create-context-hook`)
2. Add the provider to the hierarchy in `app/_layout.tsx` at the appropriate nesting level
3. Define an AsyncStorage key for persistence (prefix with `@`)

## Key design decisions

- **No real backend**: All auth and data is mocked/local. Wiring to a real API (e.g., `standard-base`) requires replacing mock implementations in each context.
- **Dynamic tabs**: Tab bar is rendered from `config.navigationConfig.tabs` — visibility and order are admin-configurable at runtime.
- **Unused dependencies**: `zustand`, `@tanstack/react-query`, and `zod` are installed but not yet used. They are available for future backend integration.
- **Icons**: All icons come from `lucide-react-native`. Import and use via component syntax: `<Home size={24} color={colors.text} />`.

## Configuration

- **Expo config**: `app.json` — bundle IDs, permissions, plugins
- **TypeScript**: `tsconfig.json` — strict mode, path alias `@/*` maps to project root
- **Metro**: `metro.config.js` — wrapped with `withRorkMetro`
- **Babel**: `babel.config.js` — Expo preset with `unstable_transformImportMeta`
