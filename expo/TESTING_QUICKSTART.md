# Testing Quick Start Guide

## 🚀 Quick Start - Manual Testing

### 1. Start the App
```bash
npm start
```

### 2. Test Credentials (Mock Mode)
```
Standard User:
Email: user@example.com
Password: password123

Admin User:
Email: admin@example.com
Password: admin123
```

### 3. Critical Flows to Test

#### ✅ User Registration Flow
1. Open app → Click "Sign Up"
2. Fill form: Name, Email, Password, Confirm Password
3. Click "Create Account"
4. ✓ Should redirect to home page
5. ✓ Should show welcome message with your name

#### ✅ Login Flow
1. Open app → Enter credentials
2. Click "Sign In"
3. ✓ Should redirect to home page
4. ✓ Should show user profile

#### ✅ Admin Configuration Flow
1. Login as admin (admin@example.com / admin123)
2. Go to Settings → Admin Configuration
3. Toggle Google authentication OFF
4. Logout
5. ✓ Google button should NOT appear on login page
6. Login as admin again
7. Toggle Google authentication ON
8. Logout
9. ✓ Google button should appear on login page

#### ✅ Theme Toggle Flow
1. Login as any user
2. Go to Settings
3. Toggle Dark Mode switch
4. ✓ Theme should change immediately
5. Navigate to Home and back
6. ✓ Theme should persist
7. Logout and login again
8. ✓ Theme should still be saved

#### ✅ Logout Flow
1. Login as any user
2. Go to Settings
3. Scroll to bottom
4. Click "Logout" button
5. Confirm in alert
6. ✓ Should redirect to login page
7. Try to navigate to home
8. ✓ Should redirect back to login

---

## 🧪 Automated Testing Setup (Future)

### Install Dependencies
```bash
npm install --save-dev \
  @testing-library/react-native \
  @testing-library/jest-native \
  jest \
  @types/jest \
  react-test-renderer
```

### Configure Jest
Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|@react-navigation)/)',
  ],
};
```

### Run Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## 📋 Manual Testing Checklist

### Authentication (15 min)
- [ ] Sign up with manual registration
- [ ] Sign up with Google (mock)
- [ ] Sign up with Apple (mock)
- [ ] Login with email/password
- [ ] Login with Google (mock)
- [ ] Login with Apple (mock)
- [ ] Forgot password flow
- [ ] Logout

### Admin Configuration (10 min)
- [ ] Login as admin
- [ ] Toggle Google auth on/off
- [ ] Toggle Apple auth on/off
- [ ] Toggle Manual auth on/off
- [ ] Switch Google to Real mode
- [ ] Switch Apple to Real mode
- [ ] Switch Manual to Real mode
- [ ] Toggle session auto-refresh
- [ ] Verify changes persist after logout

### User Preferences (5 min)
- [ ] Toggle dark/light theme
- [ ] Verify theme persists after logout
- [ ] Verify theme applies to all screens
- [ ] View settings panel
- [ ] View home page

### Session Management (10 min)
- [ ] Login and wait for idle timeout (15 min default)
- [ ] Verify automatic logout
- [ ] Login with auto-refresh enabled
- [ ] Interact with app
- [ ] Verify session extends
- [ ] Login with auto-refresh disabled
- [ ] Verify session doesn't extend

**Total Time**: ~40 minutes

---

## 🐛 Bug Reporting Template

When you find a bug, report it using this template:

```markdown
## Bug Report

**Title**: [Short description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[If applicable]

**Environment**:
- Device: [iOS/Android/Web]
- OS Version: [e.g., iOS 17.0]
- App Version: [e.g., 1.0.0]

**Test Case Reference**:
[e.g., TC-M1-UC01-001]
```

---

## ✅ Verification Checklist

### Before Marking Test as Passed
- [ ] Feature works as expected
- [ ] No console errors
- [ ] No visual glitches
- [ ] Works on iOS (if applicable)
- [ ] Works on Android (if applicable)
- [ ] Works on Web (if applicable)
- [ ] Data persists correctly
- [ ] Navigation works correctly
- [ ] Loading states work
- [ ] Error states work

---

## 📊 Test Results Template

Use this template to record test results:

```markdown
## Test Session Report

**Date**: [YYYY-MM-DD]
**Tester**: [Your Name]
**Duration**: [Time spent]
**Platform**: [iOS/Android/Web]

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-M1-UC01-001 | ✅ Pass | - |
| TC-M1-UC02-001 | ❌ Fail | Google button not visible |
| TC-M1-UC03-001 | ⚠️ Partial | Works but slow |

### Summary
- **Total Tests**: 42
- **Passed**: 38
- **Failed**: 2
- **Partial**: 2
- **Skipped**: 0

### Critical Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## 🎯 Focus Areas

### High Priority Testing
1. **Authentication Flows** - Most critical
2. **Admin Configuration** - Core functionality
3. **Session Management** - Security critical
4. **Theme Persistence** - User experience

### Medium Priority Testing
5. **Forgot Password** - Important but less used
6. **Profile Display** - Visual verification
7. **Navigation** - User experience

### Low Priority Testing
8. **Quick Actions** - Nice to have
9. **Debug Info Display** - Development only

---

## 🔧 Troubleshooting

### App Won't Start
```bash
# Clear cache
npm start -- --clear

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Login Not Working
- Verify you're using correct test credentials
- Check console for errors
- Verify AsyncStorage is working
- Try clearing app data

### Theme Not Persisting
- Check AsyncStorage permissions
- Verify PreferencesContext is loaded
- Check console for storage errors

### Admin Config Not Saving
- Verify logged in as admin user
- Check AsyncStorage is working
- Verify AdminConfigContext is loaded

---

## 📚 Documentation Reference

- **Full Test Cases**: `TEST_CASES.md`
- **TestID Reference**: `TESTID_REFERENCE.md`
- **Testing Summary**: `TESTING_SUMMARY.md`
- **Integration Tests**: `__tests__/integration/`

---

## 💡 Tips

1. **Test on Real Devices**: Simulators don't catch all issues
2. **Test Different Screen Sizes**: Verify responsive design
3. **Test Slow Networks**: Use network throttling
4. **Test Edge Cases**: Empty states, long text, special characters
5. **Test Accessibility**: Use screen readers, keyboard navigation
6. **Document Everything**: Take screenshots, record videos
7. **Test Systematically**: Follow the checklist, don't skip steps
8. **Report Immediately**: Don't wait to report bugs

---

## 🎉 Success Criteria

### Ready for Production When:
- [ ] All critical test cases pass
- [ ] No critical bugs
- [ ] All high-priority bugs fixed
- [ ] Tested on iOS and Android
- [ ] Performance is acceptable
- [ ] Accessibility requirements met
- [ ] Security review completed
- [ ] Documentation complete

---

**Quick Start Version**: 1.0  
**Last Updated**: 2025-10-14  
**Status**: Ready to Use
