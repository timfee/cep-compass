# Testing Setup Guide

## Overview

This guide explains how to set up testing environments for local development and GitHub CI/CD pipelines.

## Environment Variables Required

### Local Testing

Create a `.env.test` file in the project root with the following variables:

```bash
# Firebase Test Configuration
FIREBASE_PROJECT_ID=demo-test-project

# Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password-123
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=admin-password-123

# Test Configuration
USE_API_MOCKS=true
HEADLESS_BROWSER=true
```

### GitHub Secrets Required

Configure the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

#### Firebase Test Configuration

- `FIREBASE_TEST_PROJECT_ID`: Your Firebase test project ID
- `FIREBASE_TEST_API_KEY`: Firebase API key for test project
- `FIREBASE_TEST_AUTH_DOMAIN`: Firebase auth domain
- `FIREBASE_TEST_APP_ID`: Firebase app ID

#### Test Credentials

- `TEST_USER_EMAIL`: Email for test user account
- `TEST_USER_PASSWORD`: Password for test user
- `TEST_ADMIN_EMAIL`: Email for test admin account
- `TEST_ADMIN_PASSWORD`: Password for test admin

## Running Tests Locally

### Unit Tests

```bash
# Run unit tests with Karma
npm test

# Run unit tests in CI mode (single run, headless)
npm test -- --watch=false --browsers=ChromeHeadless

# Run tests with coverage
npm test -- --code-coverage
```

### E2E Tests

```bash
# Install Playwright browsers first time
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/dashboard.spec.ts
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/test.yml`) runs:

1. **Unit Tests**: Karma tests with ChromeHeadless
2. **E2E Tests**: Playwright tests against the application
3. **Build Check**: Verifies production build succeeds
4. **Linting**: Checks code quality

### Workflow Triggers

- On push to `main` or `develop` branches
- On pull requests to `main` branch

## Test Configuration Files

### `environment.test.ts`

- Firebase configuration for test environment
- Points to demo project for testing

### `playwright.config.test.ts`

- E2E test configuration for CI
- Configures reporters and test artifacts

### `karma.conf.js`

- Unit test configuration
- Includes ChromeHeadlessCI launcher for CI

### `e2e/global-setup.ts`

- Playwright global setup for authentication

## Best Practices

1. **Never commit real credentials** - Use environment variables
2. **Create dedicated test accounts** with limited permissions
3. **Run tests in CI** on every PR
4. **Monitor test coverage** to maintain quality

## Troubleshooting

### Tests fail with authentication errors

- Check environment variables are set
- Verify test accounts are configured

### E2E tests timeout

- Increase timeout in playwright.config.ts
- Check if app is building correctly

### CI tests fail but local tests pass

- Check GitHub secrets are configured
- Verify CI uses correct Node version
- Review workflow logs for specific errors

## Creating Test Accounts

For production testing (not recommended):

- Create limited permission test accounts
- Use separate test organization/domain
- Implement proper cleanup after tests
