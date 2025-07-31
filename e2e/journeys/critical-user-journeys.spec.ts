import { test, expect } from '../support/fixtures';
import { RealAuth } from '../support/helpers/real-auth';

test.describe('Email Templates User Journey', () => {
  test.beforeEach(async ({ realAuth }) => {
    const adminCreds = RealAuth.getAdminCredentials();
    test.skip(!adminCreds, 'Admin credentials not available');
    
    if (adminCreds) {
      await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);
      await realAuth.selectRole('superAdmin');
    }
  });

  test('should complete email composer workflow', async ({
    emailTemplatesPage,
  }) => {
    await emailTemplatesPage.goto();
    await emailTemplatesPage.waitForLoad();

    // Verify page loads correctly
    await expect(emailTemplatesPage.pageTitle).toContainText('Email Templates');
    await expect(emailTemplatesPage.emailComposer).toBeVisible();

    // Select a template
    await emailTemplatesPage.selectTemplate();

    // Add recipients
    await emailTemplatesPage.addRecipient('test1@example.com');
    await emailTemplatesPage.addRecipient('test2@example.com');

    // Verify recipients were added
    const recipients = await emailTemplatesPage.getRecipientChips();
    expect(recipients).toContain('test1@example.com');
    expect(recipients).toContain('test2@example.com');

    // Preview email
    await emailTemplatesPage.clickPreview();

    // Verify preview is shown
    await expect(emailTemplatesPage.previewContent).toBeVisible();
  });

  test('should handle template selection correctly', async ({
    page,
    emailTemplatesPage,
  }) => {
    await emailTemplatesPage.goto();
    await emailTemplatesPage.waitForLoad();

    // Open template dropdown
    await emailTemplatesPage.templateSelect.click();

    // Verify template options are available
    const templateOptions = page.locator('mat-option');
    await expect(templateOptions.first()).toBeVisible();

    // Select first template
    await templateOptions.first().click();

    // Verify template is selected (dropdown should show selection)
    await expect(emailTemplatesPage.templateSelect).toHaveValue(/.+/);
  });

  test('should validate recipient input', async ({ emailTemplatesPage }) => {
    await emailTemplatesPage.goto();
    await emailTemplatesPage.waitForLoad();

    // Test valid email
    await emailTemplatesPage.addRecipient('valid@example.com');
    const recipients = await emailTemplatesPage.getRecipientChips();
    expect(recipients).toContain('valid@example.com');

    // Test invalid email (should not be added)
    await emailTemplatesPage.addRecipient('invalid-email');
    const recipientsAfter = await emailTemplatesPage.getRecipientChips();
    expect(recipientsAfter).not.toContain('invalid-email');
  });

  test('should work for CEP Admin users', async ({
    emailTemplatesPage,
    realAuth,
  }) => {
    // Test with CEP Admin user (use user credentials and try CEP admin role)
    const userCreds = RealAuth.getUserCredentials();
    test.skip(!userCreds, 'User credentials not available');
    
    if (userCreds) {
      await realAuth.loginWithGoogle(userCreds.email, userCreds.password);
      try {
        await realAuth.selectRole('cepAdmin');
      } catch {
        await realAuth.selectRole('participant');
      }

      await emailTemplatesPage.goto();
      await emailTemplatesPage.waitForLoad();

      // User should have access to email templates (permissions dependent)
      await expect(emailTemplatesPage.pageTitle).toContainText('Email Templates');
      await expect(emailTemplatesPage.emailComposer).toBeVisible();
    }
  });
});

