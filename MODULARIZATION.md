# Frontend Modularization Plan

## Overview

This document outlines the plan to split the Expo/React Native frontend into **feature modules**, where each major section (Home, Feed, Skate Square, Podcast, Settings, Auth) lives in its own self-contained module. The app continues to support iOS, Android, and Web from a single codebase.

---

## Motivation

- **Scalability:** Each tab (Feed, Skate Square, Podcast) is currently a placeholder. As each grows into a full feature, it needs its own screens, hooks, services, components, and state — without bleeding into other features.
- **Independent development:** Teams or contributors can own a module end-to-end.
- **Clear boundaries:** A module only imports from `shared/` or `core/`, never from sibling modules.
- **Future expandability:** New tabs/features can be added by creating a new folder under `modules/` and registering the route in `app/(tabs)/`.

---

## Proposed Directory Structure

```
expo/
├── app/                           # Expo Router — routing shells ONLY
│   ├── _layout.tsx                # Root layout with providers (unchanged)
│   ├── index.tsx                  # Auth redirect (unchanged)
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Tab bar orchestrator (unchanged)
│   │   ├── home.tsx               # Shell → re-exports from modules/home
│   │   ├── feed.tsx               # Shell → re-exports from modules/feed
│   │   ├── skate-square.tsx       # Shell → re-exports from modules/skate-square
│   │   ├── podcast.tsx            # Shell → re-exports from modules/podcast
│   │   └── settings.tsx           # Shell → re-exports from modules/settings
│   ├── login.tsx                  # Shell → re-exports from modules/auth
│   ├── signup.tsx
│   ├── forgot-password.tsx
│   ├── reset-password.tsx
│   ├── admin-config.tsx           # Shell → re-exports from modules/settings
│   ├── navigation-management.tsx
│   ├── user-management.tsx
│   ├── user-permissions.tsx
│   ├── profile-permissions.tsx
│   ├── profile-restrictions.tsx
│   ├── configure-authentication.tsx
│   ├── session-configuration.tsx
│   ├── language-settings.tsx
│   ├── modal.tsx
│   ├── +native-intent.tsx
│   └── +not-found.tsx
│
├── modules/                       # Feature modules
│   ├── home/                      # Module: Home (dashboard / profile overview)
│   │   ├── screens/
│   │   │   └── HomeScreen.tsx
│   │   ├── components/            # Module-specific UI components
│   │   ├── hooks/
│   │   └── index.ts               # Public API of this module
│   │
│   ├── feed/                      # Module: Feed (social content stream)
│   │   ├── screens/
│   │   │   └── FeedScreen.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/              # Feed-specific API calls
│   │   └── index.ts
│   │
│   ├── skate-square/              # Module: Skate Square (community hub)
│   │   ├── screens/
│   │   │   └── SkateSquareScreen.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── index.ts
│   │
│   ├── podcast/                   # Module: Podcast (audio content)
│   │   ├── screens/
│   │   │   └── PodcastScreen.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── index.ts
│   │
│   ├── settings/                  # Module: Settings + Admin configuration
│   │   ├── screens/
│   │   │   ├── SettingsScreen.tsx
│   │   │   ├── AdminConfigScreen.tsx
│   │   │   ├── UserManagementScreen.tsx
│   │   │   ├── UserPermissionsScreen.tsx
│   │   │   ├── ProfilePermissionsScreen.tsx
│   │   │   ├── ProfileRestrictionsScreen.tsx
│   │   │   ├── ConfigureAuthScreen.tsx
│   │   │   ├── SessionConfigScreen.tsx
│   │   │   ├── LanguageSettingsScreen.tsx
│   │   │   └── NavigationManagementScreen.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   │
│   └── auth/                      # Module: Authentication flows
│       ├── screens/
│       │   ├── LoginScreen.tsx
│       │   ├── SignUpScreen.tsx
│       │   ├── ForgotPasswordScreen.tsx
│       │   └── ResetPasswordScreen.tsx
│       ├── components/
│       ├── hooks/
│       └── index.ts
│
├── shared/                        # Cross-cutting UI building blocks
│   ├── components/                # Reusable UI components (Button, Avatar, Card…)
│   ├── hooks/
│   │   ├── useTranslation.ts      # (moved from hooks/)
│   │   └── usePermissions.ts      # (moved from hooks/)
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── languages.ts
│   │   ├── permissions.ts
│   │   ├── themes.ts
│   │   └── timezones.ts
│   └── locales/
│       ├── en.ts
│       ├── es.ts
│       └── index.ts
│
├── core/                          # App infrastructure (providers, services, config)
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── AdminConfigContext.tsx
│   │   ├── PreferencesContext.tsx
│   │   └── UserManagementContext.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── tokenStorage.ts
│   │   ├── userProfile.ts
│   │   ├── adminConfig.ts
│   │   └── adminUsers.ts
│   └── config/
│       └── env.ts
│
├── assets/
├── app.json
├── package.json
├── tsconfig.json
├── metro.config.js
└── babel.config.js
```

