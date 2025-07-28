import { test, expect } from './support/fixtures';

test.describe('App Smoke Tests', () => {
  test('should redirect to login when not authenticated', async ({ page, loginPage }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
    await loginPage.waitForLoad();
  });

  test('should show login page elements', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.waitForLoad();
    await expect(loginPage.cardTitle).toContainText('CEP Compass');
    await expect(loginPage.loginButton).toContainText('Sign in with Google');
  });

  test('should have correct title', async ({ loginPage }) => {
    await loginPage.goto();
    await expect(await loginPage.getTitle()).toContain('CEP Compass');
  });
});
