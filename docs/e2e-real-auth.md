# E2E Testing with Real Authentication

This document describes the refactored e2e testing approach that uses real Google OAuth authentication instead of mocks and fixtures.

## Overview

The e2e tests now use actual Google OAuth authentication flows with real credentials stored in GitHub secrets. This provides more realistic test coverage and reduces maintenance overhead compared to the previous mock-based approach.

## Environment Variables

The following environment variables must be configured in your CI/CD environment:

- `TEST_ADMIN_EMAIL`: Email address for admin user with super admin privileges
- `TEST_ADMIN_PASSWORD`: Password for the admin user account
- `TEST_USER_EMAIL`: Email address for regular user account
- `TEST_USER_PASSWORD`: Password for the regular user account

## Architecture

### Global Setup (`global-setup.ts`)

The global setup performs real authentication for both admin and user accounts:

1. Launches a browser instance
2. Navigates to the application
3. Performs Google OAuth authentication using provided credentials
4. Saves authentication state to storage files (`admin-auth-state.json`, `user-auth-state.json`)
5. These storage states are then used by different test projects

### Real Authentication Helper (`real-auth.ts`)

The `RealAuth` class provides methods for:

- Performing Google OAuth login flows
- Handling role selection
- Managing logout flows
- Checking authentication status
- Retrieving credentials from environment variables

### Test Projects

Playwright is configured with multiple projects:

- `chromium`: Base project for unauthenticated tests
- `chromium-admin`: Uses admin authentication state
- `chromium-user`: Uses user authentication state

### Test Structure

Tests are organized to handle different authentication scenarios:

1. **Unauthenticated tests**: Basic functionality that doesn't require login
2. **Admin tests**: Features requiring super admin privileges
3. **User tests**: Features available to regular users with various roles

## Usage

### Running Tests Locally

To run tests locally, you'll need to set the environment variables:

```bash
export TEST_ADMIN_EMAIL="your-admin@example.com"
export TEST_ADMIN_PASSWORD="your-admin-password"
export TEST_USER_EMAIL="your-user@example.com"
export TEST_USER_PASSWORD="your-user-password"

npm run test:e2e
```

### Test Patterns

#### Basic Test Structure

```typescript
test.describe('Feature Tests', () => {
  test.beforeEach(async ({ realAuth }) => {
    const adminCreds = RealAuth.getAdminCredentials();
    test.skip(!adminCreds, 'Admin credentials not available');
    
    if (adminCreds) {
      await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);
      await realAuth.selectRole('superAdmin');
    }
  });

  test('should perform admin action', async ({ page }) => {
    // Test implementation
  });
});
```

#### Credential Checking

Tests automatically skip when required credentials are not available:

```typescript
const userCreds = RealAuth.getUserCredentials();
test.skip(!userCreds, 'User credentials not available');
```

This ensures tests degrade gracefully in environments where credentials are not configured.

#### Role-Based Testing

Tests can authenticate as different user types:

```typescript
// Admin tests
await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);
await realAuth.selectRole('superAdmin');

// User tests  
await realAuth.loginWithGoogle(userCreds.email, userCreds.password);
await realAuth.selectRole('participant');
```

## Benefits

1. **Realistic Testing**: Tests use actual OAuth flows and API responses
2. **Reduced Complexity**: No more elaborate mock setups and fake data
3. **Better Reliability**: Tests validate that authentication works as intended
4. **Easier Maintenance**: Less mock-specific code to maintain
5. **Production Confidence**: Tests exercise the same code paths as real users

## Security Considerations

- Credentials are stored as GitHub secrets and only available during CI runs
- Test accounts should be dedicated test accounts, not production accounts
- OAuth tokens are stored in session storage and cleared after test runs
- Authentication state files are temporary and not committed to the repository

## Troubleshooting

### Common Issues

1. **OAuth Popup Blocked**: Tests handle this by falling back to different auth flows
2. **Session Timeout**: Tests re-authenticate if sessions expire
3. **Role Selection**: Tests gracefully handle cases where expected roles aren't available

### Debug Mode

To debug authentication issues:

```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can observe the authentication flow in real-time.

## Migration Notes

### What Was Removed

- `AuthMock` class and related mock infrastructure
- `createSuperAdminUser`, `createCepAdminUser`, `createParticipantUser` test user factories
- Complex localStorage/sessionStorage mocking
- Fake API response mocking for authentication endpoints

### What Was Added

- `RealAuth` helper class for actual OAuth flows
- Global setup for pre-authentication
- Environment variable-based credential management
- Graceful test skipping when credentials are unavailable

### Breaking Changes

- Tests now require real credentials to run authentication scenarios
- Mock-based test patterns are no longer supported
- Some test timing may be different due to real network calls