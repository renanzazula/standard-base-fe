# TestID Reference Guide

This document lists all testID attributes that should be added to interactive components for automated testing.

## ✅ IMPLEMENTED

### Login Page (`app/login.tsx`)
- ✅ `login-email-input` - Email input field
- ✅ `login-password-input` - Password input field
- ✅ `login-forgot-password-link` - Forgot password link
- ✅ `login-submit-button` - Sign in button
- ✅ `login-google-button` - Google login button
- ✅ `login-apple-button` - Apple login button
- ✅ `login-signup-link` - Sign up link

## ⚠️ NEEDS IMPLEMENTATION

### Sign Up Page (`app/signup.tsx`)
- ⚠️ `signup-name-input` - Full name input field
- ⚠️ `signup-email-input` - Email input field
- ⚠️ `signup-password-input` - Password input field
- ⚠️ `signup-confirm-password-input` - Confirm password input field
- ⚠️ `signup-submit-button` - Create account button
- ⚠️ `signup-google-button` - Google sign up button
- ⚠️ `signup-apple-button` - Apple sign up button
- ⚠️ `signup-login-link` - Sign in link

### Forgot Password Page (`app/forgot-password.tsx`)
- ⚠️ `forgot-password-email-input` - Email input field
- ⚠️ `forgot-password-submit-button` - Send reset link button
- ⚠️ `forgot-password-back-button` - Back to login button

### Home Page (`app/(tabs)/home.tsx`)
- ⚠️ `home-greeting-text` - Welcome message
- ⚠️ `home-profile-card` - Profile information card
- ⚠️ `home-admin-card` - Admin access card (admin only)
- ⚠️ `home-quick-actions` - Quick actions section

### Settings Page (`app/(tabs)/settings.tsx`)
- ⚠️ `settings-profile-card` - User profile card
- ⚠️ `settings-theme-toggle` - Dark mode toggle switch
- ⚠️ `settings-admin-config-button` - Admin configuration button (admin only)
- ⚠️ `settings-logout-button` - Logout button

### Admin Configuration Page (`app/admin-config.tsx`)
- ⚠️ `admin-config-google-toggle` - Enable/disable Google auth
- ⚠️ `admin-config-google-mode-mock` - Google mock mode button
- ⚠️ `admin-config-google-mode-real` - Google real mode button
- ⚠️ `admin-config-apple-toggle` - Enable/disable Apple auth
- ⚠️ `admin-config-apple-mode-mock` - Apple mock mode button
- ⚠️ `admin-config-apple-mode-real` - Apple real mode button
- ⚠️ `admin-config-manual-toggle` - Enable/disable manual auth
- ⚠️ `admin-config-manual-mode-mock` - Manual mock mode button
- ⚠️ `admin-config-manual-mode-real` - Manual real mode button
- ⚠️ `admin-config-session-autorefresh-toggle` - Auto refresh session toggle

## Implementation Instructions

To add testIDs to components, add the `testID` prop to the component:

### TextInput Example
```tsx
<TextInput
  testID="login-email-input"
  style={styles.input}
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>
```

### TouchableOpacity Example
```tsx
<TouchableOpacity
  testID="login-submit-button"
  style={styles.button}
  onPress={handleSubmit}
>
  <Text>Submit</Text>
</TouchableOpacity>
```

### Switch Example
```tsx
<Switch
  testID="settings-theme-toggle"
  value={isDarkMode}
  onValueChange={toggleTheme}
/>
```

### View Example (for containers)
```tsx
<View testID="home-profile-card" style={styles.card}>
  {/* Card content */}
</View>
```

## Testing with TestIDs

### React Native Testing Library
```typescript
import { render, fireEvent } from '@testing-library/react-native';

const { getByTestId } = render(<LoginScreen />);

// Find element
const emailInput = getByTestId('login-email-input');

// Interact with element
fireEvent.changeText(emailInput, 'test@example.com');
fireEvent.press(getByTestId('login-submit-button'));

// Assert
expect(getByTestId('home-greeting-text')).toBeTruthy();
```

### Detox (E2E Testing)
```typescript
describe('Login Flow', () => {
  it('should login successfully', async () => {
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    await expect(element(by.id('home-greeting-text'))).toBeVisible();
  });
});
```

## TestID Naming Convention

Follow this naming pattern: `{screen}-{element}-{type}`

- **screen**: The screen/page name (login, signup, settings, etc.)
- **element**: The element's purpose (email, password, submit, etc.)
- **type**: The element type (input, button, toggle, link, card, etc.)

### Examples:
- `login-email-input` - Login screen, email field, input type
- `settings-theme-toggle` - Settings screen, theme switcher, toggle type
- `admin-config-google-toggle` - Admin config screen, Google auth, toggle type

## Priority for Implementation

### High Priority (Critical User Flows)
1. ✅ Login page - All elements
2. ⚠️ Sign up page - All elements
3. ⚠️ Settings page - Logout button, theme toggle
4. ⚠️ Admin config page - All toggles and mode buttons

### Medium Priority
5. ⚠️ Forgot password page
6. ⚠️ Home page - Profile and admin cards

### Low Priority
7. ⚠️ Home page - Quick actions
8. ⚠️ Settings page - Profile card

## Next Steps

1. Add testIDs to remaining pages (signup, settings, admin-config, etc.)
2. Install testing dependencies:
   ```bash
   npm install --save-dev @testing-library/react-native @testing-library/jest-native jest
   ```
3. Create test files using the testIDs
4. Run tests to verify implementation
5. Set up CI/CD pipeline for automated testing

## Related Files

- Test Cases: `TEST_CASES.md`
- Integration Tests: `__tests__/integration/`
- Auth Tests: `__tests__/integration/auth.test.ts`
- Session Tests: `__tests__/integration/session.test.ts`
- Admin Config Tests: `__tests__/integration/admin-config.test.ts`
- Preferences Tests: `__tests__/integration/preferences.test.ts`