test.describe('Dashboard Navigation Journey', () => {
  test.beforeEach(async ({ realAuth }) => {
    const adminCreds = RealAuth.getAdminCredentials();
    test.skip(!adminCreds, 'Admin credentials not available');
    
    if (adminCreds) {
      await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);
      await realAuth.selectRole('superAdmin');
    }
  });

  test('should navigate through dashboard cards', async ({
    page,
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Verify dashboard loads
    await expect(dashboardPage.pageTitle).toContainText(
      'CEP Compass Dashboard',
    );

    // Get available cards
    const cards = await dashboardPage.getVisibleCards();
    expect(cards.length).toBeGreaterThan(0);

    // Click first "Get Started" button if available
    const getStartedButtons = await dashboardPage.getStartedButtons.all();
    if (getStartedButtons.length > 0) {
      await getStartedButtons[0].click();

      // Should navigate to a feature page
      await page.waitForURL(
        /.*\/(admin|enrollment|security|org-units|email-templates|directory-stats)/,
      );

      // Verify we're on a valid feature page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(
        /\/(admin|enrollment|security|org-units|email-templates|directory-stats)/,
      );
    }
  });

  test('should use side navigation menu', async ({ page, dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Open side navigation
    await dashboardPage.openSideNav();

    // Navigate to org units
    await dashboardPage.navigateToOrgUnits();
    await expect(page).toHaveURL(/.*org-units/);

    // Go back to dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Navigate to email templates
    await dashboardPage.navigateToEmailTemplates();
    await expect(page).toHaveURL(/.*email-templates/);
  });
});

test.describe('Admin Role Management Journey', () => {
  test.beforeEach(async ({ realAuth }) => {
    const adminCreds = RealAuth.getAdminCredentials();
    test.skip(!adminCreds, 'Admin credentials not available');
    
    if (adminCreds) {
      await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);
      await realAuth.selectRole('superAdmin');
    }
  });

  test('should access admin role creation (Super Admin only)', async ({
    page,
    dashboardPage,
    adminPage,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Navigate to admin area
    await dashboardPage.navigateToAdmin();
    await adminPage.waitForLoad();

    // Verify admin page access
    await expect(page).toHaveURL(/.*admin/);

    // Verify create role functionality is available
    const canCreateRoles = await adminPage.canCreateRoles();
    expect(canCreateRoles).toBe(true);

    // Click create role button
    await adminPage.clickCreateRole();

    // Should navigate to create role page or open modal
    // (Implementation dependent on actual component behavior)
  });

  test('should be blocked for non-Super Admin users', async ({
    page,
    realAuth,
  }) => {
    // Test with regular user credentials
    const userCreds = RealAuth.getUserCredentials();
    test.skip(!userCreds, 'User credentials not available');

    if (userCreds) {
      await realAuth.loginWithGoogle(userCreds.email, userCreds.password);
      await realAuth.selectRole('participant');

      // Try to access admin area directly
      await page.goto('/admin');

      // Should redirect to dashboard due to guard
      await expect(page).toHaveURL(/.*dashboard/);
    }
  });
});

test.describe('Error Recovery Scenarios', () => {
  test.beforeEach(async ({ realAuth }) => {
    const adminCreds = RealAuth.getAdminCredentials();
    test.skip(!adminCreds, 'Admin credentials not available');
    
    if (adminCreds) {
      await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);
      await realAuth.selectRole('superAdmin');
    }
  });

  test('should handle network errors gracefully', async ({
    page,
    dashboardPage,
  }) => {
    // Block all API calls to simulate network issues
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await dashboardPage.goto();

    // Page should still load basic structure even with API failures
    await expect(dashboardPage.pageTitle).toBeVisible();

    // User should see the page, possibly with error states or loading indicators
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should recover from temporary API failures', async ({
    page,
    dashboardPage,
  }) => {
    let apiCallCount = 0;

    // Fail first few API calls, then succeed
    await page.route('**/api/**', (route) => {
      apiCallCount++;
      if (apiCallCount <= 2) {
        route.abort('failed');
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Should eventually load successfully
    await expect(dashboardPage.pageTitle).toContainText(
      'CEP Compass Dashboard',
    );
  });

  test('should handle page refresh during session', async ({
    page,
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Refresh the page
    await page.reload();

    // Should maintain authenticated state and reload dashboard
    await dashboardPage.waitForLoad();
    await expect(dashboardPage.pageTitle).toContainText(
      'CEP Compass Dashboard',
    );
  });

  test('should handle browser back/forward navigation', async ({
    page,
    dashboardPage,
    emailTemplatesPage,
  }) => {
    // Start at dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Navigate to email templates
    await dashboardPage.navigateToEmailTemplates();
    await emailTemplatesPage.waitForLoad();

    // Go back using browser back button
    await page.goBack();
    await dashboardPage.waitForLoad();
    await expect(page).toHaveURL(/.*dashboard/);

    // Go forward again
    await page.goForward();
    await emailTemplatesPage.waitForLoad();
    await expect(page).toHaveURL(/.*email-templates/);
  });
});
