import { test, expect } from '../support/fixtures';
import { RealAuth } from '../support/helpers/real-auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, realAuth }) => {
    // Clear any existing authentication state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should redirect unauthenticated users to login', async ({
    page,
    loginPage,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
    await loginPage.waitForLoad();
    await expect(loginPage.cardTitle).toContainText('CEP Compass');
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should display login page elements correctly', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.waitForLoad();

    await expect(loginPage.cardTitle).toContainText('CEP Compass');
    await expect(loginPage.loginButton).toContainText('Sign in with Google');
    await expect(await loginPage.getTitle()).toContain('CEP Compass');
  });

  test('should handle authenticated admin user', async ({
    page,
    dashboardPage,
    realAuth,
  }) => {
    // Skip test if no admin credentials available
    const adminCreds = RealAuth.getAdminCredentials();
    test.skip(!adminCreds, 'Admin credentials not available');

    if (adminCreds) {
      // Perform real login
      await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);

      // Should be redirected to dashboard or role selection
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/dashboard|select-role/);

      // If on role selection, select admin role
      if (currentUrl.includes('select-role')) {
        await realAuth.selectRole('superAdmin');
      }

      // Verify we're on dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    }
  });

  test('should handle authenticated regular user', async ({
    page,
    dashboardPage,
    realAuth,
  }) => {
    // Skip test if no user credentials available
    const userCreds = RealAuth.getUserCredentials();
    test.skip(!userCreds, 'User credentials not available');

    if (userCreds) {
      // Perform real login
      await realAuth.loginWithGoogle(userCreds.email, userCreds.password);

      // Should be redirected to dashboard or role selection
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/dashboard|select-role/);

      // If on role selection, select available role
      if (currentUrl.includes('select-role')) {
        await realAuth.selectRole('participant');
      }

      // Verify we're on dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    }
  });

  test('should show dashboard for authenticated user', async ({
    page,
    dashboardPage,
    realAuth,
  }) => {
    // Skip test if no credentials available
    const userCreds = RealAuth.getUserCredentials();
    test.skip(!userCreds, 'User credentials not available');

    if (userCreds) {
      await realAuth.loginWithGoogle(userCreds.email, userCreds.password);
      
      // Navigate to dashboard
      await dashboardPage.goto();
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(dashboardPage.dashboardCards.first()).toBeVisible();
    }
  });

  test('should block access to protected routes when not authenticated', async ({
    page,
  }) => {
    // Clear any auth state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const protectedRoutes = [
      '/dashboard',
      '/admin',
      '/org-units',
      '/email-templates',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should handle logout flow', async ({
    page,
    loginPage,
    dashboardPage,
    realAuth,
  }) => {
    // Skip test if no credentials available
    const userCreds = RealAuth.getUserCredentials();
    test.skip(!userCreds, 'User credentials not available');

    if (userCreds) {
      // Login first
      await realAuth.loginWithGoogle(userCreds.email, userCreds.password);

      // Navigate to dashboard
      await dashboardPage.goto();
      await expect(page).toHaveURL(/.*dashboard/);

      // Perform logout
      await realAuth.logout();

      // Should be redirected to login
      await expect(page).toHaveURL(/.*login/);
    }
  });
});
