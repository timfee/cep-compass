import { test, expect } from '../support/fixtures';
import { createSuperAdminUser, createMultiRoleUser } from '../support/fixtures/test-users';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, authMock }) => {
    // Navigate to a page first to ensure localStorage is available, then clear
    await page.goto('/');
    await authMock.clearAuth();
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

  test('should handle authenticated user with selected role', async ({ 
    page, 
    dashboardPage, 
    authMock 
  }) => {
    const testUser = createSuperAdminUser();
    
    // Setup authenticated user with selected role
    await authMock.setupAuthenticatedUser(testUser, 'superAdmin');

    // Navigate to app - should go directly to dashboard
    await page.goto('/');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show dashboard for authenticated user', async ({ 
    page, 
    dashboardPage, 
    authMock 
  }) => {
    const testUser = createSuperAdminUser();
    await authMock.setupAuthenticatedUser(testUser, 'superAdmin');

    await dashboardPage.goto();
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(dashboardPage.dashboardCards.first()).toBeVisible();
  });

  test('should handle role selection page access', async ({ 
    page, 
    selectRolePage, 
    authMock 
  }) => {
    const testUser = createMultiRoleUser();
    
    // Setup authenticated user without selected role
    await authMock.setupAuthenticatedUser(testUser);

    // Navigate to role selection
    await selectRolePage.goto();
    await selectRolePage.waitForLoad();
    await expect(page).toHaveURL(/.*select-role/);

    // Should show available roles
    const availableRoles = await selectRolePage.getAvailableRoles();
    expect(availableRoles.length).toBeGreaterThan(0);
  });

  test('should block access to protected routes when not authenticated', async ({ page, authMock }) => {
    await authMock.clearAuth();
    
    const protectedRoutes = ['/dashboard', '/admin', '/org-units', '/email-templates'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should handle logout flow', async ({ 
    page, 
    loginPage, 
    dashboardPage, 
    authMock 
  }) => {
    const testUser = createSuperAdminUser();
    
    // Setup authenticated state
    await authMock.setupAuthenticatedUser(testUser, 'superAdmin');

    // Navigate to dashboard
    await dashboardPage.goto();
    await expect(page).toHaveURL(/.*dashboard/);

    // Clear auth (simulating logout)
    await authMock.clearAuth();

    // Try to access protected page - should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});