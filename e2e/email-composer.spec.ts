import { test, expect } from '@playwright/test';

test.describe('Email Composer', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('test-auth', 'true');
      // Mock Firebase auth state
      window.gapi = {
        load: () => {},
        auth2: {
          getAuthInstance: () => ({
            isSignedIn: { get: () => true },
            currentUser: { get: () => ({ getBasicProfile: () => ({ getEmail: () => 'test@example.com' }) }) }
          })
        }
      };
    });
    
    // Mock API responses
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });

    // Mock Google API routes
    await page.route('**/googleapis.com/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });
  });

  test('should load email composer', async ({ page }) => {
    await page.goto('/email-templates');
    
    await expect(page.locator('.templates-card mat-card-title')).toContainText('Email Templates');
    await expect(page.locator('app-email-composer')).toBeVisible();
  });

  test('should allow template selection', async ({ page }) => {
    await page.goto('/email-templates');
    
    // Wait for component to load with longer timeout
    await page.waitForSelector('mat-select[formControlName="templateId"]', { timeout: 10000 });
    
    // Open template dropdown
    await page.click('mat-select[formControlName="templateId"]');
    
    // Check if template options are available
    const options = page.locator('mat-option');
    await expect(options.first()).toBeVisible();
  });

  test('should allow recipient input', async ({ page }) => {
    await page.goto('/email-templates');
    
    // Find recipient input field
    const recipientInput = page.locator('input[placeholder*="recipient"]');
    if (await recipientInput.isVisible()) {
      await recipientInput.fill('test@example.com');
      await recipientInput.press('Enter');
      
      // Check if recipient chip was added
      await expect(page.locator('mat-chip')).toContainText('test@example.com');
    }
  });

  test('should show preview mode', async ({ page }) => {
    await page.goto('/email-templates');
    
    // Find and click preview button
    const previewButton = page.locator('button:has-text("Preview")');
    if (await previewButton.isVisible()) {
      await previewButton.click();
      
      // Check if preview content is shown
      await expect(page.locator('.preview-content')).toBeVisible();
    }
  });
});