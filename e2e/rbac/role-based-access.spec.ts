import { test, expect } from '../support/fixtures';
import { RealAuth } from '../support/helpers/real-auth';

test.describe('Role-Based Access Control', () => {
  test.describe('Super Admin Access', () => {
    test.beforeEach(async ({ realAuth }) => {
      const adminCreds = RealAuth.getAdminCredentials();
      test.skip(!adminCreds, 'Admin credentials not available');
      
      if (adminCreds) {
        await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);
        // Select super admin role if role selection is available
        await realAuth.selectRole('superAdmin');
      }
    });

    test('should have full access to all features', async ({
      page,
      dashboardPage,
      adminPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Verify dashboard access
      await expect(dashboardPage.pageTitle).toContainText(
        'CEP Compass Dashboard',
      );

      // Verify admin access
      await dashboardPage.navigateToAdmin();
      await adminPage.waitForLoad();
      await expect(page).toHaveURL(/.*admin/);

      // Verify admin features are available
      await expect(adminPage.canCreateRoles()).resolves.toBe(true);
    });

    test('should access org units management', async ({
      page,
      dashboardPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      await dashboardPage.navigateToOrgUnits();
      await expect(page).toHaveURL(/.*org-units/);
    });

    test('should access email templates', async ({
      page,
      dashboardPage,
      emailTemplatesPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      await dashboardPage.navigateToEmailTemplates();
      await emailTemplatesPage.waitForLoad();
      await expect(page).toHaveURL(/.*email-templates/);
    });

    test('should see all dashboard cards', async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      const cards = await dashboardPage.getVisibleCards();
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.some((card) => card.includes('Enroll Browsers'))).toBe(true);
      expect(
        cards.some((card) => card.includes('Activate One-Click Protection')),
      ).toBe(true);
    });
  });

  test.describe('CEP Admin Access', () => {
    test.beforeEach(async ({ realAuth }) => {
      const userCreds = RealAuth.getUserCredentials();
      test.skip(!userCreds, 'User credentials not available');
      
      if (userCreds) {
        await realAuth.loginWithGoogle(userCreds.email, userCreds.password);
        // Try to select CEP admin role if available, fallback to participant
        try {
          await realAuth.selectRole('cepAdmin');
        } catch {
          await realAuth.selectRole('participant');
        }
      }
    });

    test('should have limited access compared to Super Admin', async ({
      page,
      dashboardPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Verify dashboard access
      await expect(dashboardPage.pageTitle).toContainText(
        'CEP Compass Dashboard',
      );

      // Should not be able to access admin features
      await page.goto('/admin');
      // Should redirect to dashboard due to guard
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should access org units (read permissions)', async ({
      page,
      dashboardPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      await dashboardPage.navigateToOrgUnits();
      await expect(page).toHaveURL(/.*org-units/);
    });

    test('should access email templates', async ({
      page,
      dashboardPage,
      emailTemplatesPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      await dashboardPage.navigateToEmailTemplates();
      await emailTemplatesPage.waitForLoad();
      await expect(page).toHaveURL(/.*email-templates/);
    });

    test('should see limited dashboard features', async ({
      dashboardPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      const cards = await dashboardPage.getVisibleCards();
      expect(cards.length).toBeGreaterThan(0);

      // CEP Admin should see enrollment and protection features
      expect(cards.some((card) => card.includes('Enroll Browsers'))).toBe(true);
      expect(
        cards.some((card) => card.includes('Activate One-Click Protection')),
      ).toBe(true);
    });
  });

  test.describe('Participant Access', () => {
    test.beforeEach(async ({ realAuth }) => {
      const userCreds = RealAuth.getUserCredentials();
      test.skip(!userCreds, 'User credentials not available');
      
      if (userCreds) {
        await realAuth.loginWithGoogle(userCreds.email, userCreds.password);
        await realAuth.selectRole('participant');
      }
    });

    test('should have minimal read-only access', async ({
      page,
      dashboardPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Verify dashboard access
      await expect(dashboardPage.pageTitle).toContainText(
        'CEP Compass Dashboard',
      );

      // Should not be able to access admin features
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should have restricted navigation options', async ({
      dashboardPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Participant should have limited navigation options
      const navItems = await dashboardPage.getNavigationItems();
      expect(navItems.some((item) => item.includes('Admin'))).toBe(false);
    });

    test('should see read-only dashboard content', async ({
      dashboardPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      const cards = await dashboardPage.getVisibleCards();
      expect(cards.length).toBeGreaterThan(0);

      // Participant should see basic information cards
      expect(cards.some((card) => card.includes('Dashboard'))).toBe(true);
    });

    test('should be blocked from accessing restricted areas', async ({
      page,
    }) => {
      const restrictedRoutes = ['/admin', '/role-management'];

      for (const route of restrictedRoutes) {
        await page.goto(route);
        // Should redirect to dashboard due to insufficient permissions
        await expect(page).toHaveURL(/.*dashboard/);
      }
    });
  });

  test.describe('Role Switching', () => {
    test('should allow multi-role user to switch between roles', async ({
      page,
      selectRolePage,
      dashboardPage,
      realAuth,
    }) => {
      // This test requires a user with multiple roles - skip if not available
      const adminCreds = RealAuth.getAdminCredentials();
      test.skip(!adminCreds, 'Admin credentials not available for multi-role test');

      if (adminCreds) {
        await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);

        // Navigate to role selection
        await selectRolePage.goto();
        await selectRolePage.waitForLoad();

        // Should show available roles
        const availableRoles = await selectRolePage.getAvailableRoles();
        expect(availableRoles.length).toBeGreaterThan(0);

        // Select a role
        if (availableRoles.length > 0) {
          await selectRolePage.selectRole(availableRoles[0]);
          await expect(page).toHaveURL(/.*dashboard/);
        }

        // Try switching roles again
        await selectRolePage.goto();
        if (availableRoles.length > 1) {
          await selectRolePage.selectRole(availableRoles[1]);
          await expect(page).toHaveURL(/.*dashboard/);
        }
      }
    });
  });

  test.describe('Permission Denied Scenarios', () => {
    test('should handle unauthorized access gracefully', async ({
      page,
      realAuth,
    }) => {
      const userCreds = RealAuth.getUserCredentials();
      test.skip(!userCreds, 'User credentials not available');

      if (userCreds) {
        await realAuth.loginWithGoogle(userCreds.email, userCreds.password);
        await realAuth.selectRole('participant');

        // Try to access admin endpoint
        await page.goto('/admin');

        // Should redirect or show error, not crash
        const url = page.url();
        expect(url).toMatch(/dashboard|error|access-denied/);
      }
    });

    test('should show appropriate UI based on permissions', async ({
      dashboardPage,
      realAuth,
    }) => {
      const userCreds = RealAuth.getUserCredentials();
      test.skip(!userCreds, 'User credentials not available');

      if (userCreds) {
        await realAuth.loginWithGoogle(userCreds.email, userCreds.password);
        await realAuth.selectRole('participant');

        await dashboardPage.goto();
        await dashboardPage.waitForLoad();

        // UI should reflect current user's permissions
        const hasAdminAccess = await dashboardPage.hasAdminNavigation();
        expect(hasAdminAccess).toBe(false);
      }
    });
  });
});
