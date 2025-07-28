import { test, expect } from '../support/fixtures';
import { createSuperAdminUser, createMultiRoleUser } from '../support/fixtures/test-users';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page first to ensure localStorage is available
    await page.goto('/');
    
    // Then clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should redirect unauthenticated users to login', async ({ page, loginPage }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
    await loginPage.waitForLoad();
    await expect(loginPage.cardTitle).toContainText('CEP Compass');
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should display login page elements correctly', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.waitForLoad();

    await expect(loginPage.cardTitle).toContainText('CEP Compass');
    await expect(loginPage.loginButton).toContainText('Sign in with Google');
    await expect(await loginPage.getTitle()).toContain('CEP Compass');
  });

  test('should complete full authentication flow for single role user', async ({ 
    page, 
    loginPage, 
    dashboardPage, 
    authMock 
  }) => {
    const testUser = createSuperAdminUser();
    
    // Setup authentication for super admin user
    await authMock.setupUserAuth(testUser);
    await authMock.setupRoleSelection('superAdmin');

    // Navigate to app - should redirect to login
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);

    // Simulate login button click and successful auth
    await loginPage.waitForLoad();
    await loginPage.clickSignInButton();

    // Should redirect to dashboard (bypassing role selection for single role)
    await dashboardPage.waitForLoad();
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(dashboardPage.pageTitle).toContainText('CEP Compass Dashboard');
  });

  test('should handle role selection for multi-role user', async ({ 
    page, 
    loginPage, 
    selectRolePage, 
    dashboardPage, 
    authMock 
  }) => {
    const testUser = createMultiRoleUser();
    
    // Setup authentication for multi-role user without pre-selected role
    await authMock.setupUserAuth(testUser);

    // Navigate to app
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);

    // Login
    await loginPage.waitForLoad();
    await loginPage.clickSignInButton();

    // Should redirect to role selection
    await selectRolePage.waitForLoad();
    await expect(page).toHaveURL(/.*select-role/);

    // Verify available roles
    const availableRoles = await selectRolePage.getAvailableRoles();
    expect(availableRoles).toContain('Super Admin');
    expect(availableRoles).toContain('CEP Admin');

    // Select super admin role
    await selectRolePage.selectSuperAdmin();

    // Should redirect to dashboard
    await dashboardPage.waitForLoad();
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(dashboardPage.pageTitle).toContainText('CEP Compass Dashboard');
  });

  test('should remember role selection for returning user', async ({ 
    page, 
    loginPage, 
    dashboardPage, 
    authMock 
  }) => {
    const testUser = createMultiRoleUser();
    
    // Setup authentication with pre-selected role
    await authMock.setupUserAuth(testUser);
    await authMock.setupRoleSelection('superAdmin');

    // Navigate to app
    await page.goto('/');
    
    // Should bypass both login and role selection, go directly to dashboard
    await dashboardPage.waitForLoad();
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(dashboardPage.pageTitle).toContainText('CEP Compass Dashboard');
  });

  test('should handle logout and session cleanup', async ({ 
    page, 
    loginPage, 
    dashboardPage, 
    authMock 
  }) => {
    const testUser = createSuperAdminUser();
    
    // Setup authenticated state
    await authMock.setupUserAuth(testUser);
    await authMock.setupRoleSelection('superAdmin');

    // Navigate to dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Logout
    await dashboardPage.logout();

    // Should redirect to login
    await loginPage.waitForLoad();
    await expect(page).toHaveURL(/.*login/);

    // Verify session is cleared - trying to access protected page should redirect
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should block access to protected routes when not authenticated', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/admin', '/org-units', '/email-templates'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should handle authentication errors gracefully', async ({ page, loginPage }) => {
    // Mock authentication failure
    await page.route('**/accounts.google.com/**', (route) => {
      route.abort('failed');
    });

    await loginPage.goto();
    await loginPage.waitForLoad();
    
    // Try to login - should handle gracefully without crashing
    await loginPage.clickSignInButton();
    
    // Should remain on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(loginPage.loginButton).toBeVisible();
  });
});