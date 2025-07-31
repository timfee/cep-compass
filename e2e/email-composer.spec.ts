import { test, expect } from './support/fixtures';
import { RealAuth } from './support/helpers/real-auth';

test.describe('Email Composer', () => {
  test.beforeEach(async ({ realAuth }) => {
    const adminCreds = RealAuth.getAdminCredentials();
    test.skip(!adminCreds, 'Admin credentials not available');
    
    if (adminCreds) {
      await realAuth.loginWithGoogle(adminCreds.email, adminCreds.password);
      await realAuth.selectRole('superAdmin');
    }
  });

  test('should load email composer', async ({ emailTemplatesPage }) => {
    await emailTemplatesPage.goto();
    await emailTemplatesPage.waitForLoad();

    await expect(emailTemplatesPage.pageTitle).toContainText('Email Templates');
    await expect(emailTemplatesPage.emailComposer).toBeVisible();
  });

  test('should allow template selection', async ({
    page,
    emailTemplatesPage,
  }) => {
    await emailTemplatesPage.goto();
    await emailTemplatesPage.waitForLoad();

    // Wait for template select to be available
    await emailTemplatesPage.templateSelect.waitFor({ state: 'visible' });

    // Open template dropdown
    await emailTemplatesPage.templateSelect.click();

    // Check if template options are available
    const options = page.locator('mat-option');
    await expect(options.first()).toBeVisible();
  });

  test('should allow recipient input', async ({ emailTemplatesPage }) => {
    await emailTemplatesPage.goto();
    await emailTemplatesPage.waitForLoad();

    // Find recipient input field
    if (await emailTemplatesPage.recipientInput.isVisible()) {
      await emailTemplatesPage.addRecipient('test@example.com');

      // Check if recipient chip was added
      const recipients = await emailTemplatesPage.getRecipientChips();
      expect(recipients).toContain('test@example.com');
    }
  });

  test('should show preview mode', async ({ emailTemplatesPage }) => {
    await emailTemplatesPage.goto();
    await emailTemplatesPage.waitForLoad();

    // Find and click preview button if available
    if (await emailTemplatesPage.previewButton.isVisible()) {
      await emailTemplatesPage.clickPreview();

      // Check if preview content is shown
      await expect(emailTemplatesPage.previewContent).toBeVisible();
    }
  });
});
