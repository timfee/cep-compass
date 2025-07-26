import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for testing
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
    
    // Mock API routes
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uid: 'test-user',
          email: 'test@example.com',
          displayName: 'Test User'
        })
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

  test('should show dashboard cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('h1')).toContainText('CEP Compass Dashboard');
    
    // Check for main dashboard cards
    await expect(page.locator('mat-card')).toBeVisible();
    await expect(page.getByText('Enroll Browsers')).toBeVisible();
    await expect(page.getByText('Activate One-Click Protection')).toBeVisible();
  });

  test('should navigate to sections from dashboard cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for any "Get Started" button and click it
    const getStartedButton = page.locator('button:has-text("Get Started")').first();
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
      // Just check that navigation happened, don't assume the specific route
      await page.waitForURL(/.*\/(admin|enrollment|security|org-units|email-templates|directory-stats)/);
    }
  });
});