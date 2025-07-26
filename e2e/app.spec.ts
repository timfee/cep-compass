import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show login page elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('mat-card-title')).toContainText('CEP Compass');
    await expect(page.locator('button')).toContainText('Sign in with Google');
  });

  test('should have correct title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/CEP Compass/);
  });
});
