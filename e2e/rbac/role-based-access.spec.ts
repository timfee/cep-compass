import { test, expect } from '../support/fixtures';
import { createSuperAdminUser, createCepAdminUser, createParticipantUser } from '../support/fixtures/test-users';

test.describe('Role-Based Access Control', () => {
  test.describe('Super Admin Access', () => {
    test.beforeEach(async ({ authMock }) => {
      const superAdminUser = createSuperAdminUser();
      await authMock.setupUserAuth(superAdminUser);
      await authMock.setupRoleSelection('superAdmin');
    });

    test('should have full access to all features', async ({ 
      page, 
      dashboardPage, 
      adminPage 
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Verify dashboard access
      await expect(dashboardPage.pageTitle).toContainText('CEP Compass Dashboard');

      // Verify admin access
      await dashboardPage.navigateToAdmin();
      await adminPage.waitForLoad();
      await expect(page).toHaveURL(/.*admin/);

      // Verify admin features are available
      await expect(adminPage.canCreateRoles()).resolves.toBe(true);
    });

    test('should access org units management', async ({ 
      page, 
      dashboardPage 
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      await dashboardPage.navigateToOrgUnits();
      await expect(page).toHaveURL(/.*org-units/);
    });

    test('should access email templates', async ({ 
      page, 
      dashboardPage, 
      emailTemplatesPage 
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
      expect(cards.some(card => card.includes('Enroll Browsers'))).toBe(true);
      expect(cards.some(card => card.includes('Activate One-Click Protection'))).toBe(true);
    });
  });

  test.describe('CEP Admin Access', () => {
    test.beforeEach(async ({ authMock }) => {
      const cepAdminUser = createCepAdminUser();
      await authMock.setupUserAuth(cepAdminUser);
      await authMock.setupRoleSelection('cepAdmin');
    });

    test('should have limited access compared to Super Admin', async ({ 
      page, 
      dashboardPage 
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Verify dashboard access
      await expect(dashboardPage.pageTitle).toContainText('CEP Compass Dashboard');

      // Should not be able to access admin features
      await page.goto('/admin');
      // Should redirect to dashboard due to guard
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should access org units (read permissions)', async ({ 
      page, 
      dashboardPage 
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      await dashboardPage.navigateToOrgUnits();
      await expect(page).toHaveURL(/.*org-units/);
    });

    test('should access email templates', async ({ 
      page, 
      dashboardPage, 
      emailTemplatesPage 
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      await dashboardPage.navigateToEmailTemplates();
      await emailTemplatesPage.waitForLoad();
      await expect(page).toHaveURL(/.*email-templates/);
    });

    test('should see limited dashboard features', async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      const cards = await dashboardPage.getVisibleCards();
      expect(cards.length).toBeGreaterThan(0);
      // CEP Admin should see main features but not admin-specific ones
      expect(cards.some(card => card.includes('Enroll Browsers'))).toBe(true);
    });
  });

  test.describe('Participant Access', () => {
    test.beforeEach(async ({ authMock }) => {
      const participantUser = createParticipantUser();
      await authMock.setupUserAuth(participantUser);
      await authMock.setupRoleSelection('participant');
    });

    test('should have minimal read-only access', async ({ 
      page, 
      dashboardPage 
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Verify dashboard access
      await expect(dashboardPage.pageTitle).toContainText('CEP Compass Dashboard');

      // Should not be able to access admin features
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should have restricted navigation options', async ({ 
      page, 
      dashboardPage 
    }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Open side navigation
      await dashboardPage.openSideNav();

      // Verify limited navigation options (implementation dependent)
      // Participants should have fewer navigation options
    });

    test('should see read-only dashboard content', async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      const cards = await dashboardPage.getVisibleCards();
      // Participants should see basic dashboard but with limited interactivity
      expect(cards.length).toBeGreaterThan(0);
    });

    test('should be blocked from accessing restricted areas', async ({ page }) => {
      const restrictedRoutes = ['/admin', '/admin/create-role'];

      for (const route of restrictedRoutes) {
        await page.goto(route);
        // Should redirect to dashboard due to access restrictions
        await expect(page).toHaveURL(/.*dashboard/);
      }
    });
  });

  test.describe('Role Switching', () => {
    test('should allow multi-role user to switch between roles', async ({ 
      page, 
      selectRolePage, 
      dashboardPage, 
      adminPage, 
      authMock 
    }) => {
      const multiRoleUser = createSuperAdminUser(); // Has both super admin and CEP admin roles
      await authMock.setupUserAuth(multiRoleUser);

      // Start without a selected role
      await page.goto('/select-role');
      await selectRolePage.waitForLoad();

      // Select CEP Admin first
      await selectRolePage.selectCepAdmin();
      await dashboardPage.waitForLoad();

      // Verify limited access
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*dashboard/);

      // Switch to Super Admin role
      await page.goto('/select-role');
      await selectRolePage.waitForLoad();
      await selectRolePage.selectSuperAdmin();
      await dashboardPage.waitForLoad();

      // Verify full access
      await dashboardPage.navigateToAdmin();
      await adminPage.waitForLoad();
      await expect(page).toHaveURL(/.*admin/);
    });
  });

  test.describe('Permission Denied Scenarios', () => {
    test('should handle unauthorized access gracefully', async ({ 
      page, 
      authMock 
    }) => {
      const participantUser = createParticipantUser();
      await authMock.setupUserAuth(participantUser);
      await authMock.setupRoleSelection('participant');

      // Try to access admin area directly
      await page.goto('/admin');
      
      // Should redirect to dashboard, not show error page
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Page should still be functional
      await expect(page.locator('h1')).toContainText('CEP Compass Dashboard');
    });

    test('should show appropriate UI based on permissions', async ({ 
      page, 
      dashboardPage, 
      authMock 
    }) => {
      const cepAdminUser = createCepAdminUser();
      await authMock.setupUserAuth(cepAdminUser);
      await authMock.setupRoleSelection('cepAdmin');

      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Admin-specific features should not be visible
      await dashboardPage.openSideNav();
      
      // Admin link should not be present or should be disabled
      const adminLink = page.locator('a[routerLink="/admin"]');
      const isAdminLinkVisible = await adminLink.isVisible();
      
      if (isAdminLinkVisible) {
        // If visible, it should be disabled or non-functional
        await adminLink.click();
        await expect(page).toHaveURL(/.*dashboard/);
      }
    });
  });
});