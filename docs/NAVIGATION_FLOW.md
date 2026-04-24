# Navigation Flow Documentation

This document provides a comprehensive overview of all navigation flows and routes in the application.

## Table of Contents

1. [Application Architecture](#application-architecture)
2. [Authentication Flow](#authentication-flow)
3. [Tab Navigation](#tab-navigation)
4. [Admin Configuration Pages](#admin-configuration-pages)
5. [Route Protection](#route-protection)
6. [Navigation Hierarchy](#navigation-hierarchy)

---

## Application Architecture

The application uses **Expo Router** for file-based routing with a hybrid navigation structure combining:
- **Stack Navigation** for the root layout and modals
- **Tab Navigation** for the main authenticated experience
- **Protected Routes** for admin-only pages

### Root Layout Structure

```
app/
├── _layout.tsx                  # Root stack navigator with auth logic
├── index.tsx                    # Entry point (redirects based on auth state)
├── (tabs)/                      # Tab navigator group
│   ├── _layout.tsx              # Tab configuration
│   ├── home.tsx                 # Home tab
│   ├── feed.tsx                 # Feed tab
│   ├── skate-square.tsx         # Skate Square tab
│   ├── podcast.tsx              # Podcast tab
│   └── settings.tsx             # Settings tab
├── login.tsx                    # Login screen
├── signup.tsx                   # Sign up screen
├── forgot-password.tsx          # Password reset screen
├── admin-config.tsx             # Admin configuration
├── navigation-management.tsx    # Navigation management
├── user-management.tsx          # User management
├── configure-authentication.tsx # Authentication settings
├── session-configuration.tsx    # Session settings
├── language-settings.tsx        # Language settings
├── profile-restrictions.tsx     # Profile restrictions
├── modal.tsx                    # Modal screen
├── +not-found.tsx              # 404 page
└── +native-intent.tsx          # Deep link handler
```

---

## Authentication Flow

### Entry Point (`/`)

The app starts at `app/index.tsx` which:
1. Checks authentication state
2. Shows loading indicator while checking
3. Redirects to:
   - `/(tabs)/home` if authenticated
   - `/login` if not authenticated

### Login Flow

**Route:** `/login`  
**File:** `app/login.tsx`

**Features:**
- Email/Password login (if manual auth enabled)
- Google login (if Google auth enabled)
- Apple login (if Apple auth enabled)
- Links to:
  - `/signup` - Create new account
  - `/forgot-password` - Reset password

**Navigation After Login:**
- Success → `/(tabs)/home`
- Account disabled → Error alert shown

### Sign Up Flow

**Route:** `/signup`  
**File:** `app/signup.tsx`

**Features:**
- Manual registration with email/password
- Google sign up
- Apple sign up
- Links back to `/login`

**Navigation After Sign Up:**
- Success → `/(tabs)/home`

### Password Reset Flow

**Route:** `/forgot-password`  
**File:** `app/forgot-password.tsx`

**Features:**
- Email input for password reset
- Back button to `/login`

**Navigation After Reset:**
- Success → Returns to `/login`

---

## Tab Navigation

### Tab Configuration

**Route:** `/(tabs)`  
**Layout File:** `app/(tabs)/_layout.tsx`

The tab bar is **dynamically configured** by admin users through the Navigation Management page.

### Default Tabs

| Tab ID | Route | File | Icon | Can be Disabled? |
|--------|-------|------|------|------------------|
| `home` | `/(tabs)/home` | `app/(tabs)/home.tsx` | Home | Yes |
| `feed` | `/(tabs)/feed` | `app/(tabs)/feed.tsx` | RSS | Yes |
| `skate-square` | `/(tabs)/skate-square` | `app/(tabs)/skate-square.tsx` | Droplets | Yes |
| `podcast` | `/(tabs)/podcast` | `app/(tabs)/podcast.tsx` | Mic | Yes |
| `settings` | `/(tabs)/settings` | `app/(tabs)/settings.tsx` | Settings | No (always visible) |

### Tab Features

1. **Dynamic Visibility**: Tabs can be enabled/disabled by admin users
2. **Reorderable**: Tab order can be changed via Navigation Management
3. **Custom Tabs**: Admins can add custom tabs with custom icons
4. **Admin Override**: Settings tab is always visible for admin users

### Individual Tab Screens

#### Home Tab (`/(tabs)/home`)
- Welcome message with user information
- Profile information card
- Admin access indicator (for admin users)
- Quick actions section
- Activity tracking

#### Feed Tab (`/(tabs)/feed`)
- Placeholder for feed content
- Coming soon features:
  - Trending content
  - Social features
  - Favorites
  - Updates

#### Skate Square Tab (`/(tabs)/skate-square`)
- Placeholder screen
- Future features TBD

#### Podcast Tab (`/(tabs)/podcast`)
- Placeholder screen
- Custom header configuration

#### Settings Tab (`/(tabs)/settings`)
- **Profile Settings**:
  - Avatar upload (camera or gallery)
  - Username editing
  - Email display
  - Role badge
  - Language selection
- **Appearance**:
  - Dark mode toggle
- **Admin Configuration** (admin only):
  - Links to all admin pages
- **Account**:
  - Logout button

### Settings Tab Navigation Links

From the Settings tab, users can navigate to:

| Link | Route | Access Level |
|------|-------|--------------|
| User Management | `/user-management` | Admin only |
| Configure Authentication | `/configure-authentication` | Admin only |
| Session Configuration | `/session-configuration` | Admin only |
| Language Settings | `/language-settings` | Admin only |
| Profile Restrictions | `/profile-restrictions` | Admin only |
| Navigation Management | `/navigation-management` | Admin only |

---

## Admin Configuration Pages

These pages are **outside the tab navigation** and open as full-screen stack screens.

### User Management

**Route:** `/user-management`  
**File:** `app/user-management.tsx`  
**Access:** Admin only

**Features:**
- View all users
- Filter and search users
- Enable/disable user accounts
- View user details
- Manage user roles

### Configure Authentication

**Route:** `/configure-authentication`  
**File:** `app/configure-authentication.tsx`  
**Access:** Admin only

**Features:**
- Enable/disable authentication methods:
  - Google authentication
  - Apple authentication
  - Manual (email/password) authentication
- Toggle between Mock and Real service modes
- View authentication configuration

### Session Configuration

**Route:** `/session-configuration`  
**File:** `app/session-configuration.tsx`  
**Access:** Admin only

**Features:**
- Set maximum session time (5 min - 24 hours)
- Set idle timeout (5 min - 24 hours)
- Toggle auto-refresh session
- Adjust times in 5-minute increments

### Language Settings

**Route:** `/language-settings`  
**File:** `app/language-settings.tsx`  
**Access:** Admin only

**Features:**
- Enable/disable available languages
- Set default language
- View language details (code, native name)
- Manage language availability

### Profile Restrictions

**Route:** `/profile-restrictions`  
**File:** `app/profile-restrictions.tsx`  
**Access:** Admin only

**Features:**
- Set username minimum/maximum length
- Configure username validation rules
- Set avatar upload policies
- Configure profile field restrictions

### Navigation Management

**Route:** `/navigation-management`  
**File:** `app/navigation-management.tsx`  
**Access:** Admin only

**Features:**
- Enable/disable tabs
- Reorder tabs (move up/down)
- Edit tab names
- Add custom tabs
- Remove custom tabs (system tabs cannot be removed)
- View tab metadata

**Tab Management Rules:**
- Settings tab is always visible for admin users
- System tabs cannot be deleted
- At least one tab must remain enabled
- Tabs can be reordered using up/down buttons

### Admin Config (Legacy)

**Route:** `/admin-config`  
**File:** `app/admin-config.tsx`  
**Access:** Admin only

**Features:**
- All-in-one admin configuration screen
- Contains authentication, session, language, and profile settings
- Link to Profile Restrictions page

---

## Route Protection

### Protected Routes Logic

**File:** `app/_layout.tsx` (lines 45-56)

The root layout implements automatic route protection:

```typescript
const inAuthGroup = segments[0] === '(tabs)' || segments[0] === undefined;
const inProtectedRoute = segments[0] === 'admin-config' 
  || segments[0] === 'navigation-management' 
  || segments[0] === 'user-management'
  || segments[0] === 'profile-restrictions'
  || segments[0] === 'configure-authentication'
  || segments[0] === 'session-configuration'
  || segments[0] === 'language-settings';

if (!isAuthenticated && inAuthGroup) {
  router.replace('/login');
} else if (isAuthenticated && !inAuthGroup && !inProtectedRoute) {
  router.replace('/(tabs)/home');
}
```

### Access Control

| Route Pattern | Authentication Required | Admin Required |
|--------------|------------------------|----------------|
| `/login`, `/signup`, `/forgot-password` | No | No |
| `/(tabs)/*` | Yes | No |
| `/admin-config` | Yes | Yes |
| `/navigation-management` | Yes | Yes |
| `/user-management` | Yes | Yes |
| `/configure-authentication` | Yes | Yes |
| `/session-configuration` | Yes | Yes |
| `/language-settings` | Yes | Yes |
| `/profile-restrictions` | Yes | Yes |

### Admin-Only Features

Within authenticated screens, certain features are conditionally shown to admin users:

1. **Home Tab:**
   - Admin access indicator card

2. **Settings Tab:**
   - "Admin Configuration" section with links to all admin pages

3. **Tab Navigation:**
   - Settings tab always visible (even if disabled by admin)

---

## Navigation Hierarchy

```
Root Stack Navigator
│
├─ index (/) ────────────────→ Redirects to /login or /(tabs)/home
│
├─ Authentication (No auth required)
│  ├─ login
│  ├─ signup
│  └─ forgot-password
│
├─ Tab Navigator /(tabs) ───→ (Auth required)
│  ├─ home
│  ├─ feed
│  ├─ skate-square
│  ├─ podcast
│  └─ settings ──────────────→ Links to admin pages
│
├─ Admin Pages (Auth + Admin required)
│  ├─ admin-config
│  ├─ navigation-management
│  ├─ user-management
│  ├─ configure-authentication
│  ├─ session-configuration
│  ├─ language-settings
│  └─ profile-restrictions
│
└─ Special Routes
   ├─ modal
   ├─ +not-found
   └─ +native-intent
```

---

## Navigation Patterns

### 1. Initial App Load

```
App Start
  ↓
Check Auth State
  ↓
├─ Not Authenticated → /login
└─ Authenticated → /(tabs)/home
```

### 2. Login Flow

```
/login
  ↓
[User enters credentials]
  ↓
Authentication Success
  ↓
/(tabs)/home
```

### 3. Admin Configuration Flow

```
/(tabs)/settings (Admin user)
  ↓
[Tap "Navigation Management"]
  ↓
/navigation-management
  ↓
[Configure tabs]
  ↓
[Back button] → /(tabs)/settings
```

### 4. Logout Flow

```
/(tabs)/settings
  ↓
[Tap "Logout"]
  ↓
[Confirm logout]
  ↓
Clear auth state
  ↓
/login
```

---

## Deep Linking

**Handler:** `app/+native-intent.tsx`

The application supports deep linking through the native intent handler. This allows external apps and web browsers to open specific screens within the app.

---

## Navigation State Management

### Context Providers

The navigation system integrates with several context providers:

1. **AuthContext** - Manages authentication state and user data
2. **AdminConfigContext** - Manages admin configuration including tab visibility
3. **PreferencesContext** - Manages user preferences (theme, language)
4. **UserManagementContext** - Manages user list and user operations

### Navigation Triggers

Navigation can be triggered by:

1. **Authentication state changes** - Automatic redirects
2. **User interactions** - Button taps, links
3. **Admin configuration changes** - Tab visibility changes
4. **Deep links** - External app triggers

---

## Best Practices

1. **Always use `router.replace()` for authentication redirects** to prevent back navigation to auth screens
2. **Check user role before showing admin-only links** to prevent unauthorized access attempts
3. **Use the `inProtectedRoute` check** when adding new admin pages to ensure proper route protection
4. **Test navigation with both admin and standard users** to verify access control
5. **Consider tab visibility state** when implementing features that depend on specific tabs

---

## Future Enhancements

Potential navigation improvements:

1. **Nested stacks within tabs** for deeper navigation hierarchies
2. **Breadcrumb navigation** for admin pages
3. **Navigation history tracking** for analytics
4. **Gesture-based navigation** for improved UX
5. **Tab preloading** for faster navigation

---

## Troubleshooting

### Common Navigation Issues

**Issue:** User stuck on login screen after successful authentication  
**Solution:** Check if authentication state is properly set and redirect logic in `app/_layout.tsx` is executing

**Issue:** Admin pages accessible to non-admin users  
**Solution:** Verify that admin check is implemented in the UI layer and context provides correct user role

**Issue:** Tabs not appearing after configuration change  
**Solution:** Ensure AdminConfigContext is properly updating and tab layout is re-rendering

**Issue:** Back button leads to unexpected screen  
**Solution:** Use `router.replace()` instead of `router.push()` for authentication flows

---

## Technical Notes

- **Navigation Library:** Expo Router (file-based routing)
- **State Management:** React Context API
- **Authentication:** Custom implementation with mock and real modes
- **Route Protection:** Implemented in root layout with segment checking
- **Deep Linking:** Supported via native intent handler

---

## Related Documentation

- [NAVIGATION_MANAGEMENT_TECHNICAL.md](NAVIGATION_MANAGEMENT_TECHNICAL.md) - Technical implementation details
- [README.md](../expo/README.md) - General project documentation
- [TEST_CASES.md](TEST_CASES.md) - Navigation testing scenarios

---

*Last Updated: 2026-02-08*