---

## Module Descriptions

| Module | Directory | Responsibility |
|---|---|---|
| **Home** | `modules/home/` | User dashboard, profile summary, quick actions |
| **Feed** | `modules/feed/` | Social content stream (trending, updates, favorites) |
| **Skate Square** | `modules/skate-square/` | Skate community hub (spots, events, content) |
| **Podcast** | `modules/podcast/` | Audio player, episode list, podcast discovery |
| **Settings** | `modules/settings/` | User settings + all admin configuration screens |
| **Auth** | `modules/auth/` | Login, sign-up, forgot/reset password flows |

---

## Dependency Rules

```
app/ (routing shells)
    ↓
modules/ (feature logic)
    ↓
shared/ (UI primitives, hooks, constants, i18n)
    ↑
core/ (contexts, services, config)
```

- `modules/*` can import from `shared/` and `core/`.
- `modules/*` **must not** import from sibling modules.
- `app/` routing files are thin shells that import from `modules/`.
- `shared/` and `core/` have **no** dependency on `modules/`.

---

## Path Aliases

Add the following aliases to `tsconfig.json` and `babel.config.js` to avoid deep relative imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@modules/*": ["./modules/*"],
      "@shared/*": ["./shared/*"],
      "@core/*": ["./core/*"]
    }
  }
}
```

---

## Web vs. Mobile

No structural changes are needed for platform compatibility. The existing strategy continues:

- Single codebase compiles to iOS, Android, and Web via `react-native-web`.
- Platform-specific files (`.web.tsx` / `.native.tsx`) can be added **inside any module** when a component needs a platform-specific implementation.
- `app.json` continues to hold platform-specific metadata (bundle IDs, permissions).
- `core/config/env.ts` supplies the `API_BASE_URL` for all platforms.

---

## How to Add a New Module (Future)

1. Create `modules/<module-name>/` with `screens/`, `components/`, `hooks/`, `services/`, `index.ts`.
2. Add a route shell in `app/(tabs)/<module-name>.tsx` that imports from the module.
3. Register the tab in `AdminConfigContext`'s `DEFAULT_CONFIG.navigationConfig.tabs`.
4. Add the icon mapping in `app/(tabs)/_layout.tsx`.
5. Add a `FUNC_TAB_<MODULE_NAME>` permission constant in `shared/constants/permissions.ts`.
6. Add translation keys in `shared/locales/en.ts` (and other locales).

---

## Implementation Checklist

### Phase 1 — Scaffold & Shared Infrastructure

- [ ] Create `shared/` directory
- [ ] Move `hooks/useTranslation.ts` → `shared/hooks/useTranslation.ts`
- [ ] Move `hooks/usePermissions.ts` → `shared/hooks/usePermissions.ts`
- [ ] Move `constants/` → `shared/constants/`
- [ ] Move `locales/` → `shared/locales/`
- [ ] Create `core/` directory
- [ ] Move `contexts/` → `core/contexts/`
- [ ] Move `services/` → `core/services/`
- [ ] Move `config/` → `core/config/`
- [ ] Update `tsconfig.json` with `@modules/*`, `@shared/*`, `@core/*` path aliases
- [ ] Update `babel.config.js` with the same aliases (module-resolver plugin)
- [ ] Verify `bun run start-web` and `bun run start` still compile

### Phase 2 — Auth Module

- [ ] Create `modules/auth/` scaffold (`screens/`, `components/`, `hooks/`, `index.ts`)
- [ ] Move `app/login.tsx` screen logic → `modules/auth/screens/LoginScreen.tsx`
- [ ] Move `app/signup.tsx` screen logic → `modules/auth/screens/SignUpScreen.tsx`
- [ ] Move `app/forgot-password.tsx` → `modules/auth/screens/ForgotPasswordScreen.tsx`
- [ ] Move `app/reset-password.tsx` → `modules/auth/screens/ResetPasswordScreen.tsx`
- [ ] Update `app/login.tsx` (and others) to be thin shells re-exporting from the module
- [ ] Export the public API via `modules/auth/index.ts`
- [ ] Run lint + smoke test (web + mobile)

### Phase 3 — Settings Module

- [ ] Create `modules/settings/` scaffold
- [ ] Move `app/settings.tsx` screen logic → `modules/settings/screens/SettingsScreen.tsx`
- [ ] Move `app/admin-config.tsx` → `modules/settings/screens/AdminConfigScreen.tsx`
- [ ] Move `app/user-management.tsx` → `modules/settings/screens/UserManagementScreen.tsx`
- [ ] Move `app/user-permissions.tsx` → `modules/settings/screens/UserPermissionsScreen.tsx`
- [ ] Move `app/profile-permissions.tsx` → `modules/settings/screens/ProfilePermissionsScreen.tsx`
- [ ] Move `app/profile-restrictions.tsx` → `modules/settings/screens/ProfileRestrictionsScreen.tsx`
- [ ] Move `app/configure-authentication.tsx` → `modules/settings/screens/ConfigureAuthScreen.tsx`
- [ ] Move `app/session-configuration.tsx` → `modules/settings/screens/SessionConfigScreen.tsx`
- [ ] Move `app/language-settings.tsx` → `modules/settings/screens/LanguageSettingsScreen.tsx`
- [ ] Move `app/navigation-management.tsx` → `modules/settings/screens/NavigationManagementScreen.tsx`
- [ ] Update all `app/*.tsx` shells to import from the module
- [ ] Export the public API via `modules/settings/index.ts`
- [ ] Run lint + smoke test (web + mobile)

### Phase 4 — Home Module

- [ ] Create `modules/home/` scaffold
- [ ] Move `app/(tabs)/home.tsx` screen logic → `modules/home/screens/HomeScreen.tsx`
- [ ] Update `app/(tabs)/home.tsx` to be a thin shell
- [ ] Export via `modules/home/index.ts`
- [ ] Run lint + smoke test

### Phase 5 — Feed Module

- [ ] Create `modules/feed/` scaffold
- [ ] Move `app/(tabs)/feed.tsx` screen logic → `modules/feed/screens/FeedScreen.tsx`
- [ ] Update `app/(tabs)/feed.tsx` to be a thin shell
- [ ] Export via `modules/feed/index.ts`
- [ ] Run lint + smoke test

### Phase 6 — Skate Square Module

- [ ] Create `modules/skate-square/` scaffold
- [ ] Move `app/(tabs)/skate-square.tsx` screen logic → `modules/skate-square/screens/SkateSquareScreen.tsx`
- [ ] Update `app/(tabs)/skate-square.tsx` to be a thin shell
- [ ] Export via `modules/skate-square/index.ts`
- [ ] Run lint + smoke test

### Phase 7 — Podcast Module

- [ ] Create `modules/podcast/` scaffold
- [ ] Move `app/(tabs)/podcast.tsx` screen logic → `modules/podcast/screens/PodcastScreen.tsx`
- [ ] Update `app/(tabs)/podcast.tsx` to be a thin shell
- [ ] Export via `modules/podcast/index.ts`
- [ ] Run lint + smoke test

### Phase 8 — Shared Components

- [ ] Extract reusable UI elements from screens into `shared/components/`
  - [ ] Identify repeated patterns across modules (form inputs, section headers, action cards, avatar components, etc.)
  - [ ] Create components with mobile/web compatibility in mind
  - [ ] Update module screens to consume shared components
- [ ] Run full lint pass (`bun run lint`)
- [ ] Smoke test web build (`bun run start-web`)
- [ ] Smoke test native build (`bun run start`)

### Phase 9 — Cleanup & Documentation

- [ ] Remove old `hooks/`, `constants/`, `locales/`, `services/`, `contexts/`, `config/` directories (now under `shared/` and `core/`)
- [ ] Update all remaining import paths
- [ ] Update `CLAUDE.md` to reflect the new directory structure
- [ ] Update module-level `index.ts` files to document each module's public API
