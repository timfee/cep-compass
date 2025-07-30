import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 */
async function globalSetup(config: FullConfig) {
  // Only run auth setup if we have test credentials
  if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
    console.log('No test credentials provided, skipping auth setup');
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to login page
    await page.goto(config.projects[0].use.baseURL!);

    // Store any necessary auth state
    await page.context().storageState({ path: 'test-auth-state.json' });
  } catch (error) {
    console.error('Error during global setup:', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
