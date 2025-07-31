import { test, expect } from './support/fixtures';
import { RealAuth } from './support/helpers/real-auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ realAuth }) => {
    const adminCreds = RealAuth.getAdminCredentials();
    test.skip(!adminCreds, 'Admin credentials not available');
    
    if (adminCreds) {
      await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);
      await realAuth.selectRole('superAdmin');
    }
  });

  test('should show dashboard cards', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Check for dashboard title
    await expect(dashboardPage.pageTitle).toContainText(
      'CEP Compass Dashboard',
    );

    // Check for main dashboard cards
    await expect(dashboardPage.dashboardCards.first()).toBeVisible();
    await expect(dashboardPage.enrollBrowsersCard).toBeVisible();
    await expect(dashboardPage.oneClickProtectionCard).toBeVisible();
  });

  test('should navigate to sections from dashboard cards', async ({
    page,
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Click first "Get Started" button if available
    const getStartedButtons = await dashboardPage.getStartedButtons.all();
    if (getStartedButtons.length > 0) {
      await getStartedButtons[0].click();

      // Just check that navigation happened to a valid route
      await page.waitForURL(
        /.*\/(admin|enrollment|security|org-units|email-templates|directory-stats)/,
      );
    }
  });
});
